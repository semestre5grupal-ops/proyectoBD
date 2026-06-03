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
  getAll: async (): Promise<Cargo[]> => {
    const response = await apiFetch('/cargo');
    if (!response.ok) throw new Error('Error al obtener cargos');
    return await response.json();
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
