// components/military-intelligence/layout/FusionLayout.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Layers, Clock } from 'lucide-react';
import { AdaptedAnalysisResponse } from '../../../type/intelligence';
import { SigintAnalysisResponse, FusionAnalysisResponse, LayerControl } from '../../../type/sigintTypes';
import Header from './header';

interface FusionLayoutProps {
  children: React.ReactNode;
  reportId?: string;
  humintData?: AdaptedAnalysisResponse | null;
  sigintData?: SigintAnalysisResponse | null;
  fusionData?: FusionAnalysisResponse | null;
  sidebarContent: React.ReactNode;
  layerControls: LayerControl[];
  onLayerToggle: (layerId: string) => void;
  onStartOver?: () => void;
  onExport?: (format: 'pdf' | 'text' | 'email' | 'nato') => void;
  isLoggedIn: boolean;
  logout: () => void;
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const FusionLayout: React.FC<FusionLayoutProps> = ({
  children,
  reportId,
  humintData,
  sigintData,
  fusionData,
  sidebarContent,
  layerControls,
  onLayerToggle,
  onStartOver,
  onExport,
  isLoggedIn,
  logout,
  currentLanguage,
  setCurrentLanguage,
  t
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState<boolean>(false);
  const [isTimeControlOpen, setIsTimeControlOpen] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const layerControlRef = useRef<HTMLDivElement>(null);
  const timeControlRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside of controls to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isLayerControlOpen &&
        layerControlRef.current &&
        !layerControlRef.current.contains(event.target as Node)
      ) {
        setIsLayerControlOpen(false);
      }
      
      if (
        isTimeControlOpen &&
        timeControlRef.current &&
        !timeControlRef.current.contains(event.target as Node)
      ) {
        setIsTimeControlOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayerControlOpen, isTimeControlOpen]);

  // Calculate sidebar width (for transitions)
  const sidebarWidth = '400px';
  
  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Header */}
      <Header
        reportId={reportId}
        onStartOver={onStartOver}
        onExport={onExport}
        isHeaderSticky={true}
        t={t}
        isLoggedIn={isLoggedIn}
        logout={logout}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
      />
      
      {/* Main Content Area with Map and Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Intelligence Sidebar */}
            <div
            ref={sidebarRef}
            className="h-full bg-white border-r border-gray-100 overflow-y-auto transition-all duration-300 ease-in-out"
            style={{ 
                width: isSidebarOpen ? sidebarWidth : '0',
                minWidth: isSidebarOpen ? sidebarWidth : '0',
                opacity: isSidebarOpen ? 1 : 0,
            }}
            >
          {isSidebarOpen && (
            <div className="p-4">
              {sidebarContent}
            </div>
          )}
        </div>
        
        {/* Sidebar Toggle */}
        <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white hover:bg-gray-100 text-gray-600 p-2 rounded-r-md border border-gray-200 border-l-0 shadow-sm"
        aria-label={isSidebarOpen ? t('hideSidebar') : t('showSidebar')}
        >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {/* Main Map Area */}
        <div className="flex-1 relative">
          {/* Map content passed as children */}
          {children}
          
          {/* Layer Controls Toggle */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setIsLayerControlOpen(!isLayerControlOpen)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-md border border-gray-700 shadow-lg"
              aria-label={t('toggleLayers')}
            >
              <Layers size={20} />
            </button>
            
            <button
              onClick={() => setIsTimeControlOpen(!isTimeControlOpen)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-md border border-gray-700 shadow-lg"
              aria-label={t('toggleTimeline')}
            >
              <Clock size={20} />
            </button>
          </div>
          
          {/* Layer Controls Panel */}
          {isLayerControlOpen && (
            <div
              ref={layerControlRef}
              className="absolute top-16 right-4 z-20 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-4 w-64"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-200">{t('layers')}</h3>
                <button 
                  onClick={() => setIsLayerControlOpen(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {layerControls.map(layer => (
                  <div key={layer.id} className="flex items-center justify-between">
                    <label 
                      htmlFor={`layer-${layer.id}`} 
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        id={`layer-${layer.id}`}
                        type="checkbox"
                        checked={layer.isVisible}
                        onChange={() => onLayerToggle(layer.id)}
                        className="mr-2 h-4 w-4 rounded border-gray-600 text-red-600 focus:ring-red-500"
                      />
                      <span className={`text-sm ${layer.isVisible ? 'text-white' : 'text-gray-400'}`}>
                        {layer.label}
                      </span>
                    </label>
                    <div className={`w-3 h-3 rounded-full ${getLayerColorClass(layer.type)}`}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Time Controls Panel (simplified, can be expanded) */}
          {isTimeControlOpen && (
            <div
              ref={timeControlRef}
              className="absolute top-16 right-4 z-20 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-4 w-64"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-200">{t('timeline')}</h3>
                <button 
                  onClick={() => setIsTimeControlOpen(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Start</span>
                    <span>End</span>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="19 20 9 12 19 4 19 20"></polygon>
                      <line x1="5" y1="19" x2="5" y2="5"></line>
                    </svg>
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get color classes based on layer type
const getLayerColorClass = (layerType: string): string => {
  switch (layerType) {
    case 'humint':
      return 'bg-blue-500';
    case 'sigint':
      return 'bg-red-500';
    case 'fusion':
      return 'bg-purple-500';
    case 'prediction':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
};

export default FusionLayout;