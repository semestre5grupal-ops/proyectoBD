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
    const json = await response.json();
    return json.data || json;
  },

  getById: async (id: number) => {
    const response = await apiFetch(`/usuarios/${id}`);
    if (!response.ok) throw new Error('Error al obtener el usuario');
    const json = await response.json();
    return json.data || json;
  },

  create: async (data: Partial<Usuario>) => {
    const response = await apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear usuario');
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, data: Partial<Usuario>) => {
    const response = await apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar usuario');
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number) => {
    const response = await apiFetch(`/usuarios/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar usuario');
    const json = await response.json();
    return json.data || json;
  },
};
