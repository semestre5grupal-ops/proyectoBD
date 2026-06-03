// API client service for Compras microservice (api-compras)

const API_BASE_URL = import.meta.env.VITE_URL_API_COMPRAS || "http://localhost:3002";

// Helper to get headers with the token
const getHeaders = () => {
  const token = localStorage.getItem("jwt_token") || "super_secreto_para_desarrollo_local_123";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

export interface Ciudad {
  id_ciudad?: number;
  ciu_nombre: string;
  ciu_abreviado: string;
  ciu_estado: boolean;
}

export interface Proveedor {
  id_proveedor?: number;
  id_ciudad: number;
  prv_nombre: string;
  prv_ciruc: string;
  prv_telefono: string;
  prv_mail: string;
  prv_celular: string;
  prv_direccion: string;
  prv_estado: string; // 'ACT', 'INA'
}

export interface Proxoc {
  id_variante: number;
  pxo_cantidad: number;
  pxo_valor: number;
  pxo_subtotal?: number;
  pxo_estado?: string;
}

export interface Compra {
  id_compra?: number;
  id_proveedor: number;
  oc_fecha?: string;
  oc_fechaentrega: string | null;
  oc_subtotal?: number;
  oc_iva: number; // 12 or 15
  oc_total?: number;
  oc_estado?: 'ABI' | 'APR' | 'ANU';
  items: Proxoc[];
  proveedor_nombre?: string; // hydrated frontend field
}

export interface Proxrec {
  id_variante: number;
  pxr_cantidad_solicitada: number;
  pxr_qty_recibida: number;
  pxr_diferencia: number;
  pxr_motivo_diferencia: string | null;
  pxr_estado?: string;
}

export interface Recepcion {
  id_recepcion?: number;
  id_compra: number;
  id_bodega: number;
  rec_descripcion: string;
  rec_fechahora?: string;
  rec_num_productos?: number;
  rec_fecharesolucion?: string | null;
  usu_responsable: string;
  rec_estado?: 'ABI' | 'APR' | 'ANU';
  items: Proxrec[];
}

export interface Proxdevc {
  id_variante: number;
  pxdc_cantidad_recibida: number;
  pxdc_cantidad_devuelta: number;
  pxdc_diferencia: number;
  pxdc_motivo: string | null;
  pxdc_estado?: string;
}

export interface Devolucion {
  id_devcompra_pk?: number;
  id_compra: number;
  id_bodega: number;
  devc_fechahora?: string;
  devc_motivo: string;
  devc_num_produc?: number;
  devc_fecharesolucion?: string | null;
  usu_responsable: string;
  devc_estado?: 'ABI' | 'APR' | 'ANU';
  items: Proxdevc[];
}

// 1. Ciudades API
export const getCiudades = async (): Promise<Ciudad[]> => {
  const res = await fetch(`${API_BASE_URL}/api/ciudades`, { headers: getHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch cities");
  return json.success ? json.data : [];
};

export const createCiudad = async (ciudad: Ciudad): Promise<Ciudad> => {
  const res = await fetch(`${API_BASE_URL}/api/ciudades`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(ciudad)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create city");
  return json.data;
};

// 2. Proveedores API
export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await fetch(`${API_BASE_URL}/api/proveedores`, { headers: getHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch suppliers");
  return json.success ? json.data : [];
};

export const createProveedor = async (proveedor: Proveedor): Promise<Proveedor> => {
  const res = await fetch(`${API_BASE_URL}/api/proveedores`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(proveedor)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create supplier");
  return json.data;
};

export const updateProveedor = async (id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
  const res = await fetch(`${API_BASE_URL}/api/proveedores/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(proveedor)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update supplier");
  return json.data;
};

// 3. Compras (Purchase Orders) API
export const getCompras = async (): Promise<Compra[]> => {
  const res = await fetch(`${API_BASE_URL}/api/compras`, { headers: getHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch purchase orders");
  return json.success ? json.data : [];
};

export const getCompraDetails = async (id: number): Promise<Compra> => {
  const res = await fetch(`${API_BASE_URL}/api/compras/${id}`, { headers: getHeaders() });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch purchase order details");
  return json.data;
};

export const createCompra = async (compra: Compra): Promise<Compra> => {
  const res = await fetch(`${API_BASE_URL}/api/compras`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(compra)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create purchase order");
  return json.data;
};

export const updateCompraEstado = async (id: number, estado: 'ABI' | 'APR' | 'ANU'): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/compras/${id}/estado`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ estado })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update purchase order status");
  return json;
};

export const updateCompra = async (id: number, compra: Compra): Promise<Compra> => {
  const res = await fetch(`${API_BASE_URL}/api/compras/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(compra)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update purchase order");
  return json.data;
};

// 4. Recepciones API
export const getRecepciones = async (): Promise<Recepcion[]> => {
  const res = await fetch(`${API_BASE_URL}/api/recepciones`, { headers: getHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch receptions");
  return json.success ? json.data : [];
};

export const createRecepcion = async (recepcion: Recepcion): Promise<Recepcion> => {
  const res = await fetch(`${API_BASE_URL}/api/recepciones`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(recepcion)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to register reception");
  return json.data;
};

export const aprobarRecepcion = async (id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/recepciones/${id}/aprobar`, {
    method: "PUT",
    headers: getHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to approve reception");
  return json;
};

// 5. Devoluciones API
export const getDevoluciones = async (): Promise<Devolucion[]> => {
  const res = await fetch(`${API_BASE_URL}/api/devoluciones-compra`, { headers: getHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch returns");
  return json.success ? json.data : [];
};

export const createDevolucion = async (devolucion: Devolucion): Promise<Devolucion> => {
  const res = await fetch(`${API_BASE_URL}/api/devoluciones-compra`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(devolucion)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to register return");
  return json.data;
};

export const aprobarDevolucion = async (id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/devoluciones-compra/${id}/aprobar`, {
    method: "PUT",
    headers: getHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to approve return");
  return json;
};
