/**
 * erp-agent.ts
 * ------------
 * TIPOS DEL DOMINIO — Agentic ERP Task Center
 * Proyecto RDA3 · Módulo de Inventario (Paul)
 *
 * Estas interfaces son el contrato entre:
 *   - La respuesta JSON de Ollama (el LLM debe producir este esquema)
 *   - El hook use-agent.ts (parsea y valida la respuesta)
 *   - Los componentes de UI (task-card.tsx, message-list.tsx)
 *   - inventarioService.ts (ejecuta la acción resultante)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES — Mapeados desde el JWT de Alejandro (authService.ts)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Roles del Agentic Task Center para el módulo de Inventario.
 * Mapeo desde el JWT:
 *   id_rol === 1  | rol === "ADMIN"         → JEFE_INVENTARIO
 *   id_rol === 2  | rol === "EMPLEADO_BODEGA"→ AUXILIAR_INVENTARIO
 *   otro          | rol === "CLIENTE_..."   → OPERATIVO_INVENTARIO (solo confirmaciones)
 */
export type RolInventario =
  | 'JEFE_INVENTARIO'       // Permisos completos: crear, dar de baja, sincronizar
  | 'AUXILIAR_INVENTARIO'   // Solo ajustes de stock (ingresar, consultar)
  | 'OPERATIVO_INVENTARIO'; // Solo recibe y confirma notificaciones de tareas

// ═══════════════════════════════════════════════════════════════════════════════
// ACCIONES — Comandos que la IA puede generar
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Acciones válidas que Ollama puede instruir.
 * Mapeadas directamente a los endpoints de inventarioService.ts.
 */
export type AccionInventario =
  | 'INGRESAR_STOCK'      // Ejecuta el ingreso real al stock — solo OPERATIVO al confirmar
  | 'DESCONTAR_STOCK'     // → inventarioService.descontarStock()
  | 'DAR_DE_BAJA'         // Baja lógica de variante (solo JEFE)
  | 'CONSULTAR'           // → inventarioService.consultarStock()
  | 'SINCRONIZAR'         // → inventarioService.sincronizarCloud() (solo JEFE)
  | 'INFORMATIVO'         // La IA pide más datos o responde sin ejecutar
  | 'CONFIRMAR_RECEPCION' // OPERATIVO: confirma haber recibido una tarea del Jefe
  | 'CREAR_PRODUCTO'      // JEFE: delega ingreso de mercancía al OPERATIVO
  | 'AUTORIZAR_AJUSTE'   // JEFE: autoriza un ajuste de stock manual
  | 'CONFIRMAR_ENTREGA'; // ← AÑADE ESTA LÍNEA

// ═══════════════════════════════════════════════════════════════════════════════
// PAYLOAD — Datos de ejecución para inventarioService
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Campos de ejecución extraídos por la IA del lenguaje natural del usuario.
 * Todos son opcionales porque algunas acciones (CONSULTAR, SINCRONIZAR)
 * no necesitan todos los campos.
 */
export interface PayloadInventario {
  idVariante?: number;
  cantidad?: number;
  idBodega?: number;
  descripcion?: string;
  usuario?: string;
  idCabecera?: number;
  cantidadEsperada?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAREA — Unidad de trabajo generada por el agente
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Representa una instrucción de inventario generada por Ollama.
 * Es el contrato central del Agentic Task Center.
 *
 * Ciclo de vida del estado:
 *   pendiente → confirmada → ejecutada
 *   pendiente → rechazada  (el usuario cancela)
 *   ejecutada → error      (falla en inventarioService)
 */
export interface TareaInventario {
  /** ID único generado en el cliente (crypto.randomUUID) */
  id: string;

  /** Acción que el LLM determinó ejecutar */
  accion: AccionInventario;

  /** Datos de ejecución extraídos del lenguaje natural */
  payload: PayloadInventario;

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
  rol_origen: RolInventario;

  /**
   * Rol al que va dirigida la tarea (presente solo cuando el Jefe delega al Operativo).
   * undefined = la tarea se ejecuta en el mismo rol que la originó.
   */
  rol_destino?: RolInventario;

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
  tarea?: TareaInventario;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPUESTA RAW DE OLLAMA — Lo que el LLM devuelve antes de parsear
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estructura que Ollama debe producir en su respuesta.
 * El system prompt fuerza este formato JSON.
 * use-agent.ts lo valida con un try-catch antes de crear TareaInventario.
 */
export interface RespuestaAgente {
  accion: AccionInventario;
  payload: PayloadInventario;
  confirmacion_requerida: boolean;
  mensaje_usuario: string;
  /**
   * Rol destino opcional: el Jefe lo emite cuando delega al Operativo.
   * Ejemplo: JEFE dicta un ingreso → el LLM devuelve rol_destino: "OPERATIVO_INVENTARIO".
   */
  rol_destino?: RolInventario;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISOS POR ROL — Tabla de acciones permitidas
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Acciones permitidas por cada rol.
 * Usada en use-agent.ts para validar que la IA no exceda los permisos del rol.
 */
export const PERMISOS_POR_ROL: Record<RolInventario, AccionInventario[]> = {
  /**
   * JEFE_INVENTARIO: Puede autorizar y delegar. NO ejecuta ingresos directamente;
   * los estructura como CREAR_PRODUCTO / AUTORIZAR_AJUSTE con rol_destino OPERATIVO.
   */
  JEFE_INVENTARIO: [
    'CREAR_PRODUCTO',
    'AUTORIZAR_AJUSTE',
    'CONFIRMAR_RECEPCION',
    'DESCONTAR_STOCK',
    'DAR_DE_BAJA',
    'CONSULTAR',
    'SINCRONIZAR',
    'INFORMATIVO',
    'CONFIRMAR_ENTREGA',
  ],
  AUXILIAR_INVENTARIO: [
    'INGRESAR_STOCK',
    'AUTORIZAR_AJUSTE',
    'CONSULTAR',
    'INFORMATIVO',
  ],
  /**
   * OPERATIVO_INVENTARIO: Recibe y confirma entregas (Ventas) y recepciones (Compras).
   * CONFIRMAR_RECEPCION: Para recepciones de Compras.
   * CONFIRMAR_ENTREGA: Para despachos de Ventas.
   * INGRESAR_STOCK: Fallback para confirmar stock directamente si no hay idCabecera.
   */
  OPERATIVO_INVENTARIO: [
    'CONFIRMAR_RECEPCION',
    'CONFIRMAR_ENTREGA',
    'INGRESAR_STOCK',
    'INFORMATIVO',
  ],
};
