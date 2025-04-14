// components/military-intelligence/layout/Header.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  User,
  LogOut,
  Globe,
  Menu,
  X,
  Zap,
  Plus,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RateLimitInfo } from '../../../type/intelligence';

interface HeaderProps {
  reportId?: string;
  onStartOver?: () => void;
  onExport?: (format: 'pdf' | 'text' | 'email' | 'nato') => void;
  rateLimitInfo?: RateLimitInfo | null;
  isHeaderSticky?: boolean;
  t: (key: string) => string;
  shouldRefreshLimits?: boolean;
  setShouldRefreshLimits?: (value: boolean) => void;
  isLoggedIn: boolean;
  logout: () => void;
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  reportId,
  onStartOver,
  onExport,
  rateLimitInfo,
  isHeaderSticky = false,
  t,
  shouldRefreshLimits = false,
  setShouldRefreshLimits = () => {},
  isLoggedIn,
  logout,
  currentLanguage,
  setCurrentLanguage
}) => {
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [isProfileOpen, setProfileOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  const navigate = useNavigate();
  
  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (showExportOptions && !target.closest('.export-dropdown')) {
        setShowExportOptions(false);
      }
      
      if (isProfileOpen && !target.closest('.profile-dropdown')) {
        setProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportOptions, isProfileOpen]);
  
  // Toggle export dropdown
  const toggleExportOptions = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowExportOptions(prev => !prev);
  }, []);
  
  // Toggle profile dropdown
  const toggleProfileDropdown = useCallback(() => {
    setProfileOpen(prev => !prev);
  }, []);
  
  // Toggle language
  const toggleLanguage = useCallback(() => {
    const newLang = currentLanguage === 'en' ? 'cs' : 'en';
    setCurrentLanguage(newLang);
  }, [currentLanguage, setCurrentLanguage]);
  
  return (
      <div className={`
        w-full h-16 
        ${isHeaderSticky 
          ? 'bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200' 
          : 'bg-white border-b border-gray-200/30'}
        transition-all duration-200
      `}>
      <div className="flex items-center justify-center h-full px-4 md:px-6 relative">
        {/* Center content */}
        {reportId && (
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center bg-red-900/20 rounded-md border border-red-800/40">
                <FileText className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <h1 className="text-gray-800 font-medium">Report #{reportId.substring(0, 8)}</h1>
                <p className="text-xs text-gray-500">Intelligence Analysis</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Right side - Actions (positioned absolutely) */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 md:space-x-3">
          {/* Rate Limit Indicator */}
          {rateLimitInfo && (
            <div className="hidden md:flex items-center bg-gray-100 px-2 py-1 rounded border border-gray-200">
              <Zap className="h-3.5 w-3.5 mr-1.5 text-red-400" />
              <span className="text-xs text-gray-700 font-medium">
                {rateLimitInfo.remaining}/{rateLimitInfo.limit || rateLimitInfo.total}
              </span>
            </div>
          )}
          
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          
          {/* Export Dropdown - only on results page */}
          {reportId && onExport && (
            <div className="relative export-dropdown">
              <button
                onClick={toggleExportOptions}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Export options"
              >
                <Download className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      onExport('text');
                      setShowExportOptions(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left"
                  >
                    Text
                  </button>
                  <button
                    onClick={() => {
                      onExport('pdf');
                      setShowExportOptions(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => {
                      onExport('nato');
                      setShowExportOptions(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left"
                  >
                    NATO Format
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* New Analysis - only on results page */}
          {reportId && onStartOver && (
            <button
              onClick={onStartOver}
              className="hidden md:flex p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="New analysis"
              title="New analysis"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          )}
          
          {/* Separator */}
          <div className="hidden md:block h-8 w-px bg-gray-300/50 mx-1"></div>
          
          {/* Profile dropdown */}
          <div className="relative profile-dropdown">
            {isLoggedIn ? (
              <>
                <button
                  onClick={toggleProfileDropdown}
                  className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors rounded-md"
              >
                Sign In
              </button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute right-4 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {/* Rate Limit (Mobile) */}
          {rateLimitInfo && (
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
              Daily limits: {rateLimitInfo.remaining}/{rateLimitInfo.limit || rateLimitInfo.total}
            </div>
          )}
          
          {/* Language Switcher */}
          <button
            onClick={() => {
              toggleLanguage();
              setMobileMenuOpen(false);
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left"
          >
            <Globe className="h-4 w-4 mr-2" />
            {currentLanguage === 'en' ? 'Čeština' : 'English'}
          </button>
          
          {/* Export Options - only on results page */}
          {reportId && onExport && (
            <>
              <div className="px-4 py-1 text-xs text-gray-500 border-t border-gray-200">
                Export options
              </div>
              <button
                onClick={() => {
                  onExport('text');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as Text
              </button>
              <button
                onClick={() => {
                  onExport('pdf');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </button>
            </>
          )}
          
          {/* New Analysis - only on results page */}
          {reportId && onStartOver && (
            <button
              onClick={() => {
                onStartOver();
                setMobileMenuOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left border-t border-gray-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;