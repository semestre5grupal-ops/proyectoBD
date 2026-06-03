import { apiFetch } from './api';

export interface Permiso {
  id_permiso?: number;
  id_empleado: number;
  per_fecha_inicio: string;
  per_fecha_fin: string;
  per_estado: string;
  per_observacion: string;
}

export const permisoService = {
  getAll: async (): Promise<Permiso[]> => {
    const response = await apiFetch('/permisos');
    if (!response.ok) throw new Error('Error al obtener permisos');
    return await response.json();
  },

  create: async (permiso: Permiso): Promise<Permiso> => {
    const response = await apiFetch('/permisos', {
      method: 'POST',
      body: JSON.stringify(permiso),
    });
    if (!response.ok) throw new Error('Error al crear permiso');
    return await response.json();
  },

  update: async (id: number, permiso: Permiso): Promise<Permiso> => {
    const response = await apiFetch(`/permisos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permiso),
    });
    if (!response.ok) throw new Error('Error al actualizar permiso');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/permisos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar permiso');
  }
};
