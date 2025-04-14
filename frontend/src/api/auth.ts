import axios from 'axios';

// Create a separate API instance for auth operations that doesn't use the auth interceptors
const API_URL = import.meta.env.VITE_API_URL;
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
}

export const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
    }

    return token;
}

export const getPersonalGoogleAuth = async () => {
    const token = getAuthToken();
    return await authApi.get('/auth/google/personal', {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export const getGroupGoogleAuth = async () => {
    const token = getAuthToken();
    return await authApi.get('/auth/google/group', {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export const saveGoogleGroupEmail = async (groupEmail: string) => {
    const token = getAuthToken();
    return await authApi.post('/auth/google/group/configure', 
        { groupEmail },
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

export const postRefreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    // Use the authApi instance without auth interceptors to avoid circular dependencies
    return await authApi.post<TokenResponse>('/auth/refresh-token', { refreshToken });
}

// Add login function that uses the authApi instance
export const login = async (email: string, password: string) => {
    return await authApi.post<TokenResponse>('/auth/login', { email, password });
}

// Add signup function that uses the authApi instance
export const signup = async (email: string, password: string, name: string) => {
    return await authApi.post<TokenResponse>('/auth/signup', { email, password, name });
}

// Helper function to check if user is logged in
export const isLoggedIn = () => {
    return localStorage.getItem('authToken') !== null;
};