// components/military-intelligence/FusionPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdaptedAnalysisResponse } from '../../type/intelligence';
import { SigintAnalysisResponse, FusionAnalysisResponse, LayerControl } from '../../type/sigintTypes';
import { useMilitaryLanguage } from './utils/militaryTranslations';
import { adaptApiResponseToComponentModel } from './utils/adaptApiResponse';

import { 
    adaptSigintResponseToComponentModel,
    adaptFusionResponseToComponentModel
  } from './utils/adaptApiResponse';

  import { 
    ComponentSigintAnalysisResponse,
    ComponentEmitterLocation,
    ComponentRadarEmitter 
  } from './analysis/intelligenceSidebar';

// Components
import Header from './layout/header';
import FusionLayout from './layout/fusionLayout';
import FusionMap from './analysis/fusionMap';
import IntelligenceSidebar from './analysis/intelligenceSidebar';
import PDFExportModal from './ui/pdfExportModal';
import AnalysisProgressIndicator from './analysis/analysisProgress';
import DragDropUpload from './ui/dragDropUpload';
import { RateLimitBadge } from './ui/rateLimitBadge';
import { RateLimitModal } from './ui/rateLimitModal';
import Portal from './ui/portal';
import { toast } from './utils/toastService';

// Import our consolidated intelligence service
import {
    analyzeFieldReport,
    analyzeSignalData,
    performIntelligenceFusion,
    getIntelligenceLimits
  } from '../../api/intelligenceService';

// Import context and analytics
import { useAuth, authEvents } from '../../context/AuthContext';

interface FusionPageProps {
  // These are now optional since we'll be handling upload within the component
  initialReportText?: string;
  initialSignalData?: ArrayBuffer | null;
  isLoggedIn?: boolean;
  logout?: () => void;
}

const FusionPage: React.FC<FusionPageProps> = ({ 
  initialReportText,
  initialSignalData,
  isLoggedIn: externalIsLoggedIn,
  logout: externalLogout
}) => {
  // Use Auth context if props not provided
  const authContext = useAuth();
  const isLoggedIn = externalIsLoggedIn !== undefined ? externalIsLoggedIn : authContext.isLoggedIn;
  const logout = externalLogout || authContext.logout;
  
  const { t, language, setLanguage } = useMilitaryLanguage();
  const navigate = useNavigate();
  
  // Add state to track which step we're on
  const [currentStep, setCurrentStep] = useState<'upload' | 'results'>(
    // If we have initial data, go directly to results
    initialReportText ? 'results' : 'upload'
  );
  
  // State for managing uploaded files and content
  const [reportText, setReportText] = useState<string>(initialReportText || '');
  const [signalData, setSignalData] = useState<ArrayBuffer | null>(initialSignalData || null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // State for analysis results
  const [humintData, setHumintData] = useState<AdaptedAnalysisResponse | null>(null);
  const [sigintData, setSigintData] = useState<SigintAnalysisResponse | null>(null);
  const [fusionData, setFusionData] = useState<FusionAnalysisResponse | null>(null);
  
  // Analysis processing state
  const [analysisStep, setAnalysisStep] = useState<'IDLE' | 'PROCESSING' | 'ANALYZING' | 'VALIDATING' | 'COMPLETE'>('IDLE');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  
  // Rate limit state
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    limit: number;
    remaining: number;
    resetsAt?: string;  // Changed from reset to resetsAt
    total: number;
    isAuthenticated?: boolean;
    planType?: string;
    upgradeAvailable?: boolean;
    used?: number;
  } | null>(null);
  const [shouldRefreshLimits, setShouldRefreshLimits] = useState<boolean>(false);
  const [isRateLimitExceeded, setIsRateLimitExceeded] = useState<boolean>(false);
  
  // Header state
  const [isHeaderSticky, setIsHeaderSticky] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  
  // Map and visualization state
  const [visibleLayers, setVisibleLayers] = useState<string[]>(['humint', 'sigint', 'correlation']);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());
  const [selectedEntity, setSelectedEntity] = useState<{ id: string, type: 'humint' | 'sigint' | 'fusion' } | null>(null);
  
  // Layer controls configuration
  const layerControls: LayerControl[] = [
    { id: 'humint', label: 'HUMINT', type: 'humint', isVisible: visibleLayers.includes('humint') },
    { id: 'sigint', label: 'SIGINT', type: 'sigint', isVisible: visibleLayers.includes('sigint') },
    { id: 'fusion', label: 'Fusion Entities', type: 'fusion', isVisible: visibleLayers.includes('fusion') },
    { id: 'correlation', label: 'Correlation Lines', type: 'fusion', isVisible: visibleLayers.includes('correlation') },
    { id: 'prediction', label: 'Predictions', type: 'prediction', isVisible: visibleLayers.includes('prediction') }
  ];

  // Handle header stickiness
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setIsHeaderSticky(window.scrollY > 0);
      }
    };
    
    window.addEventListener('scroll', updateHeaderHeight);
    window.addEventListener('resize', updateHeaderHeight);
    
    // Initial check
    updateHeaderHeight();
    
    return () => {
      window.removeEventListener('scroll', updateHeaderHeight);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Load rate limits on component mount and auth changes
  useEffect(() => {
    const refreshLimits = async () => {
      try {
        // Always get fresh rate limits regardless of login status
        const limits = await getIntelligenceLimits();
        
        // Create a new object that includes any missing properties expected by your interface
        const enhancedLimits = {
          ...limits,
          // Add the total property that your interface expects
          total: limits.limit || 0
        };
        
        setRateLimitInfo(enhancedLimits);
        
        // If the rate limit exceeded modal is open but user now has quota, close it
        if (isRateLimitExceeded && enhancedLimits.remaining > 0) {
          setIsRateLimitExceeded(false);
        }
        
      } catch (error) {
        console.error('Failed to refresh rate limits on auth change:', error);
      }
    };
    
    // Initial refresh when component mounts or isLoggedIn changes
    refreshLimits();
    
    // Subscribe to auth events for additional refreshes (like logout)
    const unsubscribe = authEvents.subscribe(refreshLimits);
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [isLoggedIn, isRateLimitExceeded]);

  // Toggle layer visibility
  const handleLayerToggle = useCallback((layerId: string) => {
    setVisibleLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  }, []);
  
  // Handle entity selection
  const handleEntityClick = useCallback((entityId: string, type: 'humint' | 'sigint' | 'fusion') => {
    setSelectedEntity({ id: entityId, type });
    // Additional logic to highlight entity on map or in sidebar could be added here
  }, []);
  
  // Handle export functionality
  const handleExport = useCallback((format: 'pdf' | 'text' | 'email' | 'nato') => {
    if (format === 'pdf') {
      setIsExportModalOpen(true);
    } else {
      // Implement other export formats
      toast.success(`${format.toUpperCase()} export initiated`);
    }
  }, []);
  
  // Start over functionality
  const handleStartOver = useCallback(() => {
    // Reset all state and go back to upload step
    setCurrentStep('upload');
    setReportText('');
    setSignalData(null);
    setUploadedFiles([]);
    setHumintData(null);
    setSigintData(null);
    setFusionData(null);
    setAnalysisStep('IDLE');
    setSelectedEntity(null);
  }, []);
  
  // Add file processing handlers
  const handleFilesProcessed = (files: File[]) => {
    setUploadedFiles(files);
  };
  
  const handleFileContentLoaded = (fileId: string, content: string) => {
    // For our existing DragDropUpload component, we only get string content
    // Set it as report text (we'll need to modify this to handle binary data separately)
    setReportText(prev => {
      if (prev) {
        return `${prev}\n\n--- NEW REPORT ---\n\n${content}`;
      }
      return content;
    });
  };
  
  // Function to handle analysis submission
// Function to handle analysis submission
const handleSubmitAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportText.trim()) {
      toast.error(t('emptyReportError') || 'Please enter a field report to analyze');
      return;
    }
    
    // Check rate limits before proceeding
    try {
      const currentLimits = await getIntelligenceLimits();
      
      // Create a new object that includes any missing properties expected by your interface
      const enhancedLimits = {
        ...currentLimits,
        // Add the total property that your interface expects
        total: currentLimits.limit || 0
      };
      
      // If user has no remaining analyses, show rate limit modal and prevent analysis
      if (enhancedLimits.remaining <= 0) {
        setRateLimitInfo(enhancedLimits);
        setIsRateLimitExceeded(true);
        return;
      }
      
      // Update the local rate limit info
      setRateLimitInfo(enhancedLimits);
    } catch (error) {
      console.error('Failed to check rate limits:', error);
      // Continue with analysis even if we can't check limits
      // The API will enforce limits server-side
    }
    
    // Start analysis process
    setIsAnalyzing(true);
    setAnalysisStep('PROCESSING');
    setCurrentStep('results');

    // Perform analysis
    try {
      // Process HUMINT data
      setAnalysisStep('PROCESSING');
      const humintResponse = await analyzeFieldReport({
        reportText: reportText,
        reportMetadata: {
          reportId: `REPORT-${Date.now()}`,
          timestamp: new Date().toISOString()
        },
        extractionOptions: {
          comprehensive: true,
          extractionTypes: [
            'tacticalObservations',
            'threats',
            'resources', 
            'civilianStatus',
            'geospatialInformation',
            'predictions'
          ]
        }
      });
      
      const adaptedHumint = adaptApiResponseToComponentModel(humintResponse as any);
      setHumintData(adaptedHumint);
      
      // Process SIGINT data if available
      setAnalysisStep('ANALYZING');
      if (signalData) {
        try {
          const sigintResponse = await analyzeSignalData(signalData);
          // Use the adapter function for SIGINT data
          const adaptedSigint = adaptSigintResponseToComponentModel(sigintResponse);
          setSigintData(adaptedSigint);
          
          // Perform fusion analysis
          setAnalysisStep('VALIDATING');
          try {
            const fusionResponse = await performIntelligenceFusion({
              humintAnalysisId: adaptedHumint.analysisId || '',
              sigintAnalysisId: adaptedSigint.analysisId,
              options: {
                correlationThreshold: 0.3,
                enhanceWithLLM: true
              }
            });
            
            // Use the adapter function for fusion data
            const adaptedFusion = adaptFusionResponseToComponentModel(fusionResponse);
            setFusionData(adaptedFusion);
          } catch (fusionError) {
            console.error('Fusion processing error:', fusionError);
            toast.error('Fusion analysis failed, but HUMINT and SIGINT data are available.');
            // Continue with HUMINT and SIGINT data only
          }
        } catch (sigintError) {
          console.error('SIGINT processing error:', sigintError);
          toast.error('SIGINT data processing failed. Using HUMINT data only.');
          // Continue with HUMINT-only analysis
        }
      }
      
      setAnalysisStep('COMPLETE');
      setShouldRefreshLimits(true);
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      let errorMessage = 'Failed to analyze intelligence. Please try again.';
      
      // Check if error is rate limit
      if (
        ('status' in error && error.status === 429) || 
        ('message' in error && typeof error.message === 'string' && error.message.includes('Rate limit exceeded'))
      ) {
        try {
          // Get current rate limit info
          const baseLimits = await getIntelligenceLimits();
          // Add the total property as before
          const limits = {
            ...baseLimits,
            total: baseLimits.limit || 0
          };
          setRateLimitInfo(limits);
          setIsRateLimitExceeded(true);
          setShouldRefreshLimits(true);
          
        } catch (limitsError) {
          // If we can't get limits, show generic message
          toast.error('Daily rate limit exceeded');
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      // If we fail but are already on the results step, go back to upload
      if (currentStep === 'results') {
        setCurrentStep('upload');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // For state that might not exist in the original FusionPage
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const adaptSigintData = (data: SigintAnalysisResponse | null): ComponentSigintAnalysisResponse | null => {
    if (!data) return null;
    
    return {
      ...data,
      emitters: data.emitters
        .filter(emitter => {
          // Filter out emitters without valid locations
          const hasValidLocation = emitter.locations && 
                                  emitter.locations.length > 0 && 
                                  emitter.locations.some(loc => 
                                    loc.coordinates && 
                                    loc.coordinates.latitude !== undefined && 
                                    loc.coordinates.longitude !== undefined);
          return hasValidLocation;
        })
        .map(emitter => {
          // Get the most recent valid location
          const validLocations = emitter.locations?.filter(loc => 
            loc.coordinates && 
            loc.coordinates.latitude !== undefined && 
            loc.coordinates.longitude !== undefined
          ) || [];
          
          const latestLocation = validLocations.length > 0 ? 
            [...validLocations].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0] : null;
          
          return {
            ...emitter,
            // Transform locations to add the required 'location' property
            locations: emitter.locations?.map(loc => ({
              ...loc,
              // Add the missing 'location' property required by ComponentEmitterLocation
              location: loc.coordinates ? {
                latitude: loc.coordinates.latitude || 0,
                longitude: loc.coordinates.longitude || 0
              } : { latitude: 0, longitude: 0 }
            })) || []
          };
        })
    };
  };
  
  // Return the appropriate UI based on current step
  return (
    <div className="absolute inset-0 w-full min-h-screen bg-white overflow-auto">
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40">
        <Header
          reportId={humintData?.reportId}
          onStartOver={handleStartOver}
          onExport={handleExport}
          rateLimitInfo={rateLimitInfo}
          isHeaderSticky={isHeaderSticky}
          t={t}
          shouldRefreshLimits={shouldRefreshLimits}
          setShouldRefreshLimits={setShouldRefreshLimits}
          isLoggedIn={isLoggedIn}
          logout={logout}
          currentLanguage={language}
          setCurrentLanguage={(lang) => setLanguage(lang as 'en' | 'cs')}
        />
      </header>

      {/* Show loading indicator when analyzing */}
      {isAnalyzing && <AnalysisProgressIndicator analysisStep={analysisStep} t={t} />}
      
      {currentStep === 'upload' ? (
        // Upload interface
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 pt-16 pb-8">
            <div className="w-full max-w-5xl">
            <form onSubmit={handleSubmitAnalysis} className="space-y-8">
                {/* Drag Drop File Upload with the updated component */}
                <DragDropUpload
                onFilesProcessed={handleFilesProcessed}
                onFileContentLoaded={handleFileContentLoaded}
                t={t}
                isAnalyzing={isAnalyzing}
                onFileRemoved={() => {
                    setReportText('');
                    setSignalData(null);
                }}
                acceptedFileTypes=".txt,.pdf,.doc,.docx,.sig,.sigint,.bin,.json"
                setReportText={setReportText}
                setSignalData={setSignalData}
                />
                
                {/* Analysis Button */}
                <div className="flex justify-center mt-8">
                <button
                    type="submit"
                    disabled={isAnalyzing || (!reportText.trim() && !signalData)}
                    className={`
                    px-12 py-3.5 text-base rounded-lg font-medium transition-all duration-300
                    ${isAnalyzing ? 
                        'bg-gray-700 text-gray-400 cursor-not-allowed' : 
                        (!reportText.trim() && !signalData) ? 
                        'bg-gray-700 text-gray-400 cursor-not-allowed' : 
                        'bg-black hover:bg-gray-800 text-white shadow-md hover:shadow-lg'
                    }
                    `}
                >
                    {isAnalyzing ? (
                    <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('analyzingFusion') || 'Generating Fusion Intelligence...'}
                    </div>
                    ) : (
                    t('analyzeFusion') || 'Analyze'
                    )}
                </button>
                </div>
            </form>
            </div>
        </div>
        ) : (
        // Results UI (existing FusionPage layout)
        analysisStep !== 'COMPLETE' && analysisStep !== 'IDLE' ? (
          <AnalysisProgressIndicator analysisStep={analysisStep} t={t} />
        ) : (
          <>
            <FusionLayout
              reportId={humintData?.reportId}
              humintData={humintData}
              sigintData={sigintData}
              fusionData={fusionData}
              layerControls={layerControls}
              onLayerToggle={handleLayerToggle}
              onStartOver={handleStartOver}
              onExport={handleExport}
              isLoggedIn={isLoggedIn}
              logout={logout}
              currentLanguage={language}
              setCurrentLanguage={(lang: string) => setLanguage(lang as 'en' | 'cs')}
              t={t}
              sidebarContent={
                <IntelligenceSidebar
                  humintData={humintData}
                  sigintData={adaptSigintData(sigintData)}
                  fusionData={fusionData}
                  onToggleLayer={handleLayerToggle}
                  onEntityClick={handleEntityClick}
                  visibleLayers={visibleLayers}
                  t={t}
                />
              }
            >
              <FusionMap
                humintData={humintData}
                sigintData={sigintData}
                fusionData={fusionData}
                rawReportText={reportText}
                visibleLayers={visibleLayers}
                currentTime={currentTime}
                onMarkerClick={handleEntityClick}
                onLayerToggle={handleLayerToggle}
                t={t}
              />
            </FusionLayout>
          </>
        )
      )}
      
      {/* Modals */}
      {isRateLimitExceeded && rateLimitInfo && (
        <Portal>
          <RateLimitModal
            isOpen={isRateLimitExceeded}
            onClose={() => setIsRateLimitExceeded(false)}
            limitInfo={rateLimitInfo}
            language={language}
          />
        </Portal>
      )}

      {/* PDF Export Modal */}
      {isExportModalOpen && humintData && (
        <Portal>
          <PDFExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            analysisResults={humintData}
            />
        </Portal>
      )}
    </div>
  );
};

export default FusionPage;