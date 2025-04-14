import { StrictMode, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from '@/context/authContext';
import "./main.css";
import { ErrorBoundary } from "@/component/errorBoundary";
import { FusionPage } from "@/component/militaryIntelligence";
import { LoginPage } from "./loginPage";
import { AuthOverlay } from "@/component/authOverlay";
import AuthDebugger from './AuthDebugger';
import { Layout } from "@/component/layout";
import { LegalDocuments } from './legal';
import { postAuthentication } from "@/api/user";
import { useNavigate } from 'react-router-dom';
import { MilitaryLanguageProvider } from '@/component/militaryIntelligence/utils/militaryTranslations';

console.log('Application initialization starting:', new Date().toISOString());
const perfStart = performance.now();

{process.env.NODE_ENV === 'development' && <AuthDebugger />}

function LoginRoute() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (credentials: { email: string; password: string }) => {
    try {
      const response = await postAuthentication('login', credentials);
      const { accessToken, refreshToken } = response.data;
      login(accessToken, refreshToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLoginSuccess = () => {
    navigate('/home');
  };

  return (
    <LoginPage 
      onSubmit={handleSubmit}
      onLoginSuccess={handleLoginSuccess}
      isLoading={false}
      error={null}
    />
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useAuth();
  console.log('ProtectedRoute state:', { isLoggedIn, isLoading });

  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.error('Auth loading timeout - possible infinite loop');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (isLoading) {
    console.log('Auth loading...');
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    console.log('Not logged in, showing overlay');
    return <AuthOverlay>{children}</AuthOverlay>;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "login",
        element: <LoginRoute />,
      },
      {
        path: "home",
        element: <FusionPage />,
      },
    ],
  },
]);

const Root = () => {
  console.log('Root component rendering');
  
  useEffect(() => {
    const perfEnd = performance.now();
    console.log(`Initial render completed in ${perfEnd - perfStart}ms`);
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          console.warn('Long task detected:', entry.duration, 'ms');
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    
    return () => {
      observer.disconnect();
      console.log('Root component unmounting');
    };
  }, []);

  return (
      <AuthProvider>
      <MilitaryLanguageProvider>
          <RouterProvider router={router} />
          </MilitaryLanguageProvider>
      </AuthProvider>
  );
};

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error('Root element not found');

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <Root />
    </StrictMode>
  );

  console.log('Application mounted successfully:', new Date().toISOString());
} catch (error) {
  console.error('Critical application error:', error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        Application failed to initialize. Please refresh the page.
        ${error instanceof Error ? error.message : 'Unknown error'}
      </div>
    `;
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});