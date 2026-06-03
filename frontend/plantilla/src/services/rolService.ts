import { apiFetch } from './api';

export interface Rol {
  id_rol?: number;
  rol_nombre: string;
}

export const rolService = {
  getAll: async () => {
    const response = await apiFetch('/roles');
    if (!response.ok) throw new Error('Error al obtener roles');
    return await response.json();
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/roles/${id}`);
    if (!response.ok) throw new Error('Error al obtener el rol');
    return await response.json();
  },

  create: async (data: Partial<Rol>) => {
    const response = await apiFetch('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear rol');
    return await response.json();
  },

  update: async (id: number, data: Partial<Rol>) => {
    const response = await apiFetch(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar rol');
    return await response.json();
  },

  delete: async (id: number) => {
    const response = await apiFetch(`/roles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar rol');
    return await response.json();
  },
};
