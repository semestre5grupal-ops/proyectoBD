import { apiFetch } from './api';

export interface Asistencia {
  id_asistencia?: number;
  id_empleado: number;
  fecha_hora: string;
  tipo_movimiento: string;
}

export const asistenciaService = {
  getAll: async (): Promise<Asistencia[]> => {
    const response = await apiFetch('/asistencia');
    if (!response.ok) throw new Error('Error al obtener asistencias');
    return await response.json();
  },

  create: async (asistencia: Asistencia): Promise<Asistencia> => {
    const response = await apiFetch('/asistencia', {
      method: 'POST',
      body: JSON.stringify(asistencia),
    });
    if (!response.ok) throw new Error('Error al registrar asistencia');
    return await response.json();
  },

  update: async (id: number, asistencia: Asistencia): Promise<Asistencia> => {
    const response = await apiFetch(`/asistencia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asistencia),
    });
    if (!response.ok) throw new Error('Error al actualizar asistencia');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/asistencia/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar asistencia');
  }
};
