import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { isTokenExpired, getValidToken, clearTokens, getUserIdFromToken, setTokens } from '@/util/authUtils';
import { getIntelligenceLimits } from '@/api/intelligenceService';

interface AuthContextType {
  isLoggedIn: boolean;
  userId: number | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const authEvents = {
  listeners: new Set<() => void>(),
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  
  emit() {
    this.listeners.forEach(listener => listener());
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<number | null>(null);

  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    const newUserId = getUserIdFromToken(accessToken);
    setUserId(newUserId);
    setIsLoggedIn(true);
    
    try {
      await getIntelligenceLimits();
      console.log('Intelligence limits refreshed after login');
    } catch (error) {
      console.error('Failed to refresh intelligence limits after login:', error);
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setIsLoggedIn(false);
    setUserId(null);
    
    authEvents.emit();
  }, []);

  const checkLoginStatus = useCallback(async () => {
    console.log('Checking login status...');
    try {
      const token = localStorage.getItem('authToken');
      console.log('Found token:', !!token);
      
      if (!token) {
        console.log('No token found');
        setIsLoggedIn(false);
        setUserId(null);
        return;
      }
  
      if (isTokenExpired(token)) {
        console.log('Token expired, attempting refresh');
        try {
          const newToken = await getValidToken();
          console.log('Got new token:', !!newToken);
          const newUserId = getUserIdFromToken(newToken);
          setUserId(newUserId);
          setIsLoggedIn(true);
          
          try {
            await getIntelligenceLimits();
            console.log('Intelligence limits refreshed after login');
          } catch (error) {
            console.error('Failed to refresh intelligence limits after login:', error);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          clearTokens();
          setIsLoggedIn(false);
          setUserId(null);
        }
      } else {
        console.log('Token valid');
        const currentUserId = getUserIdFromToken(token);
        setUserId(currentUserId);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearTokens();
      setIsLoggedIn(false);
      setUserId(null);
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      console.warn('Auth check timed out');
    }, 5000);
  
    checkLoginStatus();
  
    return () => {
      clearTimeout(timeoutId);
    };
  }, [checkLoginStatus]);

  const value = useMemo(() => ({
    isLoggedIn,
    userId,
    isLoading,
    login,
    logout,
  }), [isLoggedIn, userId, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { authEvents };