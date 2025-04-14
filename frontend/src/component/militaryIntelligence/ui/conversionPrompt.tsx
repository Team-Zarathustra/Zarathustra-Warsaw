import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ConversionPromptProps {
  title: string;
  subtitle?: string;
  feature?: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'minimal' | 'highlight' | 'floating';
}

export const ConversionPrompt = ({ 
  title, 
  subtitle, 
  feature,
  className = '',
  showIcon = true,
  variant = 'minimal'
}: ConversionPromptProps) => {
  const variants = {
    minimal: 'bg-white/50 border border-gray-200/50 hover:border-gray-300/50',
    highlight: 'bg-[#F15B5B]/5 border border-[#F15B5B]/10 hover:border-[#F15B5B]/20',
    floating: 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
  };

  return (
    <Link 
      to="/login?source=conversion"
      className={`
        group relative rounded-lg p-4 
        backdrop-blur-sm transition-all duration-200
        block w-full  // Added these to ensure full width
        ${variants[variant]}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className="flex-shrink-0 mt-1">
            <Sparkles className="h-4 w-4 text-[#F15B5B]" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-gray-900">
              {title}
            </h3>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 
                                 transition-colors duration-200" />
          </div>
          
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">
              {subtitle}
            </p>
          )}
          
          {feature && (
            <div className="mt-2 inline-flex items-center rounded-full bg-[#F15B5B]/5 
                          px-2 py-1 text-xs font-medium text-[#F15B5B]">
              {feature}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

interface FloatingPromptProps extends ConversionPromptProps {
  show: boolean;
  onClose?: () => void;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

export const FloatingPrompt = ({
  show,
  position = 'bottom-right',
  onClose,
  ...props
}: FloatingPromptProps) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
        >
          <ConversionPrompt
            {...props}
            variant="floating"
            className="pr-8"
          />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600
                       transition-colors duration-200"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Example usage in SearchPage:
export const TemplatePrompt = () => (
  <ConversionPrompt
    title="Want to save your favorite templates?"
    subtitle="Create a free account to access your template library anytime"
    feature="Free Template Storage"
    variant="highlight"
  />
);

export const ContextPrompt = () => (
  <ConversionPrompt
    title="Save your company context for future use"
    subtitle="Write it once, use it everywhere"
    feature="Smart Context Storage"
  />
);

export const PersonalizationPrompt = () => (
  <FloatingPrompt
    show={true}
    title="Get 3 free AI personalizations"
    subtitle="Create an account to track your usage"
    feature="AI Credits"
    position="bottom-right"
  />
);