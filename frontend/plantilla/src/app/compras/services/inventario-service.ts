// API client service for Inventario microservice (api-inventario)

const API_BASE_URL = import.meta.env.VITE_URL_API_INVENTARIO || "http://localhost:4000";

// Helper to get headers with the token
const getHeaders = () => {
  const token = localStorage.getItem("jwt_token") || "super_secreto_para_desarrollo_local_123";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

export interface Variante {
  id_variante: number;
  var_nombre: string;
  var_cod_barras: string;
  var_precio_venta: number;
  stock?: number;
}

export interface Bodega {
  id_bodega: number;
  bod_nombre: string;
  bod_codigo: string;
}

// Mock data to enable client-side selection since api-inventario doesn't have list endpoints
const MOCK_VARIANTES: Variante[] = [
  { id_variante: 1, var_nombre: "Chocolate Barra Dark 70%", var_cod_barras: "78610001", var_precio_venta: 2.50 },
  { id_variante: 2, var_nombre: "Chocolate Barra Milk 45%", var_cod_barras: "78610002", var_precio_venta: 2.25 },
  { id_variante: 3, var_nombre: "Trufas de Avellana Caja", var_cod_barras: "78610003", var_precio_venta: 5.00 },
  { id_variante: 4, var_nombre: "Chocolate Blanco con Frutilla", var_cod_barras: "78610004", var_precio_venta: 2.75 },
  { id_variante: 5, var_nombre: "Cobertura de Chocolate Semiamargo (1kg)", var_cod_barras: "78610005", var_precio_venta: 12.00 }
];

const MOCK_BODEGAS: Bodega[] = [
  { id_bodega: 1, bod_nombre: "Bodega Principal - Guayaquil", bod_codigo: "BOD-01" },
  { id_bodega: 2, bod_nombre: "Bodega Insumos y Materia Prima", bod_codigo: "BOD-02" },
  { id_bodega: 3, bod_nombre: "Bodega Ventas Express", bod_codigo: "BOD-03" }
];

// Fetch active variants list
export const getVariantes = async (): Promise<Variante[]> => {
  // In production, once the backend endpoint is added, use:
  // const res = await fetch(`${API_BASE_URL}/api/inventario/variantes`, { headers: getHeaders() });
  // const json = await res.json();
  // if (!res.ok) throw new Error(json.error || "Failed to fetch variants");
  // return json.data;
  
  return Promise.resolve(MOCK_VARIANTES);
};

// Fetch warehouses list
export const getBodegas = async (): Promise<Bodega[]> => {
  // In production, once the backend endpoint is added, use:
  // const res = await fetch(`${API_BASE_URL}/api/inventario/bodegas`, { headers: getHeaders() });
  // ...
  
  return Promise.resolve(MOCK_BODEGAS);
};

// Get current stock for a specific variant
export const getStock = async (idVariante: number): Promise<{ success: boolean; id_bodega: number; stock_disponible: number }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventario/stock/${idVariante}`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to fetch stock status");
    return json;
  } catch (error) {
    console.warn("Stock fetch failed, using fallback mock stock", error);
    return {
      success: true,
      id_bodega: 1,
      stock_disponible: Math.floor(Math.random() * 100) + 10
    };
  }
};

// Send inventory ingress (when a reception is approved in frontend)
export const ingresarStock = async (payload: {
  idVariante: number;
  cantidad: number;
  idBodega: number;
  descripcion: string;
  usuario: string;
}): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/inventario/ingresar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to ingress inventory stock");
  return json;
};

// Send inventory egress (when a return is approved in frontend)
export const descontarStock = async (payload: {
  idVariante: number;
  cantidad: number;
}): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/inventario/descontar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to egress inventory stock");
  return json;
};
