// components/military-intelligence/ui/ConfidenceBadge.tsx
import React from 'react';
import { QualityScore } from '../../../type/intelligence';
import { getConfidenceLabel, getConfidenceColor, getConfidenceBgColor, getConfidenceTextColor } from '.././utils/formatters';

interface ConfidenceBadgeProps {
  level: QualityScore | undefined;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ 
  level, 
  size = 'md',
  showDot = true,
  className = ''
}) => {
  const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';
  const paddingClass = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';
  
  return (
    <div className={`
      inline-flex items-center gap-1.5 
      ${paddingClass} rounded-md ${textSizeClass}
      ${getConfidenceBgColor(level)} ${getConfidenceTextColor(level)}
      border border-gray-700
      ${className}
    `}>
      {showDot && (
        <span className={`h-2 w-2 rounded-full ${getConfidenceColor(level)}`}></span>
      )}
      <span>{getConfidenceLabel(level)}</span>
    </div>
  );
};

export default ConfidenceBadge;