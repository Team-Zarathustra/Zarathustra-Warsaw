import React from 'react';
import { Globe } from 'lucide-react';
import { useMilitaryLanguage } from '../utils/militaryTranslations';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'mobile' | 'compact';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '',
  variant = 'default'
}) => {
  const { language, setLanguage } = useMilitaryLanguage();
  
  // Handle language toggle
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'cs' : 'en');
  };
  
  // Mobile version (floating button)
  if (variant === 'mobile') {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center justify-center p-3 
                  bg-gray-800 rounded-full shadow-md
                  border border-gray-700 hover:bg-gray-700
                  transition-all duration-200 ${className}`}
        aria-label={language === 'en' ? 'Switch to Czech' : 'Switch to English'}
      >
        <Globe className="h-5 w-5 text-gray-300" />
      </button>
    );
  }
  
  // Compact version (icon only)
  if (variant === 'compact') {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center justify-center p-2
                  bg-gray-800 rounded-md hover:bg-gray-700
                  border border-gray-700
                  transition-all duration-200 ${className}`}
        aria-label={language === 'en' ? 'Switch to Czech' : 'Switch to English'}
      >
        <Globe className="h-4 w-4 text-gray-300" />
      </button>
    );
  }
  
  // Default version
  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 
                text-gray-400 hover:text-gray-200 
                bg-gray-800 rounded-md hover:bg-gray-700
                border border-gray-700 hover:border-gray-600
                transition-all duration-200 ${className}`}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm">
        {language === 'en' ? 'Čeština' : 'English'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;