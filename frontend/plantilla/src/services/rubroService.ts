import { apiFetch } from './api';

export interface Rubro {
  id_rubros?: number;
  rub_descripcion: string;
  rub_estado: string;
  rub_tipo: string;
  rub_calculable: string;
}

export const rubroService = {
  getAll: async (): Promise<Rubro[]> => {
    const response = await apiFetch('/rubros');
    if (!response.ok) throw new Error('Error al obtener rubros');
    return await response.json();
  },

  create: async (rubro: Rubro): Promise<Rubro> => {
    const response = await apiFetch('/rubros', {
      method: 'POST',
      body: JSON.stringify(rubro),
    });
    if (!response.ok) throw new Error('Error al crear rubro');
    return await response.json();
  },

  update: async (id: number, rubro: Rubro): Promise<Rubro> => {
    const response = await apiFetch(`/rubros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rubro),
    });
    if (!response.ok) throw new Error('Error al actualizar rubro');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/rubros/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar rubro');
  }
};
