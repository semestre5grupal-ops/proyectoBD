const API_BASE_URL =
  import.meta.env.VITE_URL_API_VENTAS || "https://proyectobd-api-ventas.onrender.com";

const getHeaders = () => {
  const token =
    localStorage.getItem("jwt_token") || "super_secreto_para_desarrollo_local_123";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
};

// ── Tipos de respuesta ────────────────────────────────────────────────────────

export interface Rango {
  desde: string;
  hasta: string;
}

export interface KpisResponse {
  ventas_anio: number;
  ventas_mes: number;
  facturas_aprobadas: number;
  notas_credito: number;
}

export interface PuntoSerie {
  fecha: string;
  total: number;
}

export interface VentasResponse {
  ingresos_serie: PuntoSerie[];
  ticket_promedio: number;
  subtotal: number;
  descuento: number;
  iva: number;
  volumen_ncr: number;
}

export interface VendedorRanking {
  id_vendedor: number;
  nombre?: string;
  total_vendido: number;
  num_facturas: number;
  meta: number;
  comision_pct: number;
  comision_proyectada: number;
}

export interface ComercialResponse {
  ranking: VendedorRanking[];
}

export interface PorCiudad {
  ciudad: string;
  total: number;
}

export interface PorCategoria {
  categoria: number;
  total: number;
}

export interface TopCliente {
  id_cliente: number;
  nombre: string;
  total: number;
}

export interface ClientesResponse {
  por_ciudad: PorCiudad[];
  por_categoria: PorCategoria[];
  top_clientes: TopCliente[];
}

export interface TopVariante {
  id_variante: number;
  nombre?: string;
  cantidad: number;
}

export interface IngresoVariante {
  id_variante: number;
  nombre?: string;
  subtotal: number;
}

export interface ProductosResponse {
  top_cantidad: TopVariante[];
  ingresos: IngresoVariante[];
}

// ── Mocks (fallback mientras backend no esté listo) ───────────────────────────

const USE_MOCK_KPIS = false;
const USE_MOCK_VENTAS = false;
const USE_MOCK_COMERCIAL = false;
const USE_MOCK_CLIENTES = false;
const USE_MOCK_PRODUCTOS = false;

const MOCK_KPIS: KpisResponse = {
  ventas_anio: 148230.5,
  ventas_mes: 12450.75,
  facturas_aprobadas: 87,
  notas_credito: 4,
};

const MOCK_VENTAS: VentasResponse = {
  ingresos_serie: [
    { fecha: "2026-06-01", total: 1200 },
    { fecha: "2026-06-02", total: 980 },
    { fecha: "2026-06-03", total: 1500 },
    { fecha: "2026-06-04", total: 870 },
    { fecha: "2026-06-05", total: 2100 },
    { fecha: "2026-06-06", total: 1750 },
    { fecha: "2026-06-07", total: 2050 },
  ],
  ticket_promedio: 143.1,
  subtotal: 10870.25,
  descuento: 215.5,
  iva: 1629.71,
  volumen_ncr: 2,
};

const MOCK_COMERCIAL: ComercialResponse = {
  ranking: [
    { id_vendedor: 1, nombre: "Ana Torres", total_vendido: 45200, num_facturas: 31, meta: 40000, comision_pct: 2, comision_proyectada: 904 },
    { id_vendedor: 2, nombre: "Luis Mora", total_vendido: 38100, num_facturas: 27, meta: 40000, comision_pct: 2, comision_proyectada: 762 },
    { id_vendedor: 3, nombre: "Karla Vega", total_vendido: 29500, num_facturas: 19, meta: 35000, comision_pct: 1.5, comision_proyectada: 442.5 },
  ],
};

const MOCK_CLIENTES: ClientesResponse = {
  por_ciudad: [
    { ciudad: "Quito", total: 52000 },
    { ciudad: "Guayaquil", total: 38000 },
    { ciudad: "Cuenca", total: 21000 },
    { ciudad: "Ambato", total: 15000 },
  ],
  por_categoria: [
    { categoria: 1, total: 18 },
    { categoria: 2, total: 12 },
    { categoria: 3, total: 8 },
    { categoria: 5, total: 44 },
  ],
  top_clientes: [
    { id_cliente: 101, nombre: "Almacenes XYZ", total: 18500 },
    { id_cliente: 102, nombre: "Distribuidora ABC", total: 14200 },
    { id_cliente: 103, nombre: "Comercial Sur", total: 9800 },
  ],
};

const MOCK_PRODUCTOS: ProductosResponse = {
  top_cantidad: [
    { id_variante: 1, nombre: "Camiseta Azul M", cantidad: 120 },
    { id_variante: 2, nombre: "Pantalón Negro 32", cantidad: 95 },
    { id_variante: 3, nombre: "Zapato Café 42", cantidad: 72 },
  ],
  ingresos: [
    { id_variante: 2, nombre: "Pantalón Negro 32", subtotal: 5700 },
    { id_variante: 3, nombre: "Zapato Café 42", subtotal: 4320 },
    { id_variante: 1, nombre: "Camiseta Azul M", subtotal: 2400 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toQS(rango: Rango) {
  return `desde=${rango.desde}&hasta=${rango.hasta}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error en la petición");
  return (json.data ?? json) as T;
}

// ── Funciones de servicio ─────────────────────────────────────────────────────

export async function getKpis(rango: Rango): Promise<KpisResponse> {
  if (USE_MOCK_KPIS) return MOCK_KPIS;
  return fetchJson<KpisResponse>(`${API_BASE_URL}/api/reportes/kpis?${toQS(rango)}`);
}

export async function getVentas(rango: Rango): Promise<VentasResponse> {
  if (USE_MOCK_VENTAS) return MOCK_VENTAS;
  return fetchJson<VentasResponse>(`${API_BASE_URL}/api/reportes/ventas?${toQS(rango)}`);
}

export async function getComercial(rango: Rango): Promise<ComercialResponse> {
  if (USE_MOCK_COMERCIAL) return MOCK_COMERCIAL;
  return fetchJson<ComercialResponse>(`${API_BASE_URL}/api/reportes/comercial?${toQS(rango)}`);
}

export async function getClientes(rango: Rango): Promise<ClientesResponse> {
  if (USE_MOCK_CLIENTES) return MOCK_CLIENTES;
  return fetchJson<ClientesResponse>(`${API_BASE_URL}/api/reportes/clientes?${toQS(rango)}`);
}

export async function getProductos(rango: Rango): Promise<ProductosResponse> {
  if (USE_MOCK_PRODUCTOS) return MOCK_PRODUCTOS;
  return fetchJson<ProductosResponse>(`${API_BASE_URL}/api/reportes/productos?${toQS(rango)}`);
}
