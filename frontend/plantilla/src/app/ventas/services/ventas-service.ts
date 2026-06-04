// API client for api-ventas microservice

const API_BASE_URL = import.meta.env.VITE_URL_API_VENTAS || "https://proyectobd-api-ventas.onrender.com";

const getHeaders = () => {
  const token = localStorage.getItem("jwt_token") || "super_secreto_para_desarrollo_local_123";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
};

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: getHeaders(), ...opts });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || `Error ${res.status}`);
  return (json.data ?? json) as T;
}

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Ciudad {
  id_ciudad?: number;
  ciu_nombre: string;
  ciu_abreviado: string;
  ciu_estado: boolean;
}

export interface Cliente {
  id_cliente?: number;
  id_ciudad: number;
  cli_nombre: string;
  cli_ciruc: string;
  cli_celular: string;
  cli_telefono: string;
  cli_correo: string;
  cli_categoria: string; // 'ORO' | 'PLA' | 'BRO' | 'EST'
  cli_estado: boolean;
}

export interface Vendedor {
  id_vendedor?: number;
  id_empleado: number;
  ven_comision: number;
  ven_meta: number;
  ven_estado: string; // 'ACT' | 'INA'
}

export interface MetodoPago {
  id_metodopago?: number;
  mpg_nombre: string;
  mpg_diferido: boolean;
  mpg_plazos: number | null;
  mpg_estado: boolean;
  mpg_numero_referencia: boolean | null;
}

export interface ItemDocumento {
  id_variante: number;
  pxd_cantidad: number;
  pxd_valor_unitario: number;
  pxd_valor_subtotal: number;
  pxd_estado: string;
}

export interface Documento {
  id_documento?: number;
  id_cliente: number;
  doc_id_documento: number | null; // FK al doc origen (para NCR)
  id_vendedor: number;
  doc_tipo: string;    // 'PRO' | 'FAC' | 'NCR'
  doc_emision: string;
  doc_pago: string | null;
  doc_descripcion: string;
  doc_subtotal: number;
  doc_iva: number;
  doc_descuento: number;
  doc_total: number;
  doc_estado: string;  // 'BOR' | 'EMI' | 'APR' | 'ANU'
  items?: ItemDocumento[];
  // hydrated
  cliente_nombre?: string;
  vendedor_nombre?: string;
}

export interface PagoInput {
  id_metodopago: number;
  monto: number;
  referencia?: string;
  meses?: number;
}

// ── Ciudades ─────────────────────────────────────────────────────────────────

export const getCiudades = () => api<Ciudad[]>("/api/ciudad");

// ── Clientes ─────────────────────────────────────────────────────────────────

export const getClientes = () => api<Cliente[]>("/api/clientes");

export const createCliente = (payload: Omit<Cliente, "id_cliente">) =>
  api<Cliente>("/api/clientes", { method: "POST", body: JSON.stringify(payload) });

export const updateCliente = (id: number, payload: Partial<Cliente>) =>
  api<Cliente>(`/api/clientes/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteCliente = (id: number) =>
  api<Cliente>(`/api/clientes/${id}`, { method: "DELETE" });

// ── Vendedores ────────────────────────────────────────────────────────────────

export const getVendedores = () => api<Vendedor[]>("/api/vendedores");

export const createVendedor = (payload: Omit<Vendedor, "id_vendedor">) =>
  api<Vendedor>("/api/vendedores", { method: "POST", body: JSON.stringify(payload) });

export const updateVendedor = (id: number, payload: Partial<Vendedor>) =>
  api<Vendedor>(`/api/vendedores/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteVendedor = (id: number) =>
  api<Vendedor>(`/api/vendedores/${id}`, { method: "DELETE" });

// ── Métodos de Pago ───────────────────────────────────────────────────────────

export const getMetodosPago = () => api<MetodoPago[]>("/api/metodospago");

// ── Documentos ────────────────────────────────────────────────────────────────

export const getDocumentos = () => api<Documento[]>("/api/documentos");

export const createDocumento = (payload: Omit<Documento, "id_documento">) =>
  api<Documento>("/api/documentos", { method: "POST", body: JSON.stringify(payload) });

export const updateDocumento = (id: number, payload: Partial<Documento>) =>
  api<Documento>(`/api/documentos/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteDocumento = (id: number) =>
  api<Documento>(`/api/documentos/${id}`, { method: "DELETE" });

// ── Stored Procedures / Transiciones de negocio ───────────────────────────────

export const emitirDocumento = (id: number) =>
  api<Documento>(`/api/documentos/${id}/emitir`, { method: "POST" });

export const aprobarDocumento = (id: number, pagos: PagoInput[]) =>
  api<Documento>(`/api/documentos/${id}/aprobar`, { method: "POST", body: JSON.stringify({ pagos }) });

export const anularDocumento = (id: number) =>
  api<Documento>(`/api/documentos/${id}/anular`, { method: "POST" });

export const generarFactura = (id: number) =>
  api<Documento>(`/api/documentos/${id}/factura`, { method: "POST" });

export const generarNotaCredito = (id: number, descripcion?: string) =>
  api<Documento>(`/api/documentos/${id}/nota-credito`, {
    method: "POST",
    body: JSON.stringify({ doc_descripcion: descripcion }),
  });
