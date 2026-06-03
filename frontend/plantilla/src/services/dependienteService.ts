import { apiFetch } from './api';

export interface Dependiente {
  id_dependiente?: number;
  id_empleado: number;
  dep_ceddoc: string;
  dep_nom1: string;
  dep_nom2?: string;
  dep_ap1: string;
  dep_ap2?: string;
  dep_fechanacimiento: string;
  dep_sexo: string;
  dep_parentesco: string;
  dep_estado: string;
}

export const dependienteService = {
  getAll: async (): Promise<Dependiente[]> => {
    const response = await apiFetch('/dependientes');
    if (!response.ok) throw new Error('Error al obtener dependientes');
    return await response.json();
  },

  create: async (dependiente: Dependiente): Promise<Dependiente> => {
    const response = await apiFetch('/dependientes', {
      method: 'POST',
      body: JSON.stringify(dependiente),
    });
    if (!response.ok) throw new Error('Error al crear dependiente');
    return await response.json();
  },

  update: async (id: number, dependiente: Dependiente): Promise<Dependiente> => {
    const response = await apiFetch(`/dependientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dependiente),
    });
    if (!response.ok) throw new Error('Error al actualizar dependiente');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/dependientes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar dependiente');
  }
};
