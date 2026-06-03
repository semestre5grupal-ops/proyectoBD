import { apiFetch } from './api';

export interface Usuario {
  id_usuario?: number;
  usu_nombre: string;
  usu_contra?: string;
  id_rol: number;
}

export const usuarioService = {
  getAll: async () => {
    const response = await apiFetch('/usuarios');
    if (!response.ok) throw new Error('Error al obtener usuarios');
    return await response.json();
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/usuarios/${id}`);
    if (!response.ok) throw new Error('Error al obtener el usuario');
    return await response.json();
  },

  create: async (data: Partial<Usuario>) => {
    const response = await apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear usuario');
    return await response.json();
  },

  update: async (id: number, data: Partial<Usuario>) => {
    const response = await apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar usuario');
    return await response.json();
  },

  delete: async (id: number) => {
    const response = await apiFetch(`/usuarios/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar usuario');
    return await response.json();
  },
};
