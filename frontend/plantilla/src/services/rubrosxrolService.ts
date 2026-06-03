import { apiFetch } from './api';

export interface Rubrosxrol {
  id_dxe?: number;
  id_rol: number;
  id_rubros: number;
  dxe_cantidad: number;
  dxe_estado: string;
}

export const rubrosxrolService = {
  getAll: async (): Promise<Rubrosxrol[]> => {
    const response = await apiFetch('/rubrosxrol');
    if (!response.ok) throw new Error('Error al obtener rubros por rol');
    return await response.json();
  },

  create: async (rubroxrol: Rubrosxrol): Promise<Rubrosxrol> => {
    const response = await apiFetch('/rubrosxrol', {
      method: 'POST',
      body: JSON.stringify(rubroxrol),
    });
    if (!response.ok) throw new Error('Error al asignar rubro al rol');
    return await response.json();
  }
};
