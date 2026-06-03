import { apiFetch } from './api';

export interface Cargo {
  id_cargo?: number;
  id_departamento: number;
  car_nombre: string;
  car_sueldobase: number;
  car_feccreacion: string;
  car_estado?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export const cargoService = {
  getAll: async (page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Cargo>> => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.append('search', search);
    
    const response = await apiFetch(`/cargo?${query.toString()}`);
    if (!response.ok) throw new Error('Error al obtener cargos');
    return await response.json();
  },

  getAllList: async (): Promise<Cargo[]> => {
    const response = await apiFetch('/cargo?limit=all');
    if (!response.ok) throw new Error('Error al obtener cargos');
    const res = await response.json();
    return res.data || res;
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/cargo/${id}`);
    if (!response.ok) throw new Error('Error al obtener cargo');
    const json = await response.json();
    return json.data || json;
  },

  create: async (cargo: Cargo): Promise<Cargo> => {
    const response = await apiFetch('/cargo', {
      method: 'POST',
      body: JSON.stringify(cargo),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al crear cargo');
    }
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, cargo: Cargo): Promise<Cargo> => {
    const response = await apiFetch(`/cargo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cargo),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al actualizar cargo');
    }
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/cargo/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar cargo');
    const json = await response.json();
    return json.data || json;
  }
};
