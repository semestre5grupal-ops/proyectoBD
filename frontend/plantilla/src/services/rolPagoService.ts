import { apiFetch } from './api';

export interface RolPago {
  id_rol?: number;
  id_empleado: number;
  id_rolpago2: number; // Suponiendo que es el periodo o tipo de rol
  rol_destotal: number;
  rol_bontotal: number;
  rol_neto: number;
  rol_estado: string;
  rol_dias_trabajados: number;
  rol_comtotal: number;
}

export const rolPagoService = {
  getAll: async (): Promise<RolPago[]> => {
    const response = await apiFetch('/rolpagos');
    if (!response.ok) throw new Error('Error al obtener roles de pago');
    return await response.json();
  },

  create: async (rol: RolPago): Promise<RolPago> => {
    const response = await apiFetch('/rolpagos', {
      method: 'POST',
      body: JSON.stringify(rol),
    });
    if (!response.ok) throw new Error('Error al crear rol de pago');
    return await response.json();
  },

  update: async (id: number, rol: RolPago): Promise<RolPago> => {
    const response = await apiFetch(`/rolpagos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rol),
    });
    if (!response.ok) throw new Error('Error al actualizar rol de pago');
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiFetch(`/rolpagos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar rol de pago');
  }
};
