import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { chatOllama, type OllamaMessage } from '@/services/ollamaService';
import { empleadoService } from '@/services/empleadoService';
import { departamentoService } from '@/services/departamentoService';
import { cargoService } from '@/services/cargoService';
import { getSystemPromptTTHH } from '@/app/chat-tthh/prompts/system-prompts';
import {
  PERMISOS_POR_ROL_TTHH,
  type TareaTTHH,
  type MensajeTTHH,
  type RolTTHH,
  type RespuestaAgenteTTHH,
  type AccionTTHH,
} from '@/app/chat-tthh/types/tthh-agent';

export interface UseTTHHAgentState {
  mensajes: MensajeTTHH[];
  agentThinking: boolean;
  agentError: string | null;
  rolActivo: RolTTHH;
  nombreUsuario: string;
  escuchando: boolean;
}

export interface UseTTHHAgentActions {
  sendMessage: (texto: string) => Promise<void>;
  toggleVoz: () => void;
  confirmarTarea: (tareaId: string) => Promise<void>;
  rechazarTarea: (tareaId: string) => void;
  cancelarGeneracion: () => void;
  limpiarError: () => void;
  inyectarMensajeAgente: (texto: string) => void;
}

function leerSesionDesdeJWT(): { rol: RolTTHH; nombre: string } {
  const DEFAULT = { rol: 'JEFE_RRHH' as RolTTHH, nombre: 'Usuario' };
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
    
    // Mapeo simple: asumiendo rol 1 = JEFE_RRHH para esta demo, 
    // en un caso real se ajustaría según la base de datos
    let rol: RolTTHH = 'EMPLEADO';
    if (payload.id_rol === 1 || payload.rol === 'ADMIN' || payload.rol === 'JEFE_RRHH') rol = 'JEFE_RRHH';
    else if (payload.id_rol === 3 || payload.rol === 'ASISTENTE_RRHH') rol = 'ASISTENTE_RRHH';

    return {
      rol,
      nombre: payload.usu_nombre ?? 'Usuario',
    };
  } catch {
    return DEFAULT;
  }
}

function parseAgentResponse(
  texto: string,
  rolActivo: RolTTHH,
  instruccion_original: string
): TareaTTHH {
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  const fallback = (mensaje: string): TareaTTHH => ({
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

  let jsonStr = texto.trim();
  const markdownMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch) {
    jsonStr = markdownMatch[1].trim();
  }

  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    return fallback('La IA devolvió una respuesta no estructurada.');
  }
  jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);

  let parsed: RespuestaAgenteTTHH;
  try {
    parsed = JSON.parse(jsonStr) as RespuestaAgenteTTHH;
  } catch {
    return fallback('Error al interpretar la respuesta de la IA.');
  }

  if (!parsed.accion || typeof parsed.mensaje_usuario !== 'string') {
    return fallback('La IA devolvió un formato incorrecto.');
  }

  const permisosDelRol = PERMISOS_POR_ROL_TTHH[rolActivo] || [];
  const accion: AccionTTHH = parsed.accion;
  if (!permisosDelRol.includes(accion)) {
    return fallback(`La acción "${accion}" no está permitida para tu rol (${rolActivo}).`);
  }

  return {
    id,
    accion,
    payload: parsed.payload || {},
    confirmacion_requerida: parsed.confirmacion_requerida ?? false,
    mensaje_usuario: parsed.mensaje_usuario,
    estado: 'pendiente',
    timestamp,
    rol_origen: rolActivo,
    instruccion_original,
  };
}

function crearMensajeTarea(tarea: TareaTTHH): MensajeTTHH {
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

export function emitirVoz(texto: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'es-EC';
  const voces = window.speechSynthesis.getVoices();
  if (voces.length > 0) {
    utterance.voice = voces.find(v => v.lang === 'es-EC') ?? voces.find(v => v.lang === 'es-ES') ?? null;
  }
  window.speechSynthesis.speak(utterance);
}

export function useTTHHAgent(): UseTTHHAgentState & UseTTHHAgentActions {
  const sesion = leerSesionDesdeJWT();
  const [mensajes, setMensajes] = useState<MensajeTTHH[]>([]);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [rolActivo] = useState<RolTTHH>(sesion.rol);
  const [nombreUsuario] = useState<string>(sesion.nombre);
  const [escuchando, setEscuchando] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null); // Type any for standard/webkit compat
  const historialRef = useRef<OllamaMessage[]>([]);
  const pendingTaskRef = useRef<TareaTTHH | null>(null);

  const agregarMensaje = useCallback((msg: MensajeTTHH) => {
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

  const ejecutarTarea = useCallback(async (tarea: TareaTTHH): Promise<void> => {
    const { accion, payload } = tarea;

    try {
      let resultado: Record<string, unknown> = {};

      switch (accion) {
        case 'CREAR_EMPLEADO': {
          if (!payload.emp_nombre || !payload.emp_apellido || !payload.emp_cedula) {
            throw new Error('Faltan datos requeridos (nombre, apellido, cédula).');
          }
          resultado = await empleadoService.createEmpleado({
            emp_nombre: payload.emp_nombre,
            emp_apellido: payload.emp_apellido,
            emp_cedula: payload.emp_cedula,
            emp_telefono: payload.emp_telefono || 'S/N',
            emp_direccion: payload.emp_direccion || 'S/N',
            emp_fecha_contratacion: new Date().toISOString(),
          }) as unknown as Record<string, unknown>;
          resultado = { message: 'Empleado creado con éxito.' };
          break;
        }

        case 'CREAR_DEPARTAMENTO': {
          if (!payload.dep_nombre) throw new Error('Falta el nombre del departamento.');
          await departamentoService.create({
            dep_nombre: payload.dep_nombre,
            dep_estado: 'ACT'
          });
          resultado = { message: 'Departamento creado con éxito.' };
          break;
        }

        case 'CREAR_CARGO': {
          if (!payload.car_nombre || !payload.car_sueldobase || !payload.id_departamento) {
            throw new Error('Falta el nombre del cargo, sueldo base o ID del departamento.');
          }
          await cargoService.create({
            car_nombre: payload.car_nombre,
            car_sueldobase: payload.car_sueldobase,
            id_departamento: payload.id_departamento,
            car_estado: 'ACT'
          });
          resultado = { message: 'Cargo creado con éxito.' };
          break;
        }

        case 'CONSULTAR_EMPLEADO':
        case 'GENERAR_ROL_PAGO':
        case 'INFORMATIVO':
        default:
          resultado = { message: 'Acción ejecutada correctamente (simulación).' };
          break;
      }

      if (pendingTaskRef.current?.id === tarea.id) pendingTaskRef.current = null;

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

      agregarMensaje({
        id: `msg-ok-${Date.now()}`,
        content: `✅ ${resultado.message || 'Operación completada'}`,
        timestamp: new Date().toISOString(),
        senderId: 'agent',
        type: 'text',
        isEdited: false,
        reactions: [],
        replyTo: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido.';
      setMensajes(prev =>
        prev.map(m =>
          m.tarea?.id === tarea.id
            ? { ...m, tarea: { ...m.tarea!, estado: 'error' } }
            : m
        )
      );
      setAgentError(msg);
    }
  }, [agregarMensaje]);

  const sendMessage = useCallback(async (texto: string): Promise<void> => {
    if (!texto.trim() || agentThinking) return;
    setAgentError(null);

    const msgUsuario: MensajeTTHH = {
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

    const thinkingId = `msg-agent-${Date.now()}`;
    agregarMensaje({
      id: thinkingId,
      content: '',
      timestamp: new Date().toISOString(),
      senderId: 'agent',
      type: 'text',
      isEdited: false,
      reactions: [],
      replyTo: null,
    });

    const systemPrompt = getSystemPromptTTHH(rolActivo);
    const mensajesOllama: OllamaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historialRef.current,
      { role: 'user', content: texto },
    ];

    setAgentThinking(true);
    abortControllerRef.current = new AbortController();
    let respuestaCompleta = '';

    try {
      respuestaCompleta = await chatOllama(
        mensajesOllama,
        (delta) => {
          respuestaCompleta += delta;
          actualizarUltimoMensaje(delta);
        },
        { signal: abortControllerRef.current.signal, temperature: 0.1 }
      );

      historialRef.current = [
        ...historialRef.current,
        { role: 'user', content: texto },
        { role: 'assistant', content: respuestaCompleta },
      ].slice(-20);

      const tarea = parseAgentResponse(respuestaCompleta, rolActivo, texto);

      if (tarea.accion === 'INFORMATIVO') {
        emitirVoz(respuestaCompleta);
        setAgentThinking(false);
        return;
      }

      const accionesQueRequierenConfirmacion: AccionTTHH[] = ['CREAR_EMPLEADO', 'CREAR_DEPARTAMENTO', 'CREAR_CARGO'];
      const confirmacionForzada = tarea.confirmacion_requerida || accionesQueRequierenConfirmacion.includes(tarea.accion);

      if (confirmacionForzada) {
        const tareaConFlag: TareaTTHH = { ...tarea, confirmacion_requerida: true };
        setMensajes(prev => prev.map(m => m.id === thinkingId ? crearMensajeTarea(tareaConFlag) : m));
        pendingTaskRef.current = tareaConFlag;
        emitirVoz(tarea.mensaje_usuario);
      } else {
        setMensajes(prev => prev.map(m => m.id === thinkingId ? crearMensajeTarea(tarea) : m));
        emitirVoz(tarea.mensaje_usuario);
        await ejecutarTarea(tarea);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMensajes(prev => prev.filter(m => m.id !== thinkingId));
        return;
      }
      const msg = err instanceof Error ? err.message : 'Error al comunicarse con la IA.';
      setAgentError(msg);
      setMensajes(prev => prev.map(m => m.id === thinkingId ? { ...m, content: `❌ ${msg}` } : m));
    } finally {
      setAgentThinking(false);
      abortControllerRef.current = null;
    }
  }, [agentThinking, rolActivo, agregarMensaje, actualizarUltimoMensaje, ejecutarTarea]);

  const confirmarTarea = useCallback(async (tareaId: string): Promise<void> => {
    const mensaje = mensajes.find(m => m.tarea?.id === tareaId);
    if (!mensaje?.tarea) return;
    const tarea: TareaTTHH = { ...mensaje.tarea, estado: 'confirmada' };
    setMensajes(prev => prev.map(m => m.tarea?.id === tareaId ? { ...m, tarea } : m));
    await ejecutarTarea(tarea);
  }, [mensajes, ejecutarTarea]);

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

  const toggleVoz = useCallback((): void => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setAgentError('El reconocimiento de voz no está disponible.');
      return;
    }

    if (escuchando && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'es-EC';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setEscuchando(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const tareaActiva = pendingTaskRef.current;
      if (tareaActiva) {
        const esConfirmacion = ['sí', 'si', 'confirmar'].some(p => transcript.includes(p));
        const esCancelacion  = ['no', 'cancelar'].some(p => transcript.includes(p));
        if (esConfirmacion) { emitirVoz('Ejecutando.'); void confirmarTarea(tareaActiva.id); return; }
        if (esCancelacion) { emitirVoz('Cancelada.'); rechazarTarea(tareaActiva.id); pendingTaskRef.current = null; return; }
        emitirVoz('Di sí o no.');
        return;
      }
      void sendMessage(transcript);
    };
    recognition.onerror = (e: any) => { if (e.error !== 'aborted') setAgentError(`Error de voz: ${e.error}`); setEscuchando(false); };
    recognition.onend = () => setEscuchando(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [escuchando, sendMessage, confirmarTarea, rechazarTarea]);

  const cancelarGeneracion = useCallback(() => abortControllerRef.current?.abort(), []);
  const limpiarError = useCallback(() => setAgentError(null), []);
  const inyectarMensajeAgente = useCallback((texto: string) => {
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

  return { mensajes, agentThinking, agentError, rolActivo, nombreUsuario, escuchando, sendMessage, toggleVoz, confirmarTarea, rechazarTarea, cancelarGeneracion, limpiarError, inyectarMensajeAgente };
}
