/**
 * erp-agent.ts
 * ------------
 * TIPOS DEL DOMINIO — Agentic ERP Task Center para COMPRAS
 *
 * Estas interfaces son el contrato entre:
 *   - La respuesta JSON de Ollama (el LLM debe producir este esquema)
 *   - El hook use-agent.ts (parsea y valida la respuesta)
 *   - Los componentes de UI (task-card.tsx, message-list.tsx)
 */

export type RolCompras =
  | 'GERENTE_COMPRAS'       
  | 'ASISTENTE_COMPRAS'   
  | 'PROVEEDOR'; 

export type AccionCompras =
  | 'CREAR_ORDEN'      
  | 'APROBAR_ORDEN'     
  | 'RECHAZAR_ORDEN'         
  | 'REGISTRAR_INGRESO'           
  | 'CONSULTAR_PROVEEDOR'         
  | 'INFORMATIVO';

export interface PayloadCompras {
  idProveedor?: number;
  idOrden?: number;
  montoTotal?: number;
  articulos?: any[];
  descripcion?: string;
  usuario?: string;
}

export interface TareaCompras {
  id: string;
  accion: AccionCompras;
  payload: PayloadCompras;
  confirmacion_requerida: boolean;
  mensaje_usuario: string;
  estado: 'pendiente' | 'confirmada' | 'ejecutada' | 'rechazada' | 'error';
  timestamp: string;
  rol_origen: RolCompras;
  rol_destino?: RolCompras;
  instruccion_original: string;
  resultado_api?: Record<string, unknown>;
}

export interface MensajeERP {
  id: string;
  content: string;
  timestamp: string;
  senderId: 'user' | 'agent' | string;
  type: 'text' | 'image' | 'file' | 'thinking' | 'task_card';
  isEdited: boolean;
  reactions: Array<{ emoji: string; users: string[]; count: number }>;
  replyTo: string | null;
  tarea?: TareaCompras;
}

export interface RespuestaAgente {
  accion: AccionCompras;
  payload: PayloadCompras;
  confirmacion_requerida: boolean;
  mensaje_usuario: string;
  rol_destino?: RolCompras;
}

export const PERMISOS_POR_ROL: Record<RolCompras, AccionCompras[]> = {
  GERENTE_COMPRAS: [
    'CREAR_ORDEN',
    'APROBAR_ORDEN',
    'RECHAZAR_ORDEN',
    'CONSULTAR_PROVEEDOR',
    'INFORMATIVO',
  ],
  ASISTENTE_COMPRAS: [
    'CREAR_ORDEN',
    'REGISTRAR_INGRESO',
    'CONSULTAR_PROVEEDOR',
    'INFORMATIVO',
  ],
  PROVEEDOR: [
    'INFORMATIVO',
  ],
};
