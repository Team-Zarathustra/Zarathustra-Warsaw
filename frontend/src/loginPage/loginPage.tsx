import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from "@/component/common/ui/card";
import { Alert } from '@/component/common/ui/alert';
import { AlertDescription } from '@/component/common/ui/alertDescription';
import { LoginForm } from '@/component/loginForm';
import { SignUpForm } from '@/component/signUpForm';
import { postAuthentication } from "@/api/user";

type FormType = 'login' | 'signup' | 'verification';
type AlertType = 'error' | 'success' | 'info';

interface LoginPageProps {
  onSubmit: (credentials: any) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onLoginSuccess?: () => void;
}

interface AlertState {
  type: AlertType;
  title?: string;
  message: string;
}

const getAuthErrorMessage = (error: any): AlertState => {
  const errorCode = error?.response?.data?.code;
  const statusCode = error?.response?.status;

  const errorMessages: Record<string, AlertState> = {
    INVALID_CREDENTIALS: {
      type: 'error',
      title: 'Unable to Sign In',
      message: 'The email or password you entered is incorrect. Please try again.',
    },
    USER_NOT_VERIFIED: {
      type: 'info',
      title: 'Email Not Verified',
      message: 'Please verify your email address before signing in.',
    },
    USER_LOCKED: {
      type: 'error',
      title: 'Account Locked',
      message: 'Your account has been temporarily locked due to multiple failed attempts. Please try again in 15 minutes.',
    },
    RATE_LIMITED: {
      type: 'error',
      title: 'Too Many Attempts',
      message: 'Too many sign-in attempts. Please wait a few minutes before trying again.',
    }
  };

  const statusMessages: Record<number, AlertState> = {
    401: {
      type: 'error',
      title: 'Authentication Failed',
      message: 'Please check your credentials and try again.',
    },
    403: {
      type: 'error',
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.',
    },
    429: {
      type: 'error',
      title: 'Too Many Requests',
      message: 'Please wait a moment before trying again.',
    }
  };

  return (
    errorMessages[errorCode] ||
    statusMessages[statusCode] || {
      type: 'error',
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
    }
  );
};

export function LoginPage({ 
  onSubmit, 
  isLoading = false,
  error = null,
  onLoginSuccess 
}: LoginPageProps) {
  const [currentForm, setCurrentForm] = useState<FormType>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleAuth = async (action: "login" | "register" | "verify", payload: any) => {
    setAlert(null);
    setLocalLoading(true);
    
    try {
      if (action === 'login') {
        try {
          await onSubmit(payload);
          setAlert({
            type: 'success',
            title: 'Login Successful',
            message: 'You are being redirected...'
          });
          
          setTimeout(() => {
            onLoginSuccess?.();
          }, 1000);
        } catch (loginError) {
          console.error(`Login error:`, loginError);
          const errorInfo = getAuthErrorMessage(loginError);
          setAlert(errorInfo);
        }
      } else {
        const response = await postAuthentication(action, payload);
        
        switch (action) {
          case "register":
            setAlert({
              type: 'success',
              title: 'Registration Successful',
              message: 'Please check your email for verification instructions.',
            });
            setTimeout(() => {
              setAlert(null);
              handleFormChange('login');
            }, 3000);
            break;
            
          case "verify":
            setAlert({
              type: 'success',
              title: 'Verification Complete',
              message: 'Your account has been verified. You can now sign in.',
            });
            setTimeout(() => {
              setAlert(null);
              handleFormChange('login');
            }, 2000);
            break;
        }
      }
    } catch (error: any) {
      console.error(`Error during ${action}:`, error);
      const errorInfo = getAuthErrorMessage(error);
      setAlert(errorInfo);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleFormChange = (newForm: FormType) => {
    setIsTransitioning(true);
    setAlert(null);
    
    setTimeout(() => {
      setCurrentForm(newForm);
      setIsTransitioning(false);
    }, 300);
  };

  const showLoading = currentForm === 'login' ? isLoading : localLoading;

  const renderAlert = () => {
    if (!alert && !error) return null;
  
    const alertInfo = alert || {
      type: 'error' as const,
      message: error as string
    };
  
    const alertVariants = {
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
  
    return (
      <Alert 
        variant="default"
        hideDefaultIcon
        className={`
          mb-6 
          rounded-lg 
          border 
          shadow-sm 
          transform 
          transition-all 
          duration-300 
          ease-in-out 
          animate-in 
          fade-in-0 
          slide-in-from-top-2 
          hover:shadow-md
          [&>svg]:hidden
          ${alertVariants[alertInfo.type]}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            {alertInfo.type === 'error' && (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {alertInfo.type === 'success' && (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {alertInfo.type === 'info' && (
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1 space-y-1">
            {alertInfo.title && (
              <h3 className="font-medium text-sm">
                {alertInfo.title}
              </h3>
            )}
            <AlertDescription className="text-sm opacity-90">
              {alertInfo.message}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  };

  return (
    <div className="fixed inset-0 w-full min-h-screen flex flex-col items-center justify-center bg-white">
      <Card className="w-full max-w-lg mx-auto overflow-hidden shadow-sm border border-gray-200/60 rounded-xl">
        <CardHeader className="text-center px-6 pt-8 pb-4">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">
            {currentForm === 'login' ? 'Welcome Back' : 
            currentForm === 'signup' ? 'Create Account' : 
            'Verify Account'}
          </h1>
          
          <span className="text-base text-gray-500 block">
            {currentForm === 'login' ? 'Sign in to access your account' : 
            currentForm === 'signup' ? 'Join Zarathustra today' : 
            'Enter the verification code sent to your email'}
          </span>
        </CardHeader>

        <CardContent className="relative px-6">
          {renderAlert()}

          <div
            className={`transition-all duration-300 ease-in-out ${
              isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
            }`}
          >
            {currentForm === 'login' && (
              <LoginForm 
                onSubmit={(payload) => handleAuth('login', payload)}
                isLoading={showLoading}
              />
            )}
            {currentForm === 'signup' && (
              <SignUpForm 
                onSubmit={(payload) => handleAuth('register', payload)}
                isLoading={showLoading}
              />
            )}
          </div>
        </CardContent>

        {currentForm !== 'verification' && (
          <div className="px-6 py-6 text-center border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {currentForm === 'login' ? "Don't have an account yet?" : "Already have an account?"}
              <button
                onClick={() => handleFormChange(currentForm === 'login' ? 'signup' : 'login')}
                className="ml-1 font-medium text-[#F15B5B] hover:text-[#F15B5B]/80 transition-colors duration-200"
              >
                {currentForm === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        )}

        <CardFooter className="flex justify-center border-t pt-6 pb-6 px-6">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            By continuing, you agree to our
            <Link 
              to="/legal" 
              className="font-medium text-gray-700 hover:text-[#F15B5B] transition-colors duration-200"
            >
              Terms of Service
            </Link>
            &
            <Link 
              to="/legal" 
              className="font-medium text-gray-700 hover:text-[#F15B5B] transition-colors duration-200"
            >
              Privacy Policy
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}