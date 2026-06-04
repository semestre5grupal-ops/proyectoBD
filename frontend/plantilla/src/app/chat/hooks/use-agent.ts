/**
 * use-agent.ts
 * ------------
 * HOOK ORQUESTADOR DEL AGENTE ERP
 * Proyecto RDA3 · Módulo de Inventario (Paul)
 *
 * Este hook implementa el pipeline completo:
 *
 *   Voz (Web Speech API)
 *     ↓
 *   Texto del usuario
 *     ↓
 *   ollamaService.chatOllama() → streaming NDJSON
 *     ↓
 *   parseAgentResponse()       → validar JSON + seguridad de rol
 *     ↓
 *   TareaInventario en estado 'pendiente'
 *     ↓
 *   ¿confirmacion_requerida?
 *     Sí → TaskCard en UI (el usuario confirma manualmente)
 *     No → ejecutarTarea() directamente
 *     ↓
 *   inventarioService.*()      → POST/GET al API de Render con JWT
 *
 * Golden Rules:
 *  ✅ Un solo punto de entrada de lógica de negocio del agente.
 *  ✅ Los componentes de UI solo llaman sendMessage() / confirmTask() / rejectTask().
 *  ✅ No hace fetch directo — delega a ollamaService e inventarioService.
 */

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { chatOllama, type OllamaMessage } from '@/services/ollamaService';
import {
  ingresarStock,
  descontarStock,
  consultarStock,
  sincronizarCloud,
  crearNotificacionTarea,
  marcarNotificacionEjecutada,
  aprobarAjusteCabecera,
  crearAjusteCabeceraPendiente,
  aprobarRecepcionCabecera,
  aprobarEntregaCabecera,
} from '@/services/inventarioService';
import {
  SYSTEM_PROMPTS,
  mapearRolJWT,
} from '@/app/chat/prompts/system-prompts';
import {
  PERMISOS_POR_ROL,
  type TareaInventario,
  type MensajeERP,
  type RolInventario,
  type RespuestaAgente,
  type AccionInventario,
} from '@/app/chat/types/erp-agent';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DEL HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseAgentState {
  /** Mensajes del chat (texto, thinking, task_card) */
  mensajes: MensajeERP[];
  /** La IA está generando respuesta */
  agentThinking: boolean;
  /** Error del pipeline (Ollama caído, JSON inválido, API error) */
  agentError: string | null;
  /** Rol actual del usuario autenticado */
  rolActivo: RolInventario;
  /** Nombre del usuario autenticado */
  nombreUsuario: string;
  /** ¿El micrófono está escuchando actualmente? */
  escuchando: boolean;
}

export interface UseAgentActions {
  /** Envía un mensaje de texto al agente */
  sendMessage: (texto: string) => Promise<void>;
  /** Activa/desactiva el reconocimiento de voz */
  toggleVoz: () => void;
  /** Confirma la ejecución de una TareaInventario pendiente */
  confirmarTarea: (tareaId: string, cantidadReal?: number) => Promise<void>;
  /** Rechaza una TareaInventario pendiente */
  rechazarTarea: (tareaId: string) => void;
  /** Cancela la generación en curso */
  cancelarGeneracion: () => void;
  /** Limpia el error actual */
  limpiarError: () => void;
  /**
   * Inyecta un mensaje sintético del agente en el chat SIN invocar Ollama.
   * Usado por la rutina de bienvenida asíncrona de page.tsx.
   */
  inyectarMensajeAgente: (texto: string) => void;
  /**
   * Inyecta una TaskCard en el chat, típicamente usada al cargar
   * las notificaciones pendientes recuperadas del backend.
   */
  inyectarTaskCardAgente: (tareaBase: Omit<TareaInventario, 'id' | 'timestamp' | 'confirmacion_requerida'> & { id?: string }) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lee el JWT del localStorage y extrae el rol del usuario.
 * Reutiliza la misma lógica que dashboard-inventario/page.tsx.
 */
function leerSesionDesdeJWT(): { rol: RolInventario; nombre: string } {
  const DEFAULT = { rol: 'JEFE_INVENTARIO' as RolInventario, nombre: 'Usuario' };
  const token = localStorage.getItem('jwt_token');
  if (!token) return DEFAULT;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return DEFAULT;
    const payload = JSON.parse(atob(parts[1])) as {
      id_rol?: number;
      rol?: string;
      usu_nombre?: string;
    };
    return {
      rol: mapearRolJWT(payload),
      nombre: payload.usu_nombre ?? 'Usuario',
    };
  } catch {
    return DEFAULT;
  }
}

/**
 * Parsea la respuesta completa de texto de Ollama y la valida.
 * Ollama puede envolver el JSON en ```json ... ``` — lo extrae.
 * Si el JSON es inválido o incompleto, devuelve un INFORMATIVO seguro.
 */
function parseAgentResponse(
  texto: string,
  rolActivo: RolInventario,
  instruccion_original: string,
  nombreUsuario: string
): TareaInventario {
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  const fallback = (mensaje: string): TareaInventario => ({
    id,
    accion: 'INFORMATIVO',
    payload: {},
    confirmacion_requerida: false,
    mensaje_usuario: mensaje,
    estado: 'pendiente',
    timestamp,
    rol_origen: rolActivo,
    instruccion_original,
  });

  // ── Extraer bloque JSON del texto (puede venir en ```json ... ```) ──────────
  let jsonStr = texto.trim();
  const markdownMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch) {
    jsonStr = markdownMatch[1].trim();
  }

  // Buscar el primer { y el último } para extraer el objeto JSON
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    return fallback('La IA devolvió una respuesta no estructurada. Intenta reformular tu instrucción.');
  }
  jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);

  // ── Parsear el JSON ───────────────────────────────────────────────────────
  let parsed: RespuestaAgente;
  try {
    parsed = JSON.parse(jsonStr) as RespuestaAgente;
  } catch {
    return fallback('Error al interpretar la respuesta de la IA. Vuelve a intentarlo.');
  }

  // ── Validar campos mínimos ────────────────────────────────────────────────
  if (!parsed.accion || typeof parsed.mensaje_usuario !== 'string') {
    return fallback('La IA devolvió un formato incorrecto. Intenta ser más específico.');
  }

  // ── Validar permisos de rol (segunda línea de defensa tras el system prompt) ──
  const permisosDelRol = PERMISOS_POR_ROL[rolActivo];
  const accion: AccionInventario = parsed.accion;
  if (!permisosDelRol.includes(accion)) {
    return fallback(
      `La acción "${accion}" no está permitida para tu rol (${rolActivo}). Contacta al Jefe de Inventario.`
    );
  }

  // ── Inyectar nombre de usuario si el payload no lo incluye ────────────────
  const payload = {
    ...parsed.payload,
    usuario: parsed.payload?.usuario ?? nombreUsuario,
  };

  return {
    id,
    accion,
    payload,
    confirmacion_requerida: parsed.confirmacion_requerida ?? false,
    mensaje_usuario: parsed.mensaje_usuario,
    estado: 'pendiente',
    timestamp,
    rol_origen: rolActivo,
    // Propagar rol_destino del JSON de Ollama si existe
    rol_destino: (parsed.rol_destino as RolInventario | undefined) ?? undefined,
    instruccion_original,
  };
}

/**
 * Crea un MensajeERP de tipo 'task_card' desde una TareaInventario.
 */
function crearMensajeTarea(tarea: TareaInventario): MensajeERP {
  return {
    id: `msg-${tarea.id}-${Date.now()}`,
    content: tarea.mensaje_usuario,
    timestamp: tarea.timestamp,
    senderId: 'agent',
    type: 'task_card',
    isEdited: false,
    reactions: [],
    replyTo: null,
    tarea,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDAD DE VOZ NATIVA — SpeechSynthesis (HTML5)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convierte texto a voz usando la API nativa window.speechSynthesis.
 * Fuerza idioma español Ecuador (es-EC) con fallback a es-ES.
 * Se cancela cualquier locución previa antes de iniciar la nueva.
 *
 * @param texto - Texto a leer en voz alta.
 */
export function emitirVoz(texto: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancelar locución previa para no acumular cola
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);

  // Intentar voz en español Ecuador; si el navegador no la soporta,
  // speechSynthesis usará la voz disponible más cercana (es-ES u otra).
  utterance.lang = 'es-EC';
  utterance.rate = 1.0;   // velocidad normal
  utterance.pitch = 1.0;  // tono normal
  utterance.volume = 1.0; // volumen máximo

  // Fallback: si el navegador reporta voces disponibles y ninguna es es-EC,
  // buscar es-ES como segunda opción antes de dejar que el SO elija.
  const voces = window.speechSynthesis.getVoices();
  if (voces.length > 0) {
    const vozEC = voces.find(v => v.lang === 'es-EC');
    const vozES = voces.find(v => v.lang === 'es-ES');
    const vozGen = voces.find(v => v.lang.startsWith('es'));
    utterance.voice = vozEC ?? vozES ?? vozGen ?? null;
  }

  window.speechSynthesis.speak(utterance);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function useAgent(): UseAgentState & UseAgentActions {
  // ── Sesión del usuario (leída del JWT al montar) ───────────────────────────
  const sesion = leerSesionDesdeJWT();

  // ── Estado central ─────────────────────────────────────────────────────────
  const [mensajes, setMensajes] = useState<MensajeERP[]>([]);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [rolActivo] = useState<RolInventario>(sesion.rol);
  const [nombreUsuario] = useState<string>(sesion.nombre);
  const [escuchando, setEscuchando] = useState(false);

  // ── Refs para control de streaming, tarea pendiente y reconocimiento de voz ─────
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const historialRef = useRef<OllamaMessage[]>([]); // historial de conversación
  /**
   * pendingTaskRef: referencia a la TareaInventario cuya TaskCard está visible
   * y esperando acción humana. Se usa para el control de confirmación por voz.
   * null = no hay tarea activa esperando confirmación.
   */
  const pendingTaskRef = useRef<TareaInventario | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Añadir mensaje a la lista
  // ═══════════════════════════════════════════════════════════════════════════

  const agregarMensaje = useCallback((msg: MensajeERP) => {
    setMensajes(prev => [...prev, msg]);
  }, []);

  const actualizarUltimoMensaje = useCallback((delta: string) => {
    setMensajes(prev => {
      const copia = [...prev];
      const ultimo = copia[copia.length - 1];
      if (ultimo && ultimo.senderId === 'agent' && ultimo.type === 'text') {
        copia[copia.length - 1] = { ...ultimo, content: ultimo.content + delta };
      }
      return copia;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Ejecutar una TareaInventario contra inventarioService
  // ═══════════════════════════════════════════════════════════════════════════

  const ejecutarTarea = useCallback(async (tarea: TareaInventario): Promise<void> => {
    const { accion, payload } = tarea;

    // ── Pre-flight: verificar que haya token antes de llamar al backend ──────
    // Evita que inventarioService lance SESION_EXPIRADA cuando nunca hubo token.
    const tokenActual = localStorage.getItem('jwt_token');
    if (!tokenActual) {
      setAgentError('Sesión no encontrada. Por favor inicia sesión para ejecutar esta acción.');
      setMensajes(prev =>
        prev.map(m =>
          m.tarea?.id === tarea.id ? { ...m, tarea: { ...m.tarea!, estado: 'error' } } : m
        )
      );
      return;
    }

    try {
      // Usamos 'any' porque las respuestas específicas (ej. IngresarStockResponse) 
      // no tienen index signature estricta para Record<string, unknown>.
      let resultado: any;

      switch (accion) {
        case 'INGRESAR_STOCK': {
          if (
            payload.idVariante == null ||
            payload.cantidad == null ||
            payload.idBodega == null
          ) {
            throw new Error('Faltan datos para ingresar stock: idVariante, cantidad o idBodega.');
          }
          resultado = await ingresarStock({
            idVariante: payload.idVariante,
            cantidad: payload.cantidad,
            idBodega: payload.idBodega,
            descripcion: payload.descripcion ?? 'Ingreso vía Agente IA',
            usuario: payload.usuario ?? nombreUsuario,
          });
          break;
        }

        case 'CONFIRMAR_RECEPCION': {
          console.log("PAYLOAD A EJECUTAR (CONFIRMAR_RECEPCION):", payload);
          const p = payload as Record<string, any>;
          const dataPayload = p.payload_json || p || {};
          
          let idSeguro = dataPayload.idCabecera || dataPayload.id_cabecera || dataPayload.id_compra || dataPayload.id_documento;
          const textoUsr = tarea.instruccion_original || tarea.mensaje_usuario || '';
          // ESCUDO DE VOZ: Si la IA omitió el ID en el JSON, extráelo directamente de lo que habló el usuario
          if (!idSeguro && textoUsr) {
              const match = textoUsr.match(/\d{3,}/); // Atrapa cualquier número de 3+ dígitos (ej: 1013)
              if (match) idSeguro = parseInt(match[0], 10);
          }
          // Forzamos la reasignación para que pase la validación y dispare el RPC
          p.idCabecera = idSeguro;

          if (!p.idCabecera) {
            throw new Error("No se encontró el idCabecera en el payload para confirmar la recepción.");
          }

          const idVariante = Number(dataPayload.idVariante || dataPayload.id_variante || 1);
          const idBodega = Number(dataPayload.idBodega || dataPayload.id_bodega || 1);
          const cantidadSugerida = dataPayload.cantidadEsperada || dataPayload.cantidad || dataPayload.pxo_cantidad || dataPayload.pxd_cantidad;
          const cantidadReal = Math.abs(Number(p.cantidad || p.cant || cantidadSugerida || 0));

          console.log("🚀 Disparando RPC de recepción para cabecera:", idCabecera);

          resultado = await aprobarRecepcionCabecera(idCabecera, {
            ...p,
            idBodega,
            idVariante,
            cantidadReal,
          });
          break;
        }

        case 'AUTORIZAR_AJUSTE': {
          console.log("PAYLOAD A EJECUTAR (AUTORIZAR_AJUSTE):", payload);

          const p = payload as Record<string, any>;
          const idCabecera = p.idCabecera || p.id_cabecera;

          if (!idCabecera) {
            throw new Error("No se encontró el idCabecera en el payload para autorizar el ajuste.");
          }

          const idVariante = Number(p.idVariante || p.id_variante || 1);
          const idBodega = Number(p.idBodega || p.id_bodega || 1);
          const cantidadOriginal = Number(p.cantidad || p.cant || 0);

          console.log("🚀 Disparando aprobación de ajuste RPC para cabecera:", idCabecera);

          resultado = await aprobarAjusteCabecera(idCabecera, {
            ...p,
            idBodega,
            idVariante,
            cantidad: cantidadOriginal
          });
          break;
        }

        case 'CONFIRMAR_ENTREGA': {
          console.log("PAYLOAD A EJECUTAR (CONFIRMAR_ENTREGA):", payload);
          const p = payload as Record<string, any>;
          const dataPayload = p.payload_json || p || {};
          
          let idSeguro = dataPayload.idCabecera || dataPayload.id_cabecera || dataPayload.id_compra || dataPayload.id_documento;
          const textoUsr = tarea.instruccion_original || tarea.mensaje_usuario || '';
          // ESCUDO DE VOZ: Si la IA omitió el ID en el JSON, extráelo directamente de lo que habló el usuario
          if (!idSeguro && textoUsr) {
              const match = textoUsr.match(/\d{3,}/); // Atrapa cualquier número de 3+ dígitos (ej: 1013)
              if (match) idSeguro = parseInt(match[0], 10);
          }
          // Forzamos la reasignación para que pase la validación y dispare el RPC
          p.idCabecera = idSeguro;

          if (!p.idCabecera) {
            throw new Error("No se encontró el idCabecera en el payload para confirmar la entrega.");
          }

          const idVariante = Number(dataPayload.idVariante || dataPayload.id_variante || 1);
          const idBodega = Number(dataPayload.idBodega || dataPayload.id_bodega || 1);
          const cantidadSugerida = dataPayload.cantidadEsperada || dataPayload.cantidad || dataPayload.pxo_cantidad || dataPayload.pxd_cantidad;
          const cantidadReal = Math.abs(Number(p.cantidad || p.cant || cantidadSugerida || 0));

          console.log("🚀 Disparando RPC de entrega para cabecera:", idCabecera);

          resultado = await aprobarEntregaCabecera(idCabecera, {
            ...p,
            idBodega,
            idVariante,
            cantidadReal,
          });
          break;
        }

        case 'CREAR_PRODUCTO': {
          // El Jefe delega — estas acciones NO ejecutan stock directamente en este punto.
          // Solo persisten la notificación en el backend (ya ocurrió al delegar).
          resultado = { success: true, message: 'Tarea delegada correctamente.' };
          break;
        }

        case 'DESCONTAR_STOCK': {
          if (payload.idVariante == null || payload.cantidad == null) {
            throw new Error('Faltan datos: idVariante y cantidad son obligatorios.');
          }
          resultado = await descontarStock(payload.idVariante, payload.cantidad);
          break;
        }

        case 'CONSULTAR': {
          if (payload.idVariante == null) {
            throw new Error('Falta el ID de la variante a consultar.');
          }
          resultado = await consultarStock(payload.idVariante);
          break;
        }

        case 'SINCRONIZAR':
          resultado = await sincronizarCloud();
          break;

        case 'INFORMATIVO':
        case 'DAR_DE_BAJA':
        default:
          // Estas acciones no tienen endpoint directo en inventarioService
          resultado = { success: true, message: 'Acción registrada.' };
          break;
      }

      // Liberar la tarea pendiente del ref al ejecutar
      if (pendingTaskRef.current?.id === tarea.id) {
        pendingTaskRef.current = null;
      }

      // Si la tarea era una notificación pendiente traída del backend, la marcamos como ejecutada
      // ÚNICAMENTE si la función de stock de arriba se ejecutó con éxito (Response 200).
      // Como estamos dentro de un try, si ingresarStock/descontarStock fallaron,
      // el flujo habría saltado al catch y esta línea no se ejecutaría.
      if (tarea.id.length === 36) { // Si no es un UUID autogenerado localmente (sino de la BD)
        try {
          await marcarNotificacionEjecutada(tarea.id);
        } catch (err) {
          console.warn('[useAgent] Error no crítico al cerrar la notificación:', err);
        }
      }

      // ── Actualizar estado de la tarea a 'ejecutada' ──────────────────────
      setMensajes(prev =>
        prev.map(m =>
          m.tarea?.id === tarea.id
            ? {
              ...m,
              content: `✅ Ejecutado: ${tarea.mensaje_usuario}`,
              tarea: { ...m.tarea, estado: 'ejecutada', resultado_api: resultado },
            }
            : m
        )
      );

      // ── Añadir mensaje de confirmación del sistema ────────────────────────
      agregarMensaje({
        id: `msg-ok-${Date.now()}`,
        content: formatearResultado(accion, resultado),
        timestamp: new Date().toISOString(),
        senderId: 'agent',
        type: 'text',
        isEdited: false,
        reactions: [],
        replyTo: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al ejecutar la tarea.';

      // ── Sesión expirada: mostrar error amigable sin redirigir ni limpiar token ──
      // El token puede ser válido para el login pero el rol no tiene acceso al
      // endpoint específico del microservicio. No cerramos sesión automáticamente.
      const esSesionExpirada = msg.startsWith('SESION_EXPIRADA');
      const mensajeVisible = esSesionExpirada
        ? '⚠️ Sin permisos para esta operación. Tu sesión puede haber expirado — recarga la página e inicia sesión nuevamente.'
        : msg;

      setMensajes(prev =>
        prev.map(m =>
          m.tarea?.id === tarea.id
            ? { ...m, tarea: { ...m.tarea!, estado: 'error' } }
            : m
        )
      );
      setAgentError(mensajeVisible);
    }
  }, [nombreUsuario, agregarMensaje]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Enviar un mensaje de texto (flujo principal del agente)
  // ═══════════════════════════════════════════════════════════════════════════

  const sendMessage = useCallback(async (texto: string): Promise<void> => {
    if (!texto.trim() || agentThinking) return;
    setAgentError(null);

    // 1. Añadir mensaje del usuario a la UI
    const msgUsuario: MensajeERP = {
      id: `msg-user-${Date.now()}`,
      content: texto,
      timestamp: new Date().toISOString(),
      senderId: 'user',
      type: 'text',
      isEdited: false,
      reactions: [],
      replyTo: null,
    };
    agregarMensaje(msgUsuario);

    // 2. Añadir mensaje 'thinking' del agente (placeholder de streaming)
    const thinkingId = `msg-agent-${Date.now()}`;
    agregarMensaje({
      id: thinkingId,
      content: '',
      timestamp: new Date().toISOString(),
      senderId: 'agent',
      type: 'text', // se irá llenando con actualizarUltimoMensaje
      isEdited: false,
      reactions: [],
      replyTo: null,
    });

    // 3. Preparar historial para Ollama
    const systemPrompt = SYSTEM_PROMPTS[rolActivo];
    const mensajesOllama: OllamaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historialRef.current,
      { role: 'user', content: texto },
    ];

    setAgentThinking(true);
    abortControllerRef.current = new AbortController();
    let respuestaCompleta = '';

    try {
      // 4. Llamar a Ollama con streaming
      respuestaCompleta = await chatOllama(
        mensajesOllama,
        (delta) => {
          respuestaCompleta += delta; // acumulado local
          actualizarUltimoMensaje(delta); // actualiza la burbuja en tiempo real
        },
        {
          signal: abortControllerRef.current.signal,
          temperature: 0.1,
        }
      );

      // 5. Actualizar historial (para contexto en futuros mensajes)
      historialRef.current = [
        ...historialRef.current,
        { role: 'user' as const, content: texto },
        { role: 'assistant' as const, content: respuestaCompleta },
      ].slice(-20);

      // 6. Parsear la respuesta y crear TareaInventario
      const tarea = parseAgentResponse(
        respuestaCompleta,
        rolActivo,
        texto,
        nombreUsuario
      );

      // PROTEGER EL ID DE CABECERA ORIGINAL Y CANTIDADES DE LA TAREA PENDIENTE
      if (pendingTaskRef.current) {
        const tareaOriginal = pendingTaskRef.current;
        if (tarea.accion === tareaOriginal.accion || tarea.accion === 'CONFIRMAR_RECEPCION' || tarea.accion === 'CONFIRMAR_ENTREGA') {
          const oPayload = (tareaOriginal.payload_json || tareaOriginal.payload || {}) as Record<string, any>;
          const idOriginal = oPayload.idCabecera || oPayload.id_recepcion || oPayload.id_entrega || oPayload.id_compra || oPayload.id_documento;
          const cantidadOriginal = oPayload.cantidadEsperada || oPayload.cantidad || oPayload.pxo_cantidad || oPayload.pxd_cantidad;

          // Preservar ID original de la tarea de Supabase
          if (tareaOriginal.id && tareaOriginal.id.length === 36) {
            tarea.id = tareaOriginal.id;
          }

          tarea.payload = {
            ...tarea.payload,
            idCabecera: idOriginal ?? tarea.payload.idCabecera,
            cantidadEsperada: cantidadOriginal ?? tarea.payload.cantidadEsperada,
          };
          // Forzar la retención del objeto inmutable original de Supabase
          tarea.payload_json = oPayload;
        }
      }

      // 6b. INTERCEPTOR DE RESPUESTA — Extraer mensaje_usuario del JSON para mostrar en UI
      // Si Ollama devuelvió el JSON crudo visible en la burbuja, lo reemplazamos
      // por solo el texto en lenguaje natural del campo 'mensaje_usuario'.
      const textoParaUI = tarea.mensaje_usuario || respuestaCompleta;
      setMensajes(prev =>
        prev.map(m =>
          m.id === thinkingId
            ? { ...m, content: textoParaUI }
            : m
        )
      );

      // 7a. Si es INFORMATIVO → la burbuja ya tiene el texto limpio, leer en voz y salir
      if (tarea.accion === 'INFORMATIVO') {
        emitirVoz(textoParaUI);
        setAgentThinking(false);
        return;
      }

      // ══ Regla de oro: CREAR_PRODUCTO y AUTORIZAR_AJUSTE son SIEMPRE confirmación requerida ══
      const accionesQueRequierenConfirmacion: AccionInventario[] = [
        'CREAR_PRODUCTO', 'AUTORIZAR_AJUSTE', 'DAR_DE_BAJA', 'SINCRONIZAR',
      ];
      const confirmacionForzada =
        tarea.confirmacion_requerida ||
        accionesQueRequierenConfirmacion.includes(tarea.accion);

      // ══ FLUJO DE DELEGACIÓN: rol_destino !== rolActivo ══════════════════════════════
      // Si la tarea va dirigida a otro rol, persistir en Supabase vía POST /tareas
      // y mostrar solo un mensaje informativo (sin botones de Confirmar).
      if (tarea.rol_destino && tarea.rol_destino !== rolActivo) {

        // SANITIZACIÓN ANTI-ALUCINACIONES: corregir la acción si el modelo confundió
        // CONFIRMAR_ENTREGA o CONFIRMAR_RECEPCION con otra acción genérica.
        const payloadSanitize = tarea.payload as Record<string, any>;
        if (
          tarea.accion !== 'CONFIRMAR_ENTREGA' &&
          tarea.accion !== 'CONFIRMAR_RECEPCION' &&
          (payloadSanitize.idCabecera != null ||
            (tarea.instruccion_original ?? '').toLowerCase().includes('entrega'))
        ) {
          const instrLower = (tarea.instruccion_original ?? '').toLowerCase();
          if (instrLower.includes('entrega') || instrLower.includes('venta') || instrLower.includes('despacho')) {
            (tarea as any).accion = 'CONFIRMAR_ENTREGA';
          } else if (instrLower.includes('recepcion') || instrLower.includes('recepción') || instrLower.includes('compra') || instrLower.includes('llegada')) {
            (tarea as any).accion = 'CONFIRMAR_RECEPCION';
          }
        }

        // a.1) Pre-procesamiento por tipo de acción antes de delegar
        if (tarea.accion === 'AUTORIZAR_AJUSTE') {
          // AUTORIZAR_AJUSTE: el Auxiliar dicta el ajuste → crear cabecera pendiente primero
          try {
            const payloadRecord = tarea.payload as Record<string, any>;
            const resCabecera = await crearAjusteCabeceraPendiente(payloadRecord);
            if (resCabecera.success && resCabecera.id != null) {
              payloadRecord.idCabecera = resCabecera.id;
              tarea.payload = payloadRecord;
            } else {
              throw new Error(resCabecera.message || "Fallo desconocido al crear cabecera pendiente.");
            }
          } catch (err) {
            console.error('🔥 ERROR: No se pudo crear la cabecera pendiente. Abortando delegación:', err);
            throw err;
          }
        }
        // CONFIRMAR_RECEPCION / CONFIRMAR_ENTREGA: el ID de cabecera ya viene del usuario externo
        // → NO crear cabecera previa. Pasar payload directamente a crearNotificacionTarea.

        // a) Persistir la notificación en el backend (fire-and-forget amigable)
        crearNotificacionTarea({
          accion: tarea.accion,
          mensaje_usuario: tarea.mensaje_usuario,
          instruccion_original: tarea.instruccion_original,
          usuario_origen: nombreUsuario,
          rol_origen: rolActivo,
          rol_destino: tarea.rol_destino,
          payload_json: tarea.payload as Record<string, unknown>,
        }).catch((err: unknown) => {
          console.warn('[useAgent] No se pudo persistir la tarea delegada:', err);
        });

        // b) Reemplazar la burbuja de streaming con mensaje informativo (sin TaskCard)
        const mensajeDelegacion = 'Entendido, he registrado la tarea pendiente para el equipo correspondiente.';
        setMensajes(prev =>
          prev.map(m =>
            m.id === thinkingId
              ? { ...m, content: `📤 ${tarea.mensaje_usuario}\n\nℹ️ ${mensajeDelegacion}` }
              : m
          )
        );

        // c) Leer en voz alta la confirmación de delegación
        emitirVoz(mensajeDelegacion);

      } else if (confirmacionForzada) {
        // 7b. Requiere confirmación del usuario actual → TaskCard
        const tareaConFlag: TareaInventario = { ...tarea, confirmacion_requerida: true };
        setMensajes(prev =>
          prev.map(m =>
            m.id === thinkingId ? crearMensajeTarea(tareaConFlag) : m
          )
        );
        pendingTaskRef.current = tareaConFlag;
        emitirVoz(tarea.mensaje_usuario);
      } else {
        // 7c. Sin confirmación (ej. CONSULTAR) → ejecutar directamente
        setMensajes(prev =>
          prev.map(m =>
            m.id === thinkingId ? crearMensajeTarea(tarea) : m
          )
        );
        emitirVoz(tarea.mensaje_usuario);
        await ejecutarTarea(tarea);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Generación cancelada por el usuario — limpiar la burbuja vacía
        setMensajes(prev => prev.filter(m => m.id !== thinkingId));
        return;
      }
      const msg = err instanceof Error ? err.message : 'Error al comunicarse con la IA.';
      setAgentError(msg);
      // Actualizar la burbuja con el error
      setMensajes(prev =>
        prev.map(m =>
          m.id === thinkingId ? { ...m, content: `❌ ${msg}` } : m
        )
      );
    } finally {
      setAgentThinking(false);
      abortControllerRef.current = null;
    }
  }, [agentThinking, rolActivo, nombreUsuario, agregarMensaje, actualizarUltimoMensaje, ejecutarTarea]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Confirmar una tarea pendiente (botón en TaskCard)
  // ═══════════════════════════════════════════════════════════════════════════

  const confirmarTarea = useCallback(async (tareaId: string, cantidadReal?: number): Promise<void> => {
    const mensaje = mensajes.find(m => m.tarea?.id === tareaId);
    if (!mensaje?.tarea) return;

    const payloadActualizado = { ...mensaje.tarea.payload };
    if (cantidadReal !== undefined) {
      payloadActualizado.cantidad = cantidadReal;
    }

    const tarea: TareaInventario = { ...mensaje.tarea, estado: 'confirmada', payload: payloadActualizado };
    setMensajes(prev =>
      prev.map(m =>
        m.tarea?.id === tareaId ? { ...m, tarea } : m
      )
    );
    await ejecutarTarea(tarea);
  }, [mensajes, ejecutarTarea]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Rechazar una tarea pendiente
  // ═══════════════════════════════════════════════════════════════════════════

  const rechazarTarea = useCallback((tareaId: string): void => {
    setMensajes(prev =>
      prev.map(m =>
        m.tarea?.id === tareaId
          ? {
            ...m,
            content: `🚫 Tarea cancelada: ${m.tarea!.mensaje_usuario}`,
            tarea: { ...m.tarea!, estado: 'rechazada' },
          }
          : m
      )
    );
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Activar/desactivar reconocimiento de voz (Web Speech API)
  // Solo compatible con Chrome y Edge (Chromium-based browsers)
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleVoz = useCallback((): void => {
    // Verificar soporte del navegador
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setAgentError('El reconocimiento de voz no está disponible. Usa Chrome o Edge.');
      return;
    }

    if (escuchando && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'es-EC'; // Español Ecuador
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setEscuchando(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();

      // ══ MODO CONFIRMACIÓN POR VOZ ═══════════════════════════════════
      // Si hay una TaskCard en estado 'pendiente', interceptar palabras clave
      // en lugar de enviar el transcript a Ollama.
      const tareaActiva = pendingTaskRef.current;
      if (tareaActiva && rolActivo === 'JEFE_INVENTARIO') {
        const palabrasConfirmar = ['sí', 'si', 'confirmar', 'confirmo', 'proceder', 'aceptar', 'ejecutar', 'ejecuto', 'procedo'];
        const palabrasCancelar = ['no', 'cancelar', 'cancelo', 'rechazar', 'rechazo', 'cancelado'];

        const esConfirmacion = palabrasConfirmar.some(p => transcript.includes(p));
        const esCancelacion = palabrasCancelar.some(p => transcript.includes(p));

        if (esConfirmacion) {
          // Confirmación por voz: ejecutar tarea y limpiar pendingTaskRef
          emitirVoz('Confirmando la tarea. Ejecutando ahora.');
          void confirmarTarea(tareaActiva.id);
          return;
        }
        if (esCancelacion) {
          // Cancelación por voz: rechazar tarea y limpiar pendingTaskRef
          emitirVoz('Tarea cancelada.');
          rechazarTarea(tareaActiva.id);
          pendingTaskRef.current = null;
          return;
        }
        // Palabra no reconocida como clave — informar y no enviar a Ollama
        emitirVoz('No te entendí. Di sí para confirmar o no para cancelar.');
        return;
      }

      // ══ MODO NORMAL ══════════════════════════════════════════
      // No hay tarea pendiente — enviar el transcript como mensaje normal a Ollama
      void sendMessage(event.results[0][0].transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('[useAgent] Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setAgentError(`Error de micrófono: ${event.error}`);
      }
      setEscuchando(false);
    };

    recognition.onend = () => setEscuchando(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [escuchando, sendMessage, confirmarTarea, rechazarTarea, rolActivo]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Cancelar generación en curso
  // ═══════════════════════════════════════════════════════════════════════════

  const cancelarGeneracion = useCallback((): void => {
    abortControllerRef.current?.abort();
  }, []);

  const limpiarError = useCallback((): void => {
    setAgentError(null);
  }, []);

  /**
   * Inyecta un mensaje del agente directamente en la lista de mensajes,
   * sin pasar por Ollama. Usado para la rutina de bienvenida asíncrona.
   */
  const inyectarMensajeAgente = useCallback((texto: string): void => {
    agregarMensaje({
      id: `msg-sistema-${Date.now()}`,
      content: texto,
      timestamp: new Date().toISOString(),
      senderId: 'agent',
      type: 'text',
      isEdited: false,
      reactions: [],
      replyTo: null,
    });
  }, [agregarMensaje]);

  /**
   * Inyecta una TaskCard directamente en el chat para tareas pendientes obtenidas del backend.
   * La primera tarea inyectada se asigna a pendingTaskRef para soporte de confirmación por voz.
   */
  const inyectarTaskCardAgente = useCallback((tareaBase: Omit<TareaInventario, 'id' | 'timestamp' | 'confirmacion_requerida'> & { id?: string }) => {
    const tarea: TareaInventario = {
      ...tareaBase,
      id: tareaBase.id || uuidv4(),
      timestamp: new Date().toISOString(),
      confirmacion_requerida: true,
      estado: 'pendiente'
    };

    agregarMensaje({
      id: `msg-task-${tarea.id}`,
      content: tarea.mensaje_usuario,
      timestamp: tarea.timestamp,
      senderId: 'agent',
      type: 'task_card',
      isEdited: false,
      reactions: [],
      replyTo: null,
      tarea,
    });

    if (!pendingTaskRef.current) {
      pendingTaskRef.current = tarea;
    }
  }, [agregarMensaje]);

  return {
    // State
    mensajes,
    agentThinking,
    agentError,
    rolActivo,
    nombreUsuario,
    escuchando,
    // Actions
    sendMessage,
    toggleVoz,
    confirmarTarea,
    rechazarTarea,
    cancelarGeneracion,
    limpiarError,
    inyectarMensajeAgente,
    inyectarTaskCardAgente,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER PRIVADO — Formatea el resultado de la API para mostrarlo en el chat
// ═══════════════════════════════════════════════════════════════════════════════

function formatearResultado(
  accion: AccionInventario,
  resultado: Record<string, unknown>
): string {
  switch (accion) {
    case 'INGRESAR_STOCK':
      return `✅ Stock ingresado correctamente. Stock actual: ${resultado.stock_actual ?? '—'} uds.`;
    case 'DESCONTAR_STOCK':
      return `✅ Stock descontado. Stock restante: ${resultado.stock_restante ?? '—'} uds.`;
    case 'CONSULTAR':
      return `📦 Stock disponible: ${resultado.stock_disponible ?? '—'} uds. (Bodega ${resultado.id_bodega ?? '—'})`;
    case 'SINCRONIZAR':
      return `☁️ Sincronización completada. Items procesados: ${resultado.items_sincronizados ?? '—'}.`;
    case 'CONFIRMAR_RECEPCION':
      return '✅ Recepción confirmada y registrada.';
    case 'CREAR_PRODUCTO':
      return '📤 Orden de recepción generada y enviada al Operativo de Inventario.';
    case 'AUTORIZAR_AJUSTE':
      return '✅ Ajuste autorizado. El Operativo debe confirmar la ejecución en bodega.';
    default:
      return String(resultado.message ?? 'Operación completada.');
  }
}
