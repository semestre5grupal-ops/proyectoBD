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
    
    let rol: RolTTHH = 'EMPLEADO';
    const rawRol = (payload.rol ?? '').toLowerCase().replace(/[^a-z]/g, '');
    
    // Mapeo de roles de base de datos reales
    if (payload.id_rol === 1 || rawRol === 'admin' || rawRol === 'jefe_rrhh' || rawRol === 'gerentetth') {
      rol = 'JEFE_RRHH';
    } else if (payload.id_rol === 3 || rawRol === 'asistente_rrhh' || rawRol === 'auxiliartth') {
      rol = 'ASISTENTE_RRHH';
    } else if (rawRol === 'operativotth') {
      rol = 'EMPLEADO';
    }

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

  // El bot es ahora puramente conversacional/asesor
  return {
    id,
    accion: 'INFORMATIVO',
    payload: {},
    confirmacion_requerida: false,
    mensaje_usuario: texto,
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
  
  // Limpiar markdown y símbolos raros para que el TTS lo lea fluido
  const textoLimpio = texto
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .replace(/_/g, '')
    .replace(/`/g, '')
    .replace(/\[|\]/g, '')
    .replace(/-/g, '')
    .replace(/\$/g, ' dólares ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(textoLimpio);
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
  const recognitionRef = useRef<any>(null);
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
    // Simulación del gestor por compatibilidad de tipos
    if (pendingTaskRef.current?.id === tarea.id) pendingTaskRef.current = null;
  }, []);

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

    // 1. Detección inteligente de cédula ecuatoriana (10 dígitos)
    let contextoEmpleado = '';
    const matchCedula = texto.match(/\b\d{10}\b/);
    if (matchCedula) {
      const cedula = matchCedula[0];
      try {
        const res = await empleadoService.getEmpleados(1, 1, cedula);
        if (res && res.data && res.data.length > 0) {
          const emp = res.data[0];
          
          const [allContratos, allRoles, allAsistencias, allVacaciones] = await Promise.all([
            import('@/services/contratoService').then(m => m.contratoService.getAll().catch(() => [])),
            import('@/services/rolPagoService').then(m => m.rolPagoService.getAll().catch(() => [])),
            import('@/services/asistenciaService').then(m => m.asistenciaService.getAll().catch(() => [])),
            import('@/services/vacacionService').then(m => m.vacacionService.getAll().catch(() => []))
          ]);
          
          const contratosEmp = Array.isArray(allContratos) ? allContratos.filter(c => c.id_empleado === emp.id_empleado) : [];
          const contratoActivo = contratosEmp.find(c => c.con_estado === 'ACT') || contratosEmp[0];
          const sueldoBase = contratoActivo ? contratoActivo.con_sueldobase : 0;
          
          const rolesEmp = Array.isArray(allRoles) ? allRoles.filter(r => r.id_empleado === emp.id_empleado) : [];
          const lastRol = rolesEmp.length > 0 ? rolesEmp[rolesEmp.length - 1] : null;
          
          const asistenciasEmp = Array.isArray(allAsistencias) ? allAsistencias.filter(a => a.id_empleado === emp.id_empleado) : [];
          const totalAsistencias = asistenciasEmp.length;
          const ultimasAsist = asistenciasEmp.slice(-3).map(a => `${new Date(a.fecha_hora).toLocaleDateString()} ${a.tipo_movimiento}`).join(', ');

          let vacSaldoTotal = 0;
          if (Array.isArray(allVacaciones)) {
            const vacEmp = allVacaciones.filter(v => contratosEmp.some(c => c.id_contrato === v.id_contrato));
            vacSaldoTotal = vacEmp.reduce((sum, v) => sum + (v.vac_saldo || 0), 0);
          }

          let rolInfo = "No tiene roles de pago registrados.";
          if (lastRol) {
            rolInfo = `Último rol: Neto $${lastRol.rol_neto}, Días trabajados: ${lastRol.rol_dias_trabajados}, Bonos $${lastRol.rol_bontotal}, Descuentos $${lastRol.rol_destotal}.`;
          }

          // INYECTAR TARJETA UI "WOW FACTOR"
          agregarMensaje({
            id: `msg-emp-card-${Date.now()}`,
            content: '',
            timestamp: new Date().toISOString(),
            senderId: 'system',
            type: 'employee_card',
            isEdited: false,
            reactions: [],
            replyTo: null,
            empleado_data: {
              nombre: `${emp.emp_nom1} ${emp.emp_nom2 || ''} ${emp.emp_ap1} ${emp.emp_ap2 || ''}`.trim(),
              cedula: emp.emp_cedula,
              correo: emp.emp_email,
              telefono: emp.emp_telefono,
              sueldoBase,
              vacSaldoTotal,
              asistencias: totalAsistencias,
              fechaInicio: contratoActivo?.con_fechainicio,
              estado: contratoActivo?.con_estado || 'INACTIVO'
            }
          });

          // Cálculo de liquidación predictiva
          let calculoLiquidacion = "";
          if (contratoActivo && contratoActivo.con_fechainicio && sueldoBase > 0) {
            const fechaInicio = new Date(contratoActivo.con_fechainicio);
            const hoy = new Date();
            
            // Años exactos
            let anosServicio = hoy.getFullYear() - fechaInicio.getFullYear();
            const mesActual = hoy.getMonth();
            const mesInicio = fechaInicio.getMonth();
            if (mesActual < mesInicio || (mesActual === mesInicio && hoy.getDate() < fechaInicio.getDate())) {
              anosServicio--;
            }
            if (anosServicio < 0) anosServicio = 0;

            // Fracción de año para el Código del Trabajo se cuenta como año completo (Art. 188)
            let anosCalculoDespido = anosServicio;
            if (hoy.getMonth() > fechaInicio.getMonth() || (hoy.getMonth() === fechaInicio.getMonth() && hoy.getDate() > fechaInicio.getDate())) {
              anosCalculoDespido++;
            }
            if (anosCalculoDespido === 0) anosCalculoDespido = 1;

            // Indemnización por Despido Intempestivo (Art. 188)
            // Hasta 3 años -> 3 meses de remuneración. Más de 3 años -> 1 mes por cada año.
            let mesesIndemnizacion = anosCalculoDespido <= 3 ? 3 : anosCalculoDespido;
            const indemnizacionDespido = sueldoBase * mesesIndemnizacion;
            
            // Desahucio (Art. 185) -> 25% de la última remuneración por cada año completo
            const desahucio = sueldoBase * 0.25 * (anosServicio > 0 ? anosServicio : 1);
            
            // Vacaciones no gozadas -> sueldo diario * días
            const pagoVacaciones = (sueldoBase / 30) * vacSaldoTotal;
            
            const totalLiquidacion = indemnizacionDespido + desahucio + pagoVacaciones;
            
            calculoLiquidacion = `\n- [SIMULADOR DE LIQUIDACIÓN AL DÍA DE HOY]\n` +
              `  * Tiempo de servicio: ${anosServicio} años y fracción (Inicio: ${fechaInicio.toLocaleDateString()})\n` +
              `  * Indemnización por Despido Intempestivo (Art. 188): $${indemnizacionDespido.toFixed(2)} (${mesesIndemnizacion} meses)\n` +
              `  * Bonificación por Desahucio (Art. 185): $${desahucio.toFixed(2)}\n` +
              `  * Vacaciones no gozadas (${vacSaldoTotal} días): $${pagoVacaciones.toFixed(2)}\n` +
              `  * TOTAL ESTIMADO: $${totalLiquidacion.toFixed(2)}\n`;
          }

          contextoEmpleado = `\n\n[INFORMACIÓN DEL EMPLEADO EN LA BASE DE DATOS:\n` +
            `- Nombre Completo: ${emp.emp_nom1} ${emp.emp_nom2 || ''} ${emp.emp_ap1} ${emp.emp_ap2 || ''}\n` +
            `- Cédula: ${emp.emp_cedula}\n` +
            `- Correo: ${emp.emp_email}\n` +
            `- Teléfono: ${emp.emp_telefono}\n` +
            `- Dirección: ${emp.emp_direccion || 'No especificada'}\n` +
            `- Asistencia (Movimientos): Registra ${totalAsistencias} marcaciones. Últimas: ${ultimasAsist || 'Ninguna'}.\n` +
            `- Rol de Pago: ${rolInfo}\n` +
            `- Vacaciones acumuladas: Tiene un saldo de ${vacSaldoTotal} días de vacaciones.\n` +
            `- Sueldo base referencial: $${sueldoBase} USD]\n` +
            calculoLiquidacion;
        } else {
          contextoEmpleado = `\n\n[ATENCIÓN: No se encontró ningún empleado con la cédula ${cedula} en la base de datos local. Por favor, informa de esto cordialmente al usuario y oriéntalo legalmente]`;
        }
      } catch (error) {
        console.error("Error al consultar el empleado:", error);
      }
    }

    const systemPrompt = getSystemPromptTTHH(rolActivo) + 
      `\n\nIMPORTANTE: Sé directo, natural y no repitas la misma frase varias veces. ` +
      `Al finalizar tu respuesta, despídete cordialmente diciendo únicamente 'Gracias por usar el bot.' de forma natural.` +
      (contextoEmpleado ? `\n\nContexto actual de la consulta:${contextoEmpleado}` : "");

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
        { signal: abortControllerRef.current.signal, temperature: 0.6, top_p: 0.9 }
      );

      historialRef.current = [
        ...historialRef.current,
        { role: 'user', content: texto },
        { role: 'assistant', content: respuestaCompleta },
      ].slice(-20);

      emitirVoz(respuestaCompleta);
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
  }, [agentThinking, rolActivo, agregarMensaje, actualizarUltimoMensaje]);

  const confirmarTarea = useCallback(async (tareaId: string): Promise<void> => {
    // No-op ya que no usamos tareas en modo asesor legal
  }, []);

  const rechazarTarea = useCallback((tareaId: string): void => {
    // No-op
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
      void sendMessage(transcript);
    };
    recognition.onerror = (e: any) => { if (e.error !== 'aborted') setAgentError(`Error de voz: ${e.error}`); setEscuchando(false); };
    recognition.onend = () => setEscuchando(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [escuchando, sendMessage]);

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
