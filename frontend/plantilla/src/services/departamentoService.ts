import { apiFetch } from './api';

export interface Departamento {
  id_departamento?: number;
  dep_nombre: string;
  dep_estado: string;
  dep_feccreacion: string;
}

export const departamentoService = {
  getAll: async () => {
    const response = await apiFetch('/departamento');
    if (!response.ok) throw new Error('Error al obtener departamentos');
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/departamento/${id}`);
    if (!response.ok) throw new Error('Error al obtener departamento');
    const json = await response.json();
    return json.data || json;
  },

  create: async (data: Partial<Departamento>) => {
    const response = await apiFetch('/departamento', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al crear departamento');
    }
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, data: Partial<Departamento>) => {
    const response = await apiFetch(`/departamento/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Error al actualizar departamento');
    }
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number) => {
    const response = await apiFetch(`/departamento/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar departamento');
    const json = await response.json();
    return json.data || json;
  }
};
