const API_URL = import.meta.env.VITE_API_TALENTO_HUMANO || 'http://localhost:3000/api';

/**
 * Función base para hacer peticiones a la API con el Token JWT inyectado automáticamente.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Obtener el token del localStorage
  const token = localStorage.getItem('jwt_token');

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // Si hay token, inyectarlo en el Header de Authorization
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si el token expiró o es inválido, redirigir al login
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('jwt_token');
    window.location.href = '/auth/sign-in';
  }

  return response;
}
