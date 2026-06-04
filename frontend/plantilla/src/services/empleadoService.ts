import { apiFetch } from './api';

export interface Empleado {
  id_empleado?: number;
  emp_cedula: string;
  emp_nom1: string;
  emp_nom2: string;
  emp_ap1: string;
  emp_ap2: string;
  emp_fechanacimiento: string;
  emp_sexo: string;
  emp_direccion: string;
  emp_telefono: string;
  emp_email: string;
  id_departamento?: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export const empleadoService = {
  getEmpleados: async (page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Empleado>> => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.append('search', search);
    
    const response = await apiFetch(`/empleados?${query.toString()}`);
    if (!response.ok) throw new Error('Error al obtener empleados');
    return await response.json();
  },

  getAllList: async (): Promise<Empleado[]> => {
    const response = await apiFetch('/empleados?limit=all');
    if (!response.ok) throw new Error('Error al obtener empleados');
    const res = await response.json();
    return res.data || res;
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
