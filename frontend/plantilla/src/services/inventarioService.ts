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
 */

// ─── URL base del microservicio de Inventario desplegado en Render ─────────────
const API_BASE_URL = "https://api-inventario-1r1w.onrender.com";

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

// ── Responses estándar de la API ──────────────────────────────────────────────

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
// HELPERS INTERNOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ejecuta un fetch y parsea el JSON.
 * Lanza un Error con el mensaje de la API si success === false o si el HTTP
 * status es un error, permitiendo que el controlador lo capture en su try-catch.
 */
async function apiFetch<T extends ApiBaseResponse>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      // El token JWT se añadirá aquí en fases posteriores (SSO con Talento Humano):
      // Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
    },
    ...options,
  });

  const data: T = await response.json();

  // Si el servidor devuelve success: false, propagamos el error descriptivo
  if (!data.success) {
    throw new Error(data.error ?? `Error HTTP ${response.status} en ${endpoint}`);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS — Un método por endpoint validado
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Consulta el stock disponible de una variante de producto.
 *
 * @param idVariante - ID de la variante a consultar (PK en variantes_producto)
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
 * Descuenta unidades del inventario tras una venta.
 * Este endpoint es consumido internamente por api-ventas (Gabriel),
 * pero también es accesible desde el frontend para validaciones directas.
 *
 * @param idVariante - ID de la variante de producto
 * @param cantidad   - Cantidad a descontar (debe ser > 0)
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
 * Registra el ingreso de mercadería a bodega tras una compra.
 * Este endpoint es consumido internamente por api-compras (Liz),
 * pero también es accesible desde el dashboard de Paul para ajustes manuales.
 * Además de actualizar el stock, genera un registro de auditoría en la tabla `recepciones`.
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
 * Dispara la sincronización masiva del catálogo de productos activos
 * desde Supabase hacia Firebase Realtime Database (nodo: /catalogo_ecommerce).
 * Es una operación de escritura total (PUT) que reemplaza el nodo completo en Firebase.
 *
 * @returns { success, message, items_sincronizados }
 *
 * Endpoint: GET /api/inventario/sincronizar-cloud
 */
export async function sincronizarCloud(): Promise<SincronizarCloudResponse> {
  return apiFetch<SincronizarCloudResponse>("/api/inventario/sincronizar-cloud");
}
