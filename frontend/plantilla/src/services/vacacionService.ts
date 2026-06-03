import { apiFetch } from './api';

export interface Vacacion {
  id_vacacion?: number;
  id_contrato: number;
  vac_periodo: string;
  vac_diasg: number;
  vac_diasp: number;
  vac_saldo: number;
}

export const vacacionService = {
  getAll: async (): Promise<Vacacion[]> => {
    const response = await apiFetch('/vacaciones');
    if (!response.ok) throw new Error('Error al obtener vacaciones');
    return await response.json();
  },

  create: async (vacacion: Vacacion): Promise<Vacacion> => {
    const response = await apiFetch('/vacaciones', {
      method: 'POST',
      body: JSON.stringify(vacacion),
    });
    if (!response.ok) throw new Error('Error al crear vacacion');
    return await response.json();
  },

  update: async (id: number, vacacion: Vacacion): Promise<Vacacion> => {
    const response = await apiFetch(`/vacaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vacacion),
    });
    if (!response.ok) throw new Error('Error al actualizar vacacion');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/vacaciones/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar vacacion');
  }
};
