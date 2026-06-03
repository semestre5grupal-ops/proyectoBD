import { apiFetch } from './api';

export interface Departamento {
  id_departamento?: number;
  dep_nombre: string;
  dep_estado: string;
  dep_feccreacion: string;
}

export const departamentoService = {
  getAll: async () => {
  getAll: async (): Promise<Departamento[]> => {
    const response = await apiFetch('/departamento');
    if (!response.ok) throw new Error('Error al obtener departamentos');
    return await response.json();
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
