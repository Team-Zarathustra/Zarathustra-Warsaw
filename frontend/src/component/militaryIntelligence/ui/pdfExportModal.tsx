// components/military-intelligence/ui/PDFExportModal.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AdaptedAnalysisResponse, TacticalObservation, ResourceStatus } from '../../../type/intelligence';

// Utility functions for filtering data
const filterGenericItems = (items: string[]): string[] => {
  if (!items || !Array.isArray(items)) return [];
  
  return items.filter(item => {
    if (!item) return false;
    
    // Filter out obvious placeholder content
    return (
      !item.match(/^Item \d+$/) && // Remove "Item 1", "Item 2", etc.
      !['Unknown', 'No data available', 'No information'].includes(item) &&
      item.length > 5 // Ensure minimum value
    );
  });
};

const filterGenericObservations = (observations: TacticalObservation[] | undefined): TacticalObservation[] => {
  if (!observations || !Array.isArray(observations)) return [];
  
  return observations.filter(observation => {
    if (!observation || !observation.text) return false;
    
    // Filter out generic or placeholder observations
    return (
      observation.text.length > 10 &&
      !observation.text.includes('No specific observations') &&
      !observation.text.includes('No data available')
    );
  });
};

const filterGenericResources = (resources: ResourceStatus[]): ResourceStatus[] => {
  if (!resources || !Array.isArray(resources)) return [];
  
  return resources.filter(resource => {
    if (!resource || !resource.type) return false;
    
    // Filter out generic resource names
    return (
      resource.type !== 'Unknown' &&
      resource.type !== 'Generic Resource' &&
      resource.type !== 'No data'
    );
  });
};

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResults: AdaptedAnalysisResponse;
}

const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  analysisResults
}) => {
  // Prevent scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);
  
  if (!isOpen) return null;
  
  const reportId = analysisResults.reportId || 'intel-report';
  const fileName = `${reportId.replace(/\s+/g, '-').toLowerCase()}-analysis.pdf`;
  
  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const downloadPDF = () => {
    // In a real implementation, this would generate and download a PDF
    // For now, we'll just download a text file as a placeholder
    
    const generateTextContent = () => {
      const { intelligence } = analysisResults;
      
      let content = `# INTELLIGENCE REPORT: ${reportId}\n\n`;
      
      // Summary section
      if (intelligence.summary) {
        content += `## SITUATION OVERVIEW\n${intelligence.summary}\n\n`;
      }
      
      // Urgent intelligence section
      if (intelligence.urgentIntelligence) {
        content += `## URGENT - IMMEDIATE ATTENTION\n${intelligence.urgentIntelligence}\n\n`;
      }
      
      // Enemy forces section
      const filteredEnemyForces = filterGenericItems(intelligence.enemyForces);
      if (filteredEnemyForces.length > 0) {
        content += `## ENEMY FORCES\n${filteredEnemyForces.map(f => `- ${f}`).join('\n')}\n\n`;
      }
      
      // Threats section
      if (intelligence.threats.length > 0) {
        content += `## THREAT ASSESSMENT\n${intelligence.threats.map(t => `- ${t.description}`).join('\n')}\n\n`;
      }
      
      // Locations section
      const filteredLocations = filterGenericItems(intelligence.locations);
      if (filteredLocations.length > 0) {
        content += `## GEOSPATIAL INFORMATION\n${filteredLocations.map(l => `- ${l}`).join('\n')}\n\n`;
      }
      
      // Resource status section
      const filteredResources = filterGenericItems(intelligence.resourceStatus);
      if (filteredResources.length > 0) {
        content += `## RESOURCE STATUS\n${filteredResources.map(r => `- ${r}`).join('\n')}\n\n`;
      }
      
      // Communications status section
      if (intelligence.communicationsStatus && intelligence.communicationsStatus.length > 0) {
        content += `## COMMUNICATIONS & ELECTRONIC WARFARE\n${intelligence.communicationsStatus.map(c => `- ${c}`).join('\n')}\n\n`;
      }
      
      // Reliability assessment section
      if (intelligence.reliability) {
        content += `## RELIABILITY ASSESSMENT\nConfidence Level: ${intelligence.reliability.confidence}\n${intelligence.reliability.assessment || ''}\n\n`;
      }
      
      // Add metadata
      content += `---\nGenerated on: ${new Date().toLocaleString()}\n`;
      content += `Report ID: ${analysisResults.reportId}\n`;
      
      return content;
    };
    
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.pdf', '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Close the modal after a short delay
    setTimeout(onClose, 500);
  };
  
  return (
    <>
      {/* Fixed overlay */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999]" 
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-[1000]" role="dialog" aria-modal="true">
        <div 
          className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative shadow-xl border border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
          
          <h3 className="text-xl font-medium mb-4 text-gray-100">Export Intelligence Report</h3>
          <p className="text-gray-400 mb-6">
            Download this intelligence report in a standardized format for sharing with your team.
          </p>
          
          <button
            onClick={downloadPDF}
            className="flex items-center justify-center w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium border border-gray-700"
          >
            Download Report
          </button>
        </div>
      </div>
    </>
  );
};

export default PDFExportModal;