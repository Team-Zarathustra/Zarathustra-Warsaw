import axios, { InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL;
const MAX_REFRESH_ATTEMPTS = 3;
let refreshAttempts = 0;

// Define endpoints that don't require authentication
// Note: removed '/research/limits' from this list to fix the rate limit issue
const PUBLIC_ENDPOINTS: string[] = [
  // Add other public endpoints as needed
];

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

// Create the base API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  // More precise matching to avoid false positives
  return PUBLIC_ENDPOINTS.some(endpoint => 
    url === endpoint || 
    url.endsWith(endpoint) || 
    url.includes(endpoint + '/')
  );
};

// Token management
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

// Export the isTokenExpired function
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  const decodedToken = decodeToken(token);
  if (!decodedToken) return true;
  
  const expiryTime = decodedToken.exp * 1000;
  return Date.now() >= expiryTime - 60000; // 1 minute buffer
};

// Export the getValidToken function
export const getValidToken = async (): Promise<string> => {
  const token = localStorage.getItem('authToken');
  
  if (!token || isTokenExpired(token)) {
    // Check if refresh token exists before attempting to refresh
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
  
  refreshAttempts = 0;  // Reset counter on successful token use
  return token;
};

const refreshToken = async (): Promise<string> => {
  try {
    // Use a direct axios call to avoid circular dependency
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

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Skip authentication for public endpoints
    if (config.url && isPublicEndpoint(config.url)) {
      return config;
    }
    
    // For authenticated endpoints
    try {
      // Only get a token if one exists
      const token = localStorage.getItem('authToken');
      if (token) {
        // Don't try to refresh expired tokens here - just use what we have
        config.headers.Authorization = `Bearer ${token}`;
        // Only add withCredentials for authenticated requests
        config.withCredentials = true;
      }
      return config;
    } catch (error) {
      // For protected endpoints, still try to proceed
      console.error('Auth error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Don't attempt to refresh token for public endpoints
    if (originalRequest.url && isPublicEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we have a refresh token before attempting to refresh
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