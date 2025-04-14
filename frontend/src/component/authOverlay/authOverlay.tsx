import React from 'react';
import { useState } from 'react';
import { LoginPage } from '@/loginPage/loginPage';
import { useAuth } from '@/context/authContext';
import { postAuthentication } from "@/api/user";
import { useNavigate } from 'react-router-dom';

interface AuthOverlayProps {
  children: React.ReactNode;
}

export function AuthOverlay({ children }: AuthOverlayProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (credentials: { email: string; password: string }) => {
    try {
      const response = await postAuthentication('login', credentials);
      const { accessToken, refreshToken } = response.data;
      login(accessToken, refreshToken);
      handleLoginSuccess();
    } catch (error) {
      console.error('Login error:', error);
      return Promise.reject(error);
    }
  };

  const handleLoginSuccess = () => {
    navigate('/tables');
  };

  return (
    <div className="fixed inset-0 w-full h-full">
      <div className="absolute inset-0 filter blur-sm pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-background/50 grid place-items-center">
        <div className="w-full max-w-3xl mx-auto px-4">
          <LoginPage 
            onSubmit={handleSubmit}
            onLoginSuccess={handleLoginSuccess}
            isLoading={false}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}