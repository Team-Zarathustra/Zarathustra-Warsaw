// components/military-intelligence/ui/Section.tsx
import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { QualityScore } from '../../../type/intelligence';
import ConfidenceBadge from './confidenceBadge';

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  qualityScore?: QualityScore;
  actionButton?: ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  isExpandedFromNavigation?: boolean;
}

const Section: React.FC<SectionProps> = ({
  id,
  title,
  description,
  children,
  qualityScore,
  actionButton,
  defaultExpanded = false,
  icon,
  isExpandedFromNavigation = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<string>('0px');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Effect to update height whenever content changes or when expanded
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      // Give the browser a moment to render before measuring
      requestAnimationFrame(() => {
        const height = `${contentRef.current?.scrollHeight || 0}px`;
        setContentHeight(height);
      });
    } else {
      setContentHeight('0px');
    }
  }, [isExpanded, children]);

  // Effect to handle expansion from navigation
  useEffect(() => {
    if (isExpandedFromNavigation && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isExpandedFromNavigation, isExpanded]);

  const toggleSection = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsExpanded((prev: boolean) => !prev);
    
    // Reset animating state after transition completes
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match transition duration
    
    return () => clearTimeout(timer);
  }, [isAnimating]);

  return (
    <div className="mb-6 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-lg font-medium text-gray-100">{title}</h2>
            {description && (
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {qualityScore && (
            <div className="hidden md:block">
              <ConfidenceBadge level={qualityScore} />
            </div>
          )}
          
          {actionButton && <div onClick={(e) => e.stopPropagation()}>{actionButton}</div>}
          
          <div className="transition-transform duration-300 text-gray-400" 
               style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </div>
      
      {/* Animated Content */}
      <div 
        style={{ 
          height: isExpanded ? contentHeight : '0',
          overflow: 'hidden',
          transition: 'height 300ms ease-in-out',
        }}
      >
        <div ref={contentRef} className="p-5 border-t border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Section;