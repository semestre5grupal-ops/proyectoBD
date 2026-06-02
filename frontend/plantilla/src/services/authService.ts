import { apiFetch } from './api';

export const authService = {
  login: async (usu_nombre: string, usu_contra: string) => {
    const response = await apiFetch('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ usu_nombre, usu_contra }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje || 'Error al iniciar sesión');
    }

    const data = await response.json();
    
    // Guardar el token en el localStorage
    if (data.token) {
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.usuario));
    }
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    window.location.href = '/auth/sign-in';
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('jwt_token');
  }
};
