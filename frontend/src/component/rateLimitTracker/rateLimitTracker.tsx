import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getRateLimits } from '@/api/research';

interface RateLimitTrackerProps {
  className?: string;
  size?: 'small' | 'medium';
  onRefresh?: () => void;
}

interface LimitInfo {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

export const RateLimitTracker: React.FC<RateLimitTrackerProps> = ({ 
  className = '',
  size = 'medium',
  onRefresh
}) => {
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      const limits = await getRateLimits();
      setLimitInfo(limits);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to fetch rate limits:', err);
      setError('Could not load your request limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  // Format reset time
  const formatResetTime = (resetTime: string) => {
    if (!resetTime) return '';
    
    const resetDate = new Date(resetTime);
    return resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className} ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-2 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Hide instead of showing error
  }

  if (!limitInfo) return null;

  return (
    <div className={`${className} ${size === 'small' ? 'text-xs' : 'text-sm'} rounded-md`}>
      <div className="flex items-center gap-1.5">
        <Clock className={size === 'small' ? 'h-3 w-3 text-gray-400' : 'h-4 w-4 text-gray-400'} />
        
        <span className="text-gray-500">
          {limitInfo.remaining} of {limitInfo.limit} requests left today
          {size !== 'small' && limitInfo.resetsAt && (
            <span className="ml-1 text-gray-400">
              · Resets at {formatResetTime(limitInfo.resetsAt)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};