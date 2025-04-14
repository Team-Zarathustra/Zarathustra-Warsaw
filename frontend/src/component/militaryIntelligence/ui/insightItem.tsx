// components/military-intelligence/ui/InsightItem.tsx
import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { QualityScore } from '../../../type/intelligence';
import ConfidenceBadge from './confidenceBadge';

interface InsightItemProps {
  content: string;
  id: string;
  index: number;
  confidence?: QualityScore;
  context?: string | null;
  sourceLabel?: string | null;
  onCopy?: (id: string, index: number) => void;
  isContextAware?: boolean;
  className?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

const InsightItem: React.FC<InsightItemProps> = ({
  content,
  id,
  index,
  confidence = 'medium',
  context = null,
  sourceLabel = null,
  onCopy,
  isContextAware = false,
  className = '',
  severity
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    navigator.clipboard.writeText(content)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        if (onCopy) onCopy(id, index);
      })
      .catch(err => console.error('Failed to copy:', err));
  }, [content, id, index, onCopy]);
  
  // Get border color based on severity
  const getBorderColor = (): string => {
    if (!severity) return 'border-gray-700';
    
    switch (severity) {
      case 'critical': return 'border-red-800';
      case 'high': return 'border-orange-800';
      case 'medium': return 'border-yellow-800';
      case 'low': return 'border-blue-800';
      case 'info': return 'border-gray-700';
      default: return 'border-gray-700';
    }
  };

  const getBgColor = (): string => {
    if (!severity) return 'bg-gray-800';
    
    switch (severity) {
      case 'critical': return 'bg-gray-900 bg-opacity-95';
      case 'high': return 'bg-red-900 bg-opacity-20';
      case 'medium': return 'bg-amber-900 bg-opacity-20';
      case 'low': return 'bg-blue-900 bg-opacity-20';
      case 'info': return 'bg-gray-800';
      default: return 'bg-gray-800';
    }
  };
  
  return (
    <div className={`
      group relative rounded-lg p-4 
      border ${getBorderColor()}
      ${getBgColor()} 
      hover:bg-opacity-40 transition-all duration-200
      ${className}
    `}>
      <div className="flex justify-between">
        <div className="flex items-start gap-3">
          {/* Add a numbered indicator with context-aware styling */}
          {isContextAware ? (
            <div className="p-1.5 rounded-full bg-red-900 flex-shrink-0">
              <div className="flex items-center justify-center h-4 w-4 text-red-300">
                {index + 1}
              </div>
            </div>
          ) : (
            <div className="p-1.5 rounded-full bg-gray-800 border border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-center h-4 w-4 text-gray-400">
                {index + 1}
              </div>
            </div>
          )}
          
          <div className="flex-1 pr-10">
            {/* Source label */}
            {sourceLabel && (
              <div className="mb-2">
                <span className="inline-block px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700">
                  {sourceLabel}
                </span>
              </div>
            )}
            
            {/* Main content */}
            <p className={`${isContextAware ? 'text-gray-100' : 'text-gray-300'}`}>{content}</p>
            
            {/* Confidence and context-aware indicators */}
            <div className="mt-2 flex gap-2 flex-wrap">
              <ConfidenceBadge level={confidence} size="sm" />
              
              {/* Context-aware badge */}
              {isContextAware && (
                <div className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-900 text-red-300 font-medium border border-red-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3 mr-1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Operation-Specific</span>
                </div>
              )}
              
              {/* Severity indicator for critical items */}
              {severity === 'critical' && (
                <div className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-900 text-red-300 font-medium border border-red-800">
                  <span>CRITICAL</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
        >
          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default InsightItem;