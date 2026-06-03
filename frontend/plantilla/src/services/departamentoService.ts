import { apiFetch } from './api';

export interface Departamento {
  id_departamento?: number;
  dep_nombre: string;
  dep_estado: string;
  dep_feccreacion: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export const departamentoService = {
  getAll: async (page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Departamento>> => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.append('search', search);
    
    const response = await apiFetch(`/departamento?${query.toString()}`);
    if (!response.ok) throw new Error('Error al obtener departamentos');
    return await response.json();
  },

  getAllList: async (): Promise<Departamento[]> => {
    const response = await apiFetch('/departamento?limit=all');
    if (!response.ok) throw new Error('Error al obtener departamentos');
    const res = await response.json();
    return res.data || res;
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/departamento/${id}`);
    if (!response.ok) throw new Error('Error al obtener departamento');
    const json = await response.json();
    return json.data || json;
  },

  create: async (departamento: Departamento): Promise<Departamento> => {
    const response = await apiFetch('/departamento', {
      method: 'POST',
      body: JSON.stringify(departamento),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al crear departamento');
    }
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, departamento: Departamento): Promise<Departamento> => {
    const response = await apiFetch(`/departamento/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departamento),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al actualizar departamento');
    }
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/departamento/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar departamento');
    const json = await response.json();
    return json.data || json;
  }
};
