// components/military-intelligence/ui/RateLimitModal.tsx
import React, { useEffect } from 'react';
import { X, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../context/authContext';
import { useNavigate } from 'react-router-dom';
import { RateLimitInfo } from '../../../../type/intelligence';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitInfo: RateLimitInfo;
  language?: string;
}

export const RateLimitModal: React.FC<RateLimitModalProps> = ({
  isOpen,
  onClose,
  limitInfo,
  language = 'en'
}) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  // Function to get translated text
  const t = (key: string): string => {
    // Simple translations for rate limit modal
    const translations: Record<string, Record<string, string>> = {
      en: {
        rateLimit: 'Daily Limit Reached',
        rateLimitMessageAuth: 'You have used all {limit} of your daily analyses.',
        rateLimitMessageUnauth: 'You have used all {limit} of your daily analyses.',
        resetsAt: 'Resets at: {time}',
        tomorrow: 'Tomorrow at',
        signInForMore: 'Create an account or sign in for higher daily limits.',
        signIn: 'Sign In',
        gotIt: 'Got It'
      },
      cs: {
        rateLimit: 'Denní limit dosažen',
        rateLimitMessageAuth: 'Použili jste všech {limit} vašich denních analýz.',
        rateLimitMessageUnauth: 'Použili jste všech {limit} vašich denních analýz.',
        resetsAt: 'Obnoví se v {time}',
        tomorrow: 'Zítra v',
        signInForMore: 'Vytvořte si účet nebo se přihlaste pro vyšší denní limity.',
        signIn: 'Přihlásit se',
        gotIt: 'Rozumím'
      }
    };
    
    const currentLang = language === 'cs' ? 'cs' : 'en';
    return translations[currentLang][key] || key;
  };

  // Prevent scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  // Format reset time nicely
  const formatResetTime = () => {
    if (!limitInfo.resetsAt) return '';
    
    const resetDate = new Date(limitInfo.resetsAt);
    const now = new Date();
    
    // If it's tomorrow
    if (resetDate.getDate() !== now.getDate() || 
        resetDate.getMonth() !== now.getMonth() || 
        resetDate.getFullYear() !== now.getFullYear()) {
      return t('tomorrow') + ' ' + resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's today
    return resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="bg-red-900/30 px-6 py-4 flex justify-between items-center border-b border-red-900/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-lg font-medium">{t('rateLimit')}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <p className="text-gray-200 text-lg font-normal mb-3">
              {isLoggedIn ? 
                t('rateLimitMessageAuth').replace('{limit}', String(limitInfo.limit || limitInfo.total)) :
                t('rateLimitMessageUnauth').replace('{limit}', String(limitInfo.limit || limitInfo.total))
              }
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Zap className="h-4 w-4" />
              <span>{t('resetsAt').replace('{time}', formatResetTime())}</span>
            </div>
          </div>
          
          {!isLoggedIn && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-gray-300 text-center">
                {t('signInForMore')}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-3 mt-6">
            {!isLoggedIn && (
              <button
                onClick={() => {
                  navigate('/login');
                  onClose();
                }}
                className="w-full py-3 px-4 bg-red-700 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                {t('signIn')}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 border border-gray-700 transition-colors"
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};