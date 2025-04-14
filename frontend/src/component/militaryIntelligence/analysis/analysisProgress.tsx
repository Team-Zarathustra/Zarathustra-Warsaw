// components/military-intelligence/analysis/AnalysisProgress.tsx
import React, { useState, useEffect } from 'react';
import { AnalysisStep } from '../../../type/intelligence';

interface AnalysisProgressIndicatorProps {
  analysisStep: AnalysisStep;
  t: (key: string) => string;
}

const AnalysisProgressIndicator: React.FC<AnalysisProgressIndicatorProps> = ({ 
  analysisStep,
  t
}) => {
  // Convert string AnalysisStep to number for progress calculation
  const stepToNumber = (step: AnalysisStep): number => {
    switch (step) {
      case 'IDLE': return 0;
      case 'PROCESSING': return 1;
      case 'ANALYZING': return 2;
      case 'VALIDATING': return 3;
      case 'COMPLETE': return 4;
      default: return 0;
    }
  };
  
  // Calculate a dynamic percentage based on the current step
  const stepNumber = stepToNumber(analysisStep);
  const progressPercentage = ((stepNumber / 4) * 100).toFixed(0);
  
  const steps = [
    { label: t('processing') || 'Processing', description: t('processingDescription') || 'Processing report text' },
    { label: t('analyzing') || 'Analyzing', description: t('analyzingDescription') || 'Identifying key intelligence' },
    { label: t('validating') || 'Validating', description: t('validatingDescription') || 'Validating findings' },
    { label: t('completing') || 'Completing', description: t('completingDescription') || 'Finalizing analysis' }
  ];

  // State for animations
  const [randomMessageIndex, setRandomMessageIndex] = useState<number>(0);
  
  // Modern loading animation with black stroke
  const loadingAnimation = (
    <svg className="w-10 h-10 text-black" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2">
          <circle strokeOpacity=".2" cx="18" cy="18" r="18"/>
          <path d="M36 18c0-9.94-8.06-18-18-18">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 18 18"
              to="360 18 18"
              dur="1s"
              repeatCount="indefinite"/>
          </path>
        </g>
      </g>
    </svg>
  );
  
  // Loading messages for military field report analysis
  const getLoadingMessages = (step: AnalysisStep): string[] => {
    switch (step) {
      case 'PROCESSING':
        return ["Processing report text...", "Extracting content...", "Preprocessing field report..."];
      case 'ANALYZING':
        return ["Identifying enemy positions...", "Assessing tactical situation...", "Detecting threats..."];
      case 'VALIDATING':
        return ["Validating intelligence...", "Cross-referencing data...", "Assessing reliability..."];
      case 'COMPLETE':
      case 'IDLE':
      default:
        return ["Finalizing analysis...", "Preparing intelligence report...", "Almost done..."];
    }
  };
  
      useEffect(() => {
        const stepMessages = getLoadingMessages(analysisStep);
        if (stepMessages.length === 0) return;
        
        const messageInterval = setInterval(() => {
          setRandomMessageIndex((prevIndex) => (prevIndex + 1) % stepMessages.length);
        }, 5000);
        
        return () => clearInterval(messageInterval);
      }, [analysisStep]);
      
      // Get a message for the current step
      const currentMessages = getLoadingMessages(analysisStep);
      const currentMessage = currentMessages.length > 0 ? currentMessages[randomMessageIndex] : "";
      
      return (
        <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="max-w-md w-full px-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-8">
                {loadingAnimation}
              </div>
              
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {t('analysisInProgress') || 'Analysis in progress'}
              </h3>
              
              <div className="h-6 flex items-center justify-center mb-10">
                <p className="text-sm text-black font-medium animate-pulse">
                  {currentMessage}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="w-full mb-10">
                <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-black h-1 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(stepNumber / (steps.length)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>Starting</span>
                  <span>{progressPercentage}% Complete</span>
                </div>
              </div>
              
              {/* Current step */}
              <div className="text-sm text-gray-700">
                {steps[stepNumber - 1]?.label || ""}
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    export default AnalysisProgressIndicator;