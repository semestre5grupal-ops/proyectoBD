import { apiFetch } from './api';

export interface Empleado {
  id_empleado?: number;
  emp_nombre: string;
  emp_apellido: string;
  emp_cedula: string;
  emp_telefono: string;
  emp_direccion: string;
  emp_fecha_contratacion: string;
  id_departamento?: number | null;
}

export const empleadoService = {
  getEmpleados: async (): Promise<Empleado[]> => {
    const response = await apiFetch('/empleados');
    if (!response.ok) throw new Error('Error al obtener empleados');
    return await response.json();
  },

  createEmpleado: async (empleado: Empleado): Promise<Empleado> => {
    const response = await apiFetch('/empleados', {
      method: 'POST',
      body: JSON.stringify(empleado),
    });
    if (!response.ok) throw new Error('Error al crear empleado');
    return await response.json();
  },

  updateEmpleado: async (id: number, empleado: Empleado): Promise<Empleado> => {
    const response = await apiFetch(`/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(empleado),
    });
    if (!response.ok) throw new Error('Error al actualizar empleado');
    return await response.json();
  },

  deleteEmpleado: async (id: number): Promise<void> => {
    const response = await apiFetch(`/empleados/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar empleado');
  }
};
