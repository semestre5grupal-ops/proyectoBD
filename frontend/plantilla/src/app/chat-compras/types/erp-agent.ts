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
 *   id_rol === 1  | rol === "ADMIN"         → JEFE_COMPRAS
 *   id_rol === 2  | rol === "EMPLEADO_BODEGA"→ AUXILIAR_COMPRAS
 *   otro          | rol === "CLIENTE_..."   → OPERATIVO_COMPRAS (solo confirmaciones)
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
  | 'INGRESAR_STOCK'      // Ejecuta el ingreso real al stock — solo OPERATIVO al confirmar
  | 'DESCONTAR_STOCK'     // → comprasService.descontarStock()
  | 'DAR_DE_BAJA'         // Baja lógica de variante (solo JEFE)
  | 'CONSULTAR'           // → comprasService.consultarStock()
  | 'SINCRONIZAR'         // → comprasService.sincronizarCloud() (solo JEFE)
  | 'INFORMATIVO'         // La IA pide más datos o responde sin ejecutar
  | 'CONFIRMAR_RECEPCION' // OPERATIVO: confirma haber recibido una tarea del Jefe
  | 'CREAR_PRODUCTO'      // JEFE: delega ingreso de mercancía al OPERATIVO
  | 'AUTORIZAR_AJUSTE';   // JEFE: autoriza un ajuste de stock manual

// ═══════════════════════════════════════════════════════════════════════════════
// PAYLOAD — Datos de ejecución para comprasService
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Campos de ejecución extraídos por la IA del lenguaje natural del usuario.
 * Todos son opcionales porque algunas acciones (CONSULTAR, SINCRONIZAR)
 * no necesitan todos los campos.
 */
export interface PayloadCompras {
  idVariante?: number;
  cantidad?: number;
  idBodega?: number;
  descripcion?: string;
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
   * JEFE_COMPRAS: Puede autorizar y delegar. NO ejecuta ingresos directamente;
   * los estructura como CREAR_PRODUCTO / AUTORIZAR_AJUSTE con rol_destino OPERATIVO.
   */
  JEFE_COMPRAS: [
    'CREAR_PRODUCTO',
    'AUTORIZAR_AJUSTE',
    'CONFIRMAR_RECEPCION',
    'DESCONTAR_STOCK',
    'DAR_DE_BAJA',
    'CONSULTAR',
    'SINCRONIZAR',
    'INFORMATIVO',
  ],
  AUXILIAR_COMPRAS: [
    'INGRESAR_STOCK',
    'AUTORIZAR_AJUSTE',
    'CONSULTAR',
    'INFORMATIVO',
  ],
  /**
   * OPERATIVO_COMPRAS: Recibe tareas del Jefe y ejecuta el stock real al confirmar.
   * INGRESAR_STOCK se permite aqui para que ejecutarTarea() pueda llamar a ingresarStock()
   * cuando el operativo confirma la recepcion fisica.
   */
  OPERATIVO_COMPRAS: [
    'CONFIRMAR_RECEPCION',
    'INGRESAR_STOCK',
    'INFORMATIVO',
  ],
};
