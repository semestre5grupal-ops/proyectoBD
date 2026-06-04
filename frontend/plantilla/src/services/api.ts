const API_URL = import.meta.env.VITE_API_TALENTO_HUMANO || 'http://localhost:3000/api';

// Cache en memoria para peticiones GET (TTL: 30s)
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000;

export function invalidateCache(prefix?: string) {
  if (!prefix) { _cache.clear(); return; }
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key);
  }
}

// Unwrap { success, data, ...meta } -> data o meta completo
function unwrapBody(jsonBody: any) {
  if (jsonBody && typeof jsonBody === 'object' && 'success' in jsonBody && 'data' in jsonBody) {
    const { success, ...rest } = jsonBody;
    return Object.keys(rest).length === 1 ? rest.data : rest;
  }
  return jsonBody;
}

// Response sintética con json() ya unwrapped (para hits de caché)
function makeSyntheticResponse(rawData: any): Response {
  const unwrapped = unwrapBody(rawData);
  const r = new Response(JSON.stringify(rawData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  r.json = async () => unwrapped;
  return r;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isGET = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `${API_URL}${endpoint}`;

  // Servir desde caché si es GET y está fresca
  if (isGET) {
    const cached = _cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return makeSyntheticResponse(cached.data);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('jwt_token');
    window.location.href = '/auth/sign-in';
  }

  // Guardar raw body en caché para GETs exitosos
  if (isGET && response.ok) {
    response.clone().json().then(body => {
      _cache.set(cacheKey, { data: body, ts: Date.now() });
    }).catch(() => {});
  }

  // Override json() para unwrap automático de { success, data }
  const originalJson = response.json.bind(response);
  response.json = async () => unwrapBody(await originalJson());

  return response;
}
