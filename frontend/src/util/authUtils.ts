import axios, { InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL;
const MAX_REFRESH_ATTEMPTS = 3;
let refreshAttempts = 0;

if (!API_URL) {
  throw new Error('API URL not configured. Please set REACT_APP_API_URL or VITE_API_URL in your environment variables.');
}

interface DecodedToken {
  exp: number;
  userId: number;
  [key: string]: any;
}

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

export const clearTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  try {
    const decodedToken = decodeToken(accessToken);
    
    if (!decodedToken || !decodedToken.userId) {
      throw new Error('Invalid token structure');
    }
    
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userId', decodedToken.userId.toString());
  } catch (error) {
    console.error('Failed to set tokens:', error);
    throw error;
  }
};

const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
};

export const getUserIdFromToken = (token: string): number | null => {
  const decodedToken = decodeToken(token);
  return decodedToken?.userId ?? null;
};

export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  const decodedToken = decodeToken(token);
  if (!decodedToken) return true;
  
  const expiryTime = decodedToken.exp * 1000;
  return Date.now() >= expiryTime - 60000;
};

export const getValidToken = async (): Promise<string> => {
  const token = localStorage.getItem('authToken');
  
  if (!token || isTokenExpired(token)) {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }
    
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      clearTokens();
      throw new Error('Max refresh attempts reached');
    }
    
    try {
      refreshAttempts++;
      return await refreshToken();
    } catch (error) {
      clearTokens();
      throw error;
    }
  }
  
  refreshAttempts = 0;
  return token;
};

const refreshToken = async (): Promise<string> => {
  try {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    const response = await axios.post(`${API_URL}/auth/refresh-token`, 
      { refreshToken: refreshTokenValue },
      { 
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    );
    
    const { accessToken } = response.data;
    localStorage.setItem('authToken', accessToken);
    return accessToken;
  } catch (error) {
    clearTokens();
    throw error;
  }
};

api.interceptors.request.use(
  async (config) => {
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.withCredentials = true;
      }
      return config;
    } catch (error) {
      console.error('Auth error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshTokenExists = localStorage.getItem('refreshToken') !== null;
      if (!refreshTokenExists) {
        return Promise.reject(new Error('No refresh token available'));
      }
      
      if (isRefreshing) {
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;