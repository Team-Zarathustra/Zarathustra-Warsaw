import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const alertVariants = {
  default: {
    container: "bg-gray-100 border-gray-200",
    icon: <Info className="h-4 w-4 text-gray-900" />
  },
  destructive: {
    container: "bg-red-50 border-red-200",
    icon: <AlertCircle className="h-4 w-4 text-red-900" />
  },
  success: {
    container: "bg-green-50 border-green-200",
    icon: <CheckCircle className="h-4 w-4 text-green-900" />
  }
};

interface AlertProps {
  variant?: keyof typeof alertVariants;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  hideDefaultIcon?: boolean; 
}

export function Alert({ 
  variant = "default",
  title,
  children,
  className,
  onClose,
  hideDefaultIcon = false
}: AlertProps) {
  const variantStyles = alertVariants[variant];
  
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4 shadow-sm",
        variantStyles.container,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-4">
        {!hideDefaultIcon && (
          <div className="mt-0.5">
            {variantStyles.icon}
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm">{children}</div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-lg p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;