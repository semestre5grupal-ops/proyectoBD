import { apiFetch } from './api';

export interface Rol {
  id_rol?: number;
  nombre_rol: string;
}

export const rolService = {
  getAll: async () => {
    const response = await apiFetch('/roles');
    if (!response.ok) throw new Error('Error al obtener roles');
    const json = await response.json();
    return json.data || json;
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/roles/${id}`);
    if (!response.ok) throw new Error('Error al obtener el rol');
    const json = await response.json();
    return json.data || json;
  },

  create: async (data: Partial<Rol>) => {
    const response = await apiFetch('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear rol');
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, data: Partial<Rol>) => {
    const response = await apiFetch(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar rol');
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number) => {
    const response = await apiFetch(`/roles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar rol');
    const json = await response.json();
    return json.data || json;
  },
};
