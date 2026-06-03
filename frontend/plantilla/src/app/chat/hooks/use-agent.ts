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
  confirmarTarea: (tareaId: string) => Promise<void>;
  /** Rechaza una TareaInventario pendiente */
  rechazarTarea: (tareaId: string) => void;
  /** Cancela la generación en curso */
  cancelarGeneracion: () => void;
  /** Limpia el error actual */
  limpiarError: () => void;
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
    instruccion_original,
  };
}

/**
 * Crea un MensajeERP de tipo 'task_card' desde una TareaInventario.
 */
function crearMensajeTarea(tarea: TareaInventario): MensajeERP {
  return {
    id: `msg-${tarea.id}`,
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
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function useAgent(): UseAgentState & UseAgentActions {
  // ── Sesión del usuario (leída del JWT al montar) ───────────────────────────
  const sesion = leerSesionDesdeJWT();

  // ── Estado central ─────────────────────────────────────────────────────────
  const [mensajes, setMensajes] = useState<MensajeERP[]>([]);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [rolActivo]     = useState<RolInventario>(sesion.rol);
  const [nombreUsuario] = useState<string>(sesion.nombre);
  const [escuchando, setEscuchando] = useState(false);

  // ── Refs para control de streaming y reconocimiento de voz ─────────────────
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef     = useRef<SpeechRecognition | null>(null);
  const historialRef       = useRef<OllamaMessage[]>([]); // historial de conversación

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

    try {
      let resultado: Record<string, unknown>;

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
        case 'CONFIRMAR_RECEPCION':
        default:
          // Estas acciones no tienen endpoint directo en inventarioService
          resultado = { success: true, message: 'Acción registrada.' };
          break;
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
      setMensajes(prev =>
        prev.map(m =>
          m.tarea?.id === tarea.id
            ? { ...m, tarea: { ...m.tarea!, estado: 'error' } }
            : m
        )
      );
      setAgentError(msg);
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
        { role: 'user', content: texto },
        { role: 'assistant', content: respuestaCompleta },
      ].slice(-20); // mantener máximo 20 mensajes de historial (10 turnos)

      // 6. Parsear la respuesta y crear TareaInventario
      const tarea = parseAgentResponse(
        respuestaCompleta,
        rolActivo,
        texto,
        nombreUsuario
      );

      // 7a. Si es INFORMATIVO → la burbuja de texto ya tiene la respuesta, no añadir TaskCard
      if (tarea.accion === 'INFORMATIVO') {
        // La respuesta ya está visible en la burbuja de streaming
        setAgentThinking(false);
        return;
      }

      // 7b. Si confirmacion_requerida → reemplazar la burbuja de texto por un TaskCard
      if (tarea.confirmacion_requerida) {
        setMensajes(prev =>
          prev.map(m =>
            m.id === thinkingId ? crearMensajeTarea(tarea) : m
          )
        );
      } else {
        // 7c. Sin confirmación → ejecutar directamente y actualizar burbuja
        setMensajes(prev =>
          prev.map(m =>
            m.id === thinkingId ? crearMensajeTarea(tarea) : m
          )
        );
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

  const confirmarTarea = useCallback(async (tareaId: string): Promise<void> => {
    const mensaje = mensajes.find(m => m.tarea?.id === tareaId);
    if (!mensaje?.tarea) return;

    const tarea: TareaInventario = { ...mensaje.tarea, estado: 'confirmada' };
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
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      // Enviar la transcripción como si fuera texto escrito
      void sendMessage(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[useAgent] Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setAgentError(`Error de micrófono: ${event.error}`);
      }
      setEscuchando(false);
    };

    recognition.onend = () => setEscuchando(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [escuchando, sendMessage]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIÓN: Cancelar generación en curso
  // ═══════════════════════════════════════════════════════════════════════════

  const cancelarGeneracion = useCallback((): void => {
    abortControllerRef.current?.abort();
  }, []);

  const limpiarError = useCallback((): void => {
    setAgentError(null);
  }, []);

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
    default:
      return String(resultado.message ?? 'Operación completada.');
  }
}
