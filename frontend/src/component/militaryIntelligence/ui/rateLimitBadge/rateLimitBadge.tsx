// components/military-intelligence/ui/RateLimitBadge.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Zap } from 'lucide-react';
import { RateLimitInfo } from '../../../../type/intelligence';
import { useAuth } from '../../../../context/authContext';
import { useNavigate } from 'react-router-dom';

interface RateLimitBadgeProps {
  className?: string;
  limitInfo?: RateLimitInfo | null;
  shouldRefresh?: boolean;
  onRefreshed?: () => void;
  language?: string;
}

export const RateLimitBadge: React.FC<RateLimitBadgeProps> = ({ 
  className = '',
  limitInfo = null,   
  shouldRefresh = false,
  onRefreshed,
  language = 'en'
}) => {
  const [internalLimitInfo, setInternalLimitInfo] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const badgeRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Use the parent's limitInfo if provided, otherwise use our internal state
  const displayLimitInfo = limitInfo || internalLimitInfo;
  
  // Function to get translated text
  const t = (key: string): string => {
    // Simple translations for rate limit badge
    const translations: Record<string, Record<string, string>> = {
      en: {
        dailyLimit: 'Daily Analysis Limit',
        requestsRemaining: '{remaining} of {limit} analyses remaining',
        resetsAt: 'Resets at: {time}',
        tomorrow: 'Tomorrow at',
        upgradeForMore: 'Sign in for higher limits'
      },
      cs: {
        dailyLimit: 'Denní limit analýz',
        requestsRemaining: 'Zbývá {remaining} z {limit} analýz',
        resetsAt: 'Obnoví se v {time}',
        tomorrow: 'Zítra v',
        upgradeForMore: 'Přihlaste se pro vyšší limity'
      }
    };
    
    const currentLang = language === 'cs' ? 'cs' : 'en';
    return translations[currentLang][key] || key;
  };
  
  const fetchLimits = async () => {
    try {
      setLoading(true);
      // Import function dynamically to avoid circular dependencies
      const { getFieldReportLimits } = await import('../../../../api/fieldReport');
      const limits = await getFieldReportLimits();
      
      // Adapt to our expected format
      const adapted: RateLimitInfo = {
        ...limits,
        total: limits.limit || 0
      };
      
      setInternalLimitInfo(adapted);
      setError(null);
      
      if (onRefreshed) {
        onRefreshed();
      }
    } catch (err) {
      console.error('Failed to fetch rate limits:', err);
      setError('Could not fetch your current rate limits');
      
      // Set default limits based on authentication status
      const defaultLimits: RateLimitInfo = {
        total: isLoggedIn ? 5 : 3,
        remaining: isLoggedIn ? 5 : 3,
        limit: isLoggedIn ? 5 : 3,
        resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
        isAuthenticated: isLoggedIn
      };
      setInternalLimitInfo(defaultLimits);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if no limitInfo is provided from parent
    if (!limitInfo) {
      fetchLimits();
      
      // Set up an interval to refresh the limits every 3 minutes
      const intervalId = setInterval(fetchLimits, 3 * 60 * 1000);
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);  // No need to load if parent provided limitInfo
    }
  }, [limitInfo]);  // Re-run if limitInfo from parent changes
  
  useEffect(() => {
    if (shouldRefresh && !limitInfo) {  // Only fetch if we're managing our own state
      fetchLimits();
    }
  }, [shouldRefresh, limitInfo]);
  
  // Add click outside handler to close the tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        badgeRef.current && 
        tooltipRef.current && 
        !badgeRef.current.contains(event.target as Node) && 
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Format reset time nicely
  const formatResetTime = () => {
    if (!displayLimitInfo?.resetsAt) return '';
    
    const resetDate = new Date(displayLimitInfo.resetsAt);
    const now = new Date();
    
    // If it's today, just show time
    if (resetDate.getDate() === now.getDate() && 
        resetDate.getMonth() === now.getMonth() &&
        resetDate.getFullYear() === now.getFullYear()) {
      return resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's tomorrow
    return t('tomorrow') + ' ' + resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine badge color based on remaining requests
  const getBadgeColor = () => {
    if (!displayLimitInfo) return 'bg-red-600';
    
    const { remaining, limit } = displayLimitInfo;
    
    if (remaining <= 0) {
      return 'bg-red-700'; // Red for no remaining requests
    } else if (remaining < (limit || 0) * 0.5) {
      return 'bg-red-600'; // Darker red for low remaining
    } else {
      return 'bg-red-600'; // Same red for consistency
    }
  };

  if (loading) {
    return (
      <div className={`h-10 px-4 rounded-md bg-gray-800 text-gray-200 flex items-center justify-center border border-gray-700 ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <Zap className="h-4 w-4 opacity-70" />
          <div className="h-2 w-12 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (!displayLimitInfo) return null;

  return (
    <div className="relative" ref={badgeRef}>
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        className={`h-10 px-4 rounded-md ${getBadgeColor()} hover:bg-opacity-90 text-white flex items-center gap-2 transition-colors border border-red-800 ${className}`}
      >
        <Zap className="h-4 w-4" />
        <span className="text-sm whitespace-nowrap font-medium">
          {displayLimitInfo.remaining} / {displayLimitInfo.limit || displayLimitInfo.total}
        </span>
      </button>
      
      {/* Tooltip/Dropdown */}
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg border border-gray-700 shadow-lg p-3 z-50 text-left animate-in fade-in slide-in-from-top-3"
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-200">{t('dailyLimit')}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {t('requestsRemaining')
                .replace('{remaining}', String(displayLimitInfo.remaining))
                .replace('{limit}', String(displayLimitInfo.limit || displayLimitInfo.total))}
            </p>
            {error && (
              <p className="text-xs text-red-400 mt-1">
                {error}
              </p>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              {t('resetsAt').replace('{time}', formatResetTime())}
            </p>
            
            {!isLoggedIn && (
              <button
                onClick={() => {
                  navigate('/login');
                  setShowTooltip(false);
                }}
                className="mt-2 text-xs text-red-400 font-medium hover:text-red-300"
              >
                {t('upgradeForMore')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};