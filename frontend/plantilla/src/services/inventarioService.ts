/**
 * inventarioService.ts
 * ---------------------
 * CAPA DE SERVICIOS — Módulo de Inventario
 * Proyecto RDA3 — Comercial JW Cóndor
 *
 * Golden Rules aplicadas:
 *  ✅ Solo realiza peticiones HTTP hacia la API de Render.
 *  ✅ Retorna la respuesta JSON estandarizada { success, ... } sin procesarla.
 *  ✅ No modifica el DOM.
 *  ✅ No usa useState, useEffect ni ningún hook de React.
 *  ✅ No lanza alertas ni console.log de negocio.
 *  ✅ Toda la comunicación inter-módulos es por HTTP (sin conexiones directas a BD).
 *
 * SESIÓN 4 — Refactorización JWT:
 *  ✅ Inyecta Authorization: Bearer <TOKEN> en todas las peticiones.
 *  ✅ Usa la misma clave localStorage('jwt_token') de authService (Alejandro).
 *  ✅ Ante 401/403 elimina el token y redirige a /auth/sign-in (espeja api.ts).
 *  ✅ Lee la URL base desde VITE_API_INVENTARIO con fallback a localhost:4000 (desarrollo).
 */

// ─── URL base del microservicio de Inventario ───────────────────────────────────────────────
// Lee VITE_API_INVENTARIO del .env de Vite.
// Fallback: http://localhost:4000 (ambiente de desarrollo local).
// NUNCA usar URLs de producción hardcodeadas aquí — cambiar el .env para producir.
const API_BASE_URL =
  (import.meta.env.VITE_API_INVENTARIO as string | undefined) ??
  "http://localhost:4000";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS — Contratos de Request y Response según CONTEXTO_ACTUAL_PROYECTO.md
// ═══════════════════════════════════════════════════════════════════════════════

/** Payload requerido por POST /api/inventario/ingresar */
export interface IngresarStockPayload {
  idVariante: number;
  cantidad: number;
  idBodega: number;
  descripcion: string;
  usuario: string;
}

/** Respuesta base de la API: { success: true/false } + campos adicionales */
export interface ApiBaseResponse {
  success: boolean;
  error?: string;
}

/** GET /api/inventario/stock/:idVariante — Response */
export interface ConsultarStockResponse extends ApiBaseResponse {
  id_bodega?: number;
  stock_disponible?: number;
}

/** POST /api/inventario/descontar — Response */
export interface DescontarStockResponse extends ApiBaseResponse {
  message?: string;
  stock_restante?: number;
}

/** POST /api/inventario/ingresar — Response */
export interface IngresarStockResponse extends ApiBaseResponse {
  message?: string;
  stock_actual?: number;
}

/** GET /api/inventario/sincronizar-cloud — Response */
export interface SincronizarCloudResponse extends ApiBaseResponse {
  message?: string;
  items_sincronizados?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER INTERNO — apiFetch con inyección automática de JWT
//
// Por qué construimos el objeto Headers aquí y no en options:
//   fetch() fusiona los headers de options con los que pasamos al constructor.
//   Si pasamos `headers` como objeto en options, el spread lo sobreescribiría.
//   Construir un Headers() propio y pasarlo como prop `headers` garantiza que
//   Authorization siempre esté presente, independientemente del options del caller.
// ═══════════════════════════════════════════════════════════════════════════════

async function apiFetch<T extends ApiBaseResponse>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // 1. Leer token del localStorage — misma clave que usa api.ts de Alejandro
  const token = localStorage.getItem("jwt_token");

  // 2. Construir headers con Content-Type + Authorization Bearer
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 3. Ejecutar la petición — headers va fuera del spread de options para que
  //    no sea sobreescrito por un posible campo headers en options del caller.
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers, // siempre sobreescribe el headers de options
  });

  // 4. Sesión expirada o sin permisos.
  //    IMPORTANTE: NO redirigimos aquí con window.location.href porque esta
  //    función es llamada desde use-agent.ts durante flujos del Agente IA.
  //    Redirigir en caliente cortaría la sesión mientras el LLM procesa.
  //    El hook captura "SESION_EXPIRADA" y lo muestra como agentError en el chat.
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "SESION_EXPIRADA: No tienes permisos para ejecutar esta operación. " +
      "Tu sesión puede haber expirado o el rol no tiene acceso a este endpoint."
    );
  }

  const data: T = await response.json();

  // 5. Propagar error de negocio (success: false del servidor)
  if (!data.success) {
    throw new Error(data.error ?? `Error HTTP ${response.status} en ${endpoint}`);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS — Un método por endpoint del microservicio
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Consulta el stock disponible de una variante de producto.
 *
 * Requiere rol: ADMIN | EMPLEADO_BODEGA | CLIENTE_VISITANTE (JWT obligatorio)
 *
 * @param idVariante - PK en la tabla variantes_producto
 * @returns { success, id_bodega, stock_disponible }
 *
 * Endpoint: GET /api/inventario/stock/:idVariante
 */
export async function consultarStock(
  idVariante: number
): Promise<ConsultarStockResponse> {
  return apiFetch<ConsultarStockResponse>(
    `/api/inventario/stock/${idVariante}`
  );
}

/**
 * Descuenta unidades del inventario (consumido por api-ventas / ajuste manual).
 *
 * Requiere rol: ADMIN | EMPLEADO_BODEGA
 *
 * @param idVariante - ID de la variante de producto
 * @param cantidad   - Unidades a descontar (> 0)
 * @returns { success, message, stock_restante }
 *
 * Endpoint: POST /api/inventario/descontar
 */
export async function descontarStock(
  idVariante: number,
  cantidad: number
): Promise<DescontarStockResponse> {
  return apiFetch<DescontarStockResponse>("/api/inventario/descontar", {
    method: "POST",
    body: JSON.stringify({ idVariante, cantidad }),
  });
}

/**
 * Registra el ingreso de mercadería a bodega.
 * Genera auditoría en la tabla `recepciones` del microservicio.
 *
 * Requiere rol: ADMIN | EMPLEADO_BODEGA
 *
 * @param payload - { idVariante, cantidad, idBodega, descripcion, usuario }
 * @returns { success, message, stock_actual }
 *
 * Endpoint: POST /api/inventario/ingresar
 */
export async function ingresarStock(
  payload: IngresarStockPayload
): Promise<IngresarStockResponse> {
  return apiFetch<IngresarStockResponse>("/api/inventario/ingresar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Sincronización masiva del catálogo hacia Firebase Realtime Database.
 * Operación de escritura total — reemplaza el nodo /catalogo_ecommerce completo.
 *
 * Requiere rol: ADMIN
 *
 * @returns { success, message, items_sincronizados }
 *
 * Endpoint: GET /api/inventario/sincronizar-cloud
 */
export async function sincronizarCloud(): Promise<SincronizarCloudResponse> {
  return apiFetch<SincronizarCloudResponse>("/api/inventario/sincronizar-cloud");
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES DE TAREAS — Persistencia desde el frontend
// ═══════════════════════════════════════════════════════════════════════════════

/** Payload para POST /api/inventario/tareas */
export interface NotificacionTareaPayload {
  accion: string;
  mensaje_usuario: string;
  rol_origen: string;
  rol_destino: string;
  payload_json?: Record<string, unknown>;
}

/** Response de POST /api/inventario/tareas */
export interface CrearTareaResponse extends ApiBaseResponse {
  message?: string;
  data?: Record<string, unknown>;
}

/**
 * Persiste una notificación de tarea en Supabase a través del backend.
 * El frontend la llama en use-agent.ts tan pronto como Ollama genera el JSON
 * de intención y se detecta que rol_destino !== rol del usuario actual.
 *
 * Endpoint: POST /api/inventario/tareas
 */
export async function crearNotificacionTarea(
  payload: NotificacionTareaPayload
): Promise<CrearTareaResponse> {
  return apiFetch<CrearTareaResponse>("/api/inventario/tareas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

