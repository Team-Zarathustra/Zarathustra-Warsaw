import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isGoogleLoaded && !window.google) {
        setLoadError('Google client failed to load');
      }
    }, 5000);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      setIsGoogleLoaded(true);
      clearTimeout(timeoutId);
    };
    script.onerror = () => {
      setLoadError('Failed to load Google authentication');
      clearTimeout(timeoutId);
    };

    document.body.appendChild(script);

    return () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  if (loadError) {
    console.error('Google Auth Error:', loadError);
    return children;
  }

  return (
    <GoogleOAuthProvider clientId="332770290313-lg69jb4hcbq274htt3pumkv1m7i546l9.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  );
};