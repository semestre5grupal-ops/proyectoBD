// API client service for Inventario microservice (api-inventario)

const API_BASE_URL = import.meta.env.VITE_API_INVENTARIO || import.meta.env.VITE_URL_API_INVENTARIO || "http://localhost:4000";

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

// Mock data to enable client-side selection as fallback
const MOCK_VARIANTES: Variante[] = [
  { id_variante: 10, var_nombre: "Camiseta Roja S", var_cod_barras: "90000001", var_precio_venta: 15.00 },
  { id_variante: 11, var_nombre: "Camiseta Roja M", var_cod_barras: "90000002", var_precio_venta: 15.00 },
  { id_variante: 12, var_nombre: "Camiseta Roja L", var_cod_barras: "90000003", var_precio_venta: 15.00 },
  { id_variante: 13, var_nombre: "Camiseta Azul S", var_cod_barras: "90000004", var_precio_venta: 15.00 },
  { id_variante: 14, var_nombre: "Camiseta Azul M", var_cod_barras: "90000005", var_precio_venta: 15.00 },
  { id_variante: 15, var_nombre: "Camiseta Azul L", var_cod_barras: "90000006", var_precio_venta: 15.00 },
  { id_variante: 16, var_nombre: "Pantalón Jean Negro 30", var_cod_barras: "90000007", var_precio_venta: 25.00 },
  { id_variante: 17, var_nombre: "Pantalón Jean Negro 32", var_cod_barras: "90000008", var_precio_venta: 25.00 },
  { id_variante: 18, var_nombre: "Pantalón Jean Negro 34", var_cod_barras: "90000009", var_precio_venta: 25.00 },
  { id_variante: 19, var_nombre: "Chaqueta Impermeable Verde M", var_cod_barras: "90000010", var_precio_venta: 45.00 },
  { id_variante: 20, var_nombre: "Chaqueta Impermeable Verde L", var_cod_barras: "90000011", var_precio_venta: 45.00 }
];

const MOCK_BODEGAS: Bodega[] = [
  { id_bodega: 1, bod_nombre: "Bodega Principal - Guayaquil", bod_codigo: "BOD-01" },
  { id_bodega: 2, bod_nombre: "Bodega Insumos y Materia Prima", bod_codigo: "BOD-02" },
  { id_bodega: 3, bod_nombre: "Bodega Ventas Express", bod_codigo: "BOD-03" }
];

// Fetch active variants list
export const getVariantes = async (): Promise<Variante[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventario/variantes`, { headers: getHeaders() });
    const json = await res.json();
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (error) {
    console.warn("Failed to fetch variants from API, falling back to mock data", error);
  }
  return MOCK_VARIANTES;
};

// Fetch warehouses list
export const getBodegas = async (): Promise<Bodega[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventario/bodegas`, { headers: getHeaders() });
    const json = await res.json();
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (error) {
    console.warn("Failed to fetch warehouses from API, falling back to mock data", error);
  }
  return MOCK_BODEGAS;
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
