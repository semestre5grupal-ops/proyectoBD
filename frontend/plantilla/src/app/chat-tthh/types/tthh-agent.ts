/**
 * tthh-agent.ts
 * ------------
 * TIPOS DEL DOMINIO — Agentic ERP Task Center para Talento Humano
 */

export type RolTTHH =
  | 'JEFE_RRHH'
  | 'ASISTENTE_RRHH'
  | 'EMPLEADO';

export type AccionTTHH =
  | 'CREAR_EMPLEADO'
  | 'CREAR_DEPARTAMENTO'
  | 'CREAR_CARGO'
  | 'CONSULTAR_EMPLEADO'
  | 'GENERAR_ROL_PAGO'
  | 'INFORMATIVO';

export interface PayloadTTHH {
  emp_nombre?: string;
  emp_apellido?: string;
  emp_cedula?: string;
  emp_telefono?: string;
  emp_direccion?: string;
  id_departamento?: number;
  dep_nombre?: string;
  dep_estado?: string;
  id_cargo?: number;
  car_nombre?: string;
  car_sueldobase?: number;
}

export interface TareaTTHH {
  id: string;
  accion: AccionTTHH;
  payload: PayloadTTHH;
  confirmacion_requerida: boolean;
  mensaje_usuario: string;
  estado: 'pendiente' | 'confirmada' | 'ejecutada' | 'rechazada' | 'error';
  timestamp: string;
  rol_origen: RolTTHH;
  instruccion_original: string;
  resultado_api?: Record<string, unknown>;
}

export interface MensajeTTHH {
  id: string;
  content: string;
  timestamp: string;
  senderId: 'user' | 'agent' | string;
  type: 'text' | 'image' | 'file' | 'thinking' | 'task_card';
  isEdited: boolean;
  reactions: Array<{ emoji: string; users: string[]; count: number }>;
  replyTo: string | null;
  tarea?: TareaTTHH;
}

export interface RespuestaAgenteTTHH {
  accion: AccionTTHH;
  payload: PayloadTTHH;
  confirmacion_requerida: boolean;
  mensaje_usuario: string;
}

export const PERMISOS_POR_ROL_TTHH: Record<RolTTHH, AccionTTHH[]> = {
  JEFE_RRHH: [
    'CREAR_EMPLEADO',
    'CREAR_DEPARTAMENTO',
    'CREAR_CARGO',
    'CONSULTAR_EMPLEADO',
    'GENERAR_ROL_PAGO',
    'INFORMATIVO',
  ],
  ASISTENTE_RRHH: [
    'CREAR_EMPLEADO',
    'CONSULTAR_EMPLEADO',
    'INFORMATIVO',
  ],
  EMPLEADO: [
    'CONSULTAR_EMPLEADO',
    'INFORMATIVO',
  ],
};
