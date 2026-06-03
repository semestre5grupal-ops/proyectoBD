import { apiFetch } from './api';

export interface Horario {
  id_horario?: number;
  hor_nombre_horario: string;
  hor_horastotal: number;
}

export const horarioService = {
  getAll: async (): Promise<Horario[]> => {
    const response = await apiFetch('/horario');
    if (!response.ok) throw new Error('Error al obtener horarios');
    return await response.json();
  },

  create: async (horario: Horario): Promise<Horario> => {
    const response = await apiFetch('/horario', {
      method: 'POST',
      body: JSON.stringify(horario),
    });
    if (!response.ok) throw new Error('Error al crear horario');
    return await response.json();
  },

  update: async (id: number, horario: Horario): Promise<Horario> => {
    const response = await apiFetch(`/horario/${id}`, {
      method: 'PUT',
      body: JSON.stringify(horario),
    });
    if (!response.ok) throw new Error('Error al actualizar horario');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/horario/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar horario');
  }
};
