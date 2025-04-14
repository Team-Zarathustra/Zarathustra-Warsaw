import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import './toast.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const closeToast = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    const hideTimer = setTimeout(closeToast, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, closeToast]);

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div 
      className={`toast ${type} ${isVisible ? 'toast-visible' : ''}`}
    >
      <div className="flex items-center flex-grow">
        <IconComponent className="w-6 h-6 mr-4 flex-shrink-0" />
        <p className="toast-message">{message}</p>
      </div>
      <button
        onClick={closeToast}
        className="toast-close-button"
      >
        <X size={24} />
      </button>
    </div>
  );
};
