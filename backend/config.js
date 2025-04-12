import path from 'path';

export const SERVER_HOST = '0.0.0.0';
export const SERVER_PORT = 3000;
export const ALLOWED_ORIGINS = [
  'https://zarathustra.network',
  'https://www.zarathustra.network',
  'http://localhost:5173'
];

export const LOGGER_LEVEL = process.env.LOGGER_LEVEL || 'info';
export const LOGGER_DIRECTORY = process.env.LOGGER_DIRECTORY || 
  (process.env.NODE_ENV === 'production' 
    ? '/home/logs' 
    : path.join(process.cwd(), 'logs'));

export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "";

export const JWT_SECRET = process.env.JWT_SECRET || '';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = process.env.DB_PORT || 5432;
export const DB_NAME = process.env.DB_NAME || 'zarathustra';
export const DB_USER = process.env.DB_USER || 'postgres';
export const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

export const INTELLIGENCE_CACHE_TTL = 86400;
export const INTELLIGENCE_RATE_LIMIT = {
  anonymous: 3,
  basic: 20,
  professional: 100,
  enterprise: 1000
};