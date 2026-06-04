/**
 * erp-agent.ts
 * ------------
 * TIPOS DEL DOMINIO — Agentic ERP Task Center
 * Proyecto RDA3 · Módulo de Compras (Liz)
 *
 * Estas interfaces son el contrato entre:
 *   - La respuesta JSON de Ollama (el LLM debe producir este esquema)
 *   - El hook use-agent.ts (parsea y valida la respuesta)
 *   - Los componentes de UI (task-card.tsx, message-list.tsx)
 *   - comprasService.ts (ejecuta la acción resultante)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES — Mapeados desde el JWT de Alejandro (authService.ts)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Roles del Agentic Task Center para el módulo de Compras.
 * Mapeo desde el JWT:
 *   id_rol === 1, 11 o usu_nombre === 'admin' -> JEFE_COMPRAS
 *   id_rol === 12 -> AUXILIAR_COMPRAS
 *   id_rol === 13 -> OPERATIVO_COMPRAS
 */
export type RolCompras =
  | 'JEFE_COMPRAS'       // Permisos completos: crear, dar de baja, sincronizar
  | 'AUXILIAR_COMPRAS'   // Solo ajustes de stock (ingresar, consultar)
  | 'OPERATIVO_COMPRAS'; // Solo recibe y confirma notificaciones de tareas

// ═══════════════════════════════════════════════════════════════════════════════
// ACCIONES — Comandos que la IA puede generar
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Acciones válidas que Ollama puede instruir.
 * Mapeadas directamente a los endpoints de comprasService.ts.
 */
export type AccionCompras =
  | 'CREAR_ORDEN'         // JEFE: Crea nueva orden de compra
  | 'APROBAR_ORDEN'       // JEFE: Aprueba una orden de compra
  | 'ANULAR_ORDEN'        // JEFE: Anula una orden
  | 'CREAR_PROVEEDOR'     // JEFE: Crea un proveedor
  | 'CONSULTAR_ORDEN'     // Todos: Consultar orden de compra
  | 'REGISTRAR_RECEPCION' // OPERATIVO: Registra la recepción física de mercadería de una orden
  | 'REGISTRAR_DEVOLUCION'// AUXILIAR/OPERATIVO: Registra devolución de compra
  | 'INFORMATIVO';        // Respuesta o pregunta de la IA

// ═══════════════════════════════════════════════════════════════════════════════
// PAYLOAD — Datos de ejecución para comprasService
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Campos de ejecución extraídos por la IA del lenguaje natural del usuario.
 * Todos son opcionales porque algunas acciones (CONSULTAR, SINCRONIZAR)
 * no necesitan todos los campos.
 */
export interface PayloadCompras {
  idProveedor?: number;
  nombreProveedor?: string;
  idCompra?: number;
  idBodega?: number;
  productos?: Array<{ idVariante: number; cantidad: number; valor: number }>;
  observacion?: string;
  estado?: 'ABI' | 'APR' | 'ANU';
  usuario?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAREA — Unidad de trabajo generada por el agente
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Representa una instrucción de compras generada por Ollama.
 * Es el contrato central del Agentic Task Center.
 *
 * Ciclo de vida del estado:
 *   pendiente → confirmada → ejecutada
 *   pendiente → rechazada  (el usuario cancela)
 *   ejecutada → error      (falla en comprasService)
 */
export interface TareaCompras {
  /** ID único generado en el cliente (crypto.randomUUID) */
  id: string;

  /** Acción que el LLM determinó ejecutar */
  accion: AccionCompras;

  /** Datos de ejecución extraídos del lenguaje natural */
  payload: PayloadCompras;

  /**
   * Si true, se muestra un TaskCard con botón de confirmación antes de ejecutar.
   * Si false, se ejecuta directamente (solo para acciones de bajo riesgo: CONSULTAR).
   */
  confirmacion_requerida: boolean;

  /** Texto en español que la IA generó para mostrar al usuario */
  mensaje_usuario: string;

  /** Estado del ciclo de vida de la tarea */
  estado: 'pendiente' | 'confirmada' | 'ejecutada' | 'rechazada' | 'error';

  /** ISO 8601 — momento en que la IA generó la tarea */
  timestamp: string;

  /** Rol del usuario que originó la instrucción */
  rol_origen: RolCompras;

  /**
   * Rol al que va dirigida la tarea (presente solo cuando el Jefe delega al Operativo).
   * undefined = la tarea se ejecuta en el mismo rol que la originó.
   */
  rol_destino?: RolCompras;

  /** Instrucción original del usuario (texto o transcripción de voz) */
  instruccion_original: string;

  /** Resultado de la ejecución en la API (disponible solo cuando estado === 'ejecutada' | 'error') */
  resultado_api?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENSAJE ERP — Extiende Message de use-chat.ts para soportar task-cards
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extensión del tipo Message de Zustand para el Agentic Task Center.
 * Añade los tipos 'task_card' y 'thinking' al campo `type`.
 *
 * Compatibilidad: message-list.tsx renderiza condicionalmente por `type`.
 * - 'text'      → burbuja normal (comportamiento original)
 * - 'thinking'  → animación de "IA procesando..."
 * - 'task_card' → TaskCard con botón Confirmar/Rechazar
 */
export interface MensajeERP {
  id: string;
  content: string;            // Para 'text' y 'thinking': el texto. Para 'task_card': mensaje_usuario
  timestamp: string;
  senderId: 'user' | 'agent' | string;
  type: 'text' | 'image' | 'file' | 'thinking' | 'task_card';
  isEdited: boolean;
  reactions: Array<{ emoji: string; users: string[]; count: number }>;
  replyTo: string | null;
  /** Solo presente cuando type === 'task_card' */
  tarea?: TareaCompras;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPUESTA RAW DE OLLAMA — Lo que el LLM devuelve antes de parsear
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estructura que Ollama debe producir en su respuesta.
 * El system prompt fuerza este formato JSON.
 * use-agent.ts lo valida con un try-catch antes de crear TareaCompras.
 */
export interface RespuestaAgente {
  accion: AccionCompras;
  payload: PayloadCompras;
  confirmacion_requerida: boolean;
  mensaje_usuario: string;
  /**
   * Rol destino opcional: el Jefe lo emite cuando delega al Operativo.
   * Ejemplo: JEFE dicta un ingreso → el LLM devuelve rol_destino: "OPERATIVO_COMPRAS".
   */
  rol_destino?: RolCompras;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISOS POR ROL — Tabla de acciones permitidas
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Acciones permitidas por cada rol.
 * Usada en use-agent.ts para validar que la IA no exceda los permisos del rol.
 */
export const PERMISOS_POR_ROL: Record<RolCompras, AccionCompras[]> = {
  /**
   * JEFE_COMPRAS: Control total sobre el ciclo de compras y proveedores.
   */
  JEFE_COMPRAS: [
    'CREAR_ORDEN',
    'APROBAR_ORDEN',
    'ANULAR_ORDEN',
    'CREAR_PROVEEDOR',
    'CONSULTAR_ORDEN',
    'INFORMATIVO',
  ],
  /**
   * AUXILIAR_COMPRAS: Operaciones de apoyo, consultas y devoluciones.
   */
  AUXILIAR_COMPRAS: [
    'CONSULTAR_ORDEN',
    'REGISTRAR_DEVOLUCION',
    'INFORMATIVO',
  ],
  /**
   * OPERATIVO_COMPRAS: Solo recibe mercancía físicamente contra una orden.
   */
  OPERATIVO_COMPRAS: [
    'CONSULTAR_ORDEN',
    'REGISTRAR_RECEPCION',
    'INFORMATIVO',
  ],
};
