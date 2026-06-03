import { apiFetch } from './api';

export interface Contrato {
  id_contrato?: number;
  con_tipo: string;
  con_fechainicio: string;
  con_fechafin?: string | null;
  con_salario: number;
  id_empleado: number;
  id_cargo: number;
}

export const contratoService = {
  getAll: async (): Promise<Contrato[]> => {
    const response = await apiFetch('/contrato');
    if (!response.ok) throw new Error('Error al obtener contratos');
    return await response.json();
  },

  create: async (contrato: Contrato): Promise<Contrato> => {
    const response = await apiFetch('/contrato', {
      method: 'POST',
      body: JSON.stringify(contrato),
    });
    if (!response.ok) throw new Error('Error al crear contrato');
    return await response.json();
  },

  update: async (id: number, contrato: Contrato): Promise<Contrato> => {
    const response = await apiFetch(`/contrato/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contrato),
    });
    if (!response.ok) throw new Error('Error al actualizar contrato');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/contrato/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar contrato');
  }
};
