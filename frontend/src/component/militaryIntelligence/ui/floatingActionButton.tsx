// components/military-intelligence/ui/FloatingActionButton.tsx
import React from 'react';
import { FileText } from 'lucide-react';

interface FloatingActionButtonProps {
  onNewSearch: () => void;
  t: (key: string) => string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onNewSearch, t }) => {
  return (
    <div className="md:hidden fixed bottom-4 right-4 z-50">
      <button
        onClick={onNewSearch}
        className="h-14 w-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 shadow-lg transition-all duration-200"
        aria-label={t('newAnalysis')}
      >
        <FileText className="h-6 w-6 text-white" />
      </button>
    </div>
  );
};

export default FloatingActionButton;