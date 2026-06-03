import { apiFetch } from './api';

export interface Cargo {
  id_cargo?: number;
  id_departamento: number;
  car_nombre: string;
  car_sueldobase: number;
  car_feccreacion: string;
  car_estado?: string;
}

export const cargoService = {
  getAll: async () => {
    const response = await apiFetch('/cargo');
    if (!response.ok) throw new Error('Error al obtener cargos');
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/cargo/${id}`);
    if (!response.ok) throw new Error('Error al obtener cargo');
    const json = await response.json();
    return json.data || json;
  },

  create: async (data: Partial<Cargo>) => {
    const response = await apiFetch('/cargo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al crear cargo');
    }
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, data: Partial<Cargo>) => {
    const response = await apiFetch(`/cargo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al actualizar cargo');
    }
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number) => {
    const response = await apiFetch(`/cargo/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar cargo');
    const json = await response.json();
    return json.data || json;
  }
};
