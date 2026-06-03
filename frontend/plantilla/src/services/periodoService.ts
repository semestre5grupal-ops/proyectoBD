import { apiFetch } from './api';

export interface Periodo {
  id_rolpago2?: number; // Backend usa id_rolpago2 como PK de periodo
  per_descripcion: string;
  per_fechainicio: string;
  per_fechafin: string;
  per_estado: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export const periodoService = {
  getAll: async (page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Periodo>> => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.append('search', search);
    
    const response = await apiFetch(`/periodo?${query.toString()}`);
    if (!response.ok) throw new Error('Error al obtener periodos');
    return await response.json();
  },

  getAllList: async (): Promise<Periodo[]> => {
    const response = await apiFetch('/periodo?limit=all');
    if (!response.ok) throw new Error('Error al obtener periodos');
    const res = await response.json();
    return res.data || res;
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/periodo/${id}`);
    if (!response.ok) throw new Error('Error al obtener periodo');
    const json = await response.json();
    return json.data || json;
  },

  create: async (periodo: Omit<Periodo, 'id_periodo'>): Promise<Periodo> => {
    const response = await apiFetch('/periodo', {
      method: 'POST',
      body: JSON.stringify(periodo),
    });
    if (!response.ok) throw new Error('Error al crear periodo');
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, periodo: Omit<Periodo, 'id_periodo'>): Promise<Periodo> => {
    const response = await apiFetch(`/periodo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(periodo),
    });
    if (!response.ok) throw new Error('Error al actualizar periodo');
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/periodo/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar periodo');
    const json = await response.json();
    return json.data || json;
  },

  createYearPeriods: async (year: number) => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    const promises = monthNames.map((month, index) => {
      // Meses en JS son 0-indexados. 
      // El primer día es el 1.
      const startDate = new Date(year, index, 1);
      // Para obtener el último día, pasamos el día 0 del mes Siguiente.
      const endDate = new Date(year, index + 1, 0);

      // Formato YYYY-MM-DD
      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const data: Partial<Periodo> = {
        per_descripcion: `${month} ${year}`,
        per_fechainicio: startStr,
        per_fechafin: endStr,
        per_estado: "ABI"
      };

      return periodoService.create(data);
    });

    return Promise.all(promises);
  }
};
