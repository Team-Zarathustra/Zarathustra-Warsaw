// utils/formatters.ts
import { QualityScore } from '../../../type/intelligence';

export const formatResetTime = (resetTimeString?: string): string => {
  if (!resetTimeString) return '';
  
  const resetDate = new Date(resetTimeString);
  const now = new Date();
  
  // If it's today, just show time
  if (resetDate.getDate() === now.getDate() && 
      resetDate.getMonth() === now.getMonth() &&
      resetDate.getFullYear() === now.getFullYear()) {
    return resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If it's tomorrow
  return 'Tomorrow at ' + resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDomain = (inputUrl: string): string => {
  try {
    return new URL(inputUrl).hostname;
  } catch {
    return inputUrl;
  }
};

export const getConfidenceLabel = (level: QualityScore | undefined): string => {
  if (!level) return 'Unknown Reliability';
  
  switch (level) {
    case 'high': return 'High Reliability';
    case 'medium': return 'Medium Reliability';
    case 'low': return 'Low Reliability';
    case 'fallback': return 'Unverified Data';
    default: return 'Unknown Reliability';
  }
};

export const getConfidenceColor = (level: QualityScore | undefined): string => {
  if (!level) return 'bg-gray-400';
  
  switch (level) {
    case 'high': return 'bg-green-500';
    case 'medium': return 'bg-blue-500';
    case 'low': return 'bg-amber-500';
    case 'fallback': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

export const getConfidenceBgColor = (level: QualityScore | undefined): string => {
  if (!level) return 'bg-gray-800';
  
  switch (level) {
    case 'high': return 'bg-green-900';
    case 'medium': return 'bg-blue-900';
    case 'low': return 'bg-amber-900';
    case 'fallback': return 'bg-gray-800';
    default: return 'bg-gray-800';
  }
};

export const getConfidenceTextColor = (level: QualityScore | undefined): string => {
  if (!level) return 'text-gray-300';
  
  switch (level) {
    case 'high': return 'text-green-300';
    case 'medium': return 'text-blue-300';
    case 'low': return 'text-amber-300';
    case 'fallback': return 'text-gray-300';
    default: return 'text-gray-300';
  }
};