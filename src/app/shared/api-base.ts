// Base relativa: en dev la resuelve proxy.conf.json (/api -> localhost:18080),
// en prod la resuelve Caddy (handle /api/* -> api:8080). Evita CORS y URLs quemadas.
export const API_BASE = '/api/v1';
