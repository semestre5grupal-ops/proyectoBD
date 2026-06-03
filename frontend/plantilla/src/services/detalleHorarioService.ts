import { apiFetch } from './api';

export interface DetalleHorario {
  id_detalle?: number;
  id_horario: number;
  det_dia_semana: string;
  det_hora_entrada: string;
  det_hora_salida: string;
}

export const detalleHorarioService = {
  getAll: async (): Promise<DetalleHorario[]> => {
    const response = await apiFetch('/detallehorario');
    if (!response.ok) throw new Error('Error al obtener detalles de horario');
    return await response.json();
  },

  create: async (detalle: DetalleHorario): Promise<DetalleHorario> => {
    const response = await apiFetch('/detallehorario', {
      method: 'POST',
      body: JSON.stringify(detalle),
    });
    if (!response.ok) throw new Error('Error al crear detalle de horario');
    return await response.json();
  }
};
