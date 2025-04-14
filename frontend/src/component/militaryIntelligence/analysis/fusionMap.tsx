// components/military-intelligence/analysis/FusionMap.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Map, AlertTriangle, Layers, Target, Zap, Radio, Eye, XCircle, RefreshCcw, Clock, Globe } from 'lucide-react';
import { AdaptedAnalysisResponse, QualityScore } from '../../../type/intelligence';
import { IntelligencePopup } from './intelligencePopUp';

// Define OSINT source types
interface SocialMediaPlatform {
  name: string;
  postCount: number;
  accountsTracked: number;
  reliabilityScore: number;
}

interface OsintSourceType {
  type: string;
  count: number;
  reliabilityScore: number;
}

interface OsintMediaItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  source: string;
  timestamp: string;
  url?: string;
  verificationStatus: 'verified' | 'likely' | 'unverified' | 'disputed';
  confidence?: QualityScore;
  location?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
}

interface OsintPost {
  id: string;
  platform: string;
  author: string;
  postId: string;
  timestamp: string;
  content: string;
  language: string;
  translation?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  reliability: QualityScore;
  location?: {
    latitude: number;
    longitude: number;
  };
  tags?: string[];
  verified: boolean;
  relatedMedia?: string[];
}

interface OsintNarrative {
  id: string;
  name: string;
  description: string;
  sources: number;
  firstDetected: string;
  lastDetected: string;
  prevalence: 'high' | 'medium' | 'low';
  attribution?: string[];
  confidence: QualityScore;
}

interface OsintEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  sources: string[];
  confidence: QualityScore;
  relatedMedia?: string[];
  relatedPosts?: string[];
}

// Define SIGINT types
interface EmitterPlatformAssessment {
  type?: string;
  model?: string;
  mobility?: string;
}

interface EmitterCharacteristics {
  frequency?: {
    min: number;
    max: number;
    agility?: string;
  };
  modulation?: string[];
}

interface EmitterLocation {
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  accuracy: number;
  confidenceLevel?: QualityScore;
}

interface EmissionDetection {
  id?: string;
  emitterId?: string;
  timestamp: string;
  signalType?: string;
  frequency?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ComponentEmission {
  id?: string;
  timestamp: string;
  signalType?: string;
  frequency?: number;
}

interface ComponentRadarEmitter {
  id: string;
  firstDetected: string;
  lastDetected: string;
  classification?: {
    type?: string;
    model?: string;
    confidence?: QualityScore;
  };
  confidence?: QualityScore;
  emissions?: ComponentEmission[];
  locations?: EmitterLocation[];
  platformAssessment?: EmitterPlatformAssessment;
  characteristics?: EmitterCharacteristics;
}

interface ElectronicOrderOfBattleElement {
  id: string;
  confidence?: QualityScore;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AirDefenseElement extends ElectronicOrderOfBattleElement {
  systemName?: string;
  type?: string;
  quantity?: number;
}

interface GroundForceElement extends ElectronicOrderOfBattleElement {
  unitName?: string;
  echelonSize?: string;
  equipmentType?: string;
}

interface NavalElement extends ElectronicOrderOfBattleElement {
  vesselName?: string;
  class?: string;
  type?: string;
}

interface AirElement extends ElectronicOrderOfBattleElement {
  platformType?: string;
  quantity?: number;
  mission?: string;
}

interface UnknownElement extends ElectronicOrderOfBattleElement {
  signatureType?: string;
  firstDetected: string;
}

interface ElectronicOrderOfBattle {
  timestamp: string;
  airDefenseElements?: AirDefenseElement[];
  groundForceElements?: GroundForceElement[];
  navalElements?: NavalElement[];
  airElements?: AirElement[];
  unknownElements?: UnknownElement[];
}

// OSINT Analysis Response
interface ComponentOsintAnalysisResponse {
  analysisId: string;
  timestamp: string;
  summary: string;
  platforms: SocialMediaPlatform[];
  sourceTypes: OsintSourceType[];
  media: OsintMediaItem[];
  posts: OsintPost[];
  narratives: OsintNarrative[];
  events: OsintEvent[];
  coverage: {
    startTime: string;
    endTime: string;
    region?: {
      northEast: {
        latitude: number;
        longitude: number;
      };
      southWest: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

// SIGINT Analysis Response
interface ComponentSigintAnalysisResponse {
  analysisId: string;
  timestamp: string;
  emitters: ComponentRadarEmitter[];
  signals?: number;
  coverage?: {
    startTime: string;
    endTime: string;
    region: {
      northEast: {
        latitude: number;
        longitude: number;
      };
      southWest: {
        latitude: number;
        longitude: number;
      };
    };
  };
  electronicOrderOfBattle?: ElectronicOrderOfBattle;
  detections?: EmissionDetection[];
}

// Define fusion types
interface CorrelationFactors {
  spatial: number;
  temporal: number;
  semantic?: number;
}

interface CorrelationStrength {
  value: number;
  factors: CorrelationFactors;
}

interface Correlation {
  humintEntityId: string;
  sigintEmitterId: string;
  osintEntityId?: string;
  strength: CorrelationStrength;
  correlationType: string;
}

interface FusedEntity {
  id: string;
  type: string;
  humintSources: string[];
  sigintSources: string[];
  osintSources: string[];
  combinedConfidence: QualityScore;
  correlations: Correlation[];
}

interface FusionPrediction {
  id: string;
  name: string;
  description: string;
  confidence: number;
  timeframe: string;
  supportingEvidence: number;
}

interface ComponentFusionAnalysisResponse {
  fusionId: string;
  timestamp: string;
  humintAnalysisId: string;
  sigintAnalysisId: string;
  osintAnalysisId: string;
  fusedEntities: FusedEntity[];
  predictionSummary?: string;
  predictions?: FusionPrediction[];
}

// Interface for extracted data
interface ExtractedHumintData {
  locations: {
    name?: string;
    description?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }[];
  observations: {
    name?: string;
    description?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }[];
  movements: {
    name?: string;
    description?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }[];
}

interface ExtractedEmitterData {
  id: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number;
  timestamp: string;
  classification: string;
  confidence: QualityScore;
}

interface ExtractedOsintEvent {
  id: string;
  type: string;
  title: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  confidence: QualityScore;
}

interface ExtractedCorrelation {
  id: string;
  humintEntityId: string;
  sigintEmitterId: string;
  osintEntityId: string | undefined;
  strength: number;
  type: "confirmed" | "probable" | "possible";
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Main component props
interface FusionMapProps {
  humintData?: AdaptedAnalysisResponse | null;
  sigintData?: ComponentSigintAnalysisResponse | null;
  osintData?: ComponentOsintAnalysisResponse | null;
  fusionData?: ComponentFusionAnalysisResponse | null;
  rawReportText?: string;
  visibleLayers: string[];
  currentTime?: string;
  onMarkerClick?: (entityId: string, type: 'humint' | 'sigint' | 'osint' | 'fusion') => void;
  onLayerToggle?: (layerId: string) => void;
  t: (key: string) => string;
}

// Extend Window interface to include Leaflet
declare global {
  interface Window {
    L: any;
  }
}

// Define BaseMap interfaces
interface BaseMap {
  url: string;
  name: string;
  color: string;
}

interface BaseMaps {
  dark: BaseMap;
  satellite: BaseMap;
  terrain: BaseMap;
  [key: string]: BaseMap;
}

const FusionMap: React.FC<FusionMapProps> = ({
  humintData,
  sigintData,
  osintData,
  fusionData,
  rawReportText,
  visibleLayers,
  currentTime,
  onMarkerClick,
  onLayerToggle,
  t
}) => {
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeBaseMap, setActiveBaseMap] = useState<string>('dark');
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [showBasemapSelector, setShowBasemapSelector] = useState<boolean>(false);
  const [showLayerControl, setShowLayerControl] = useState<boolean>(false);
  const [showTimeControl, setShowTimeControl] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'humint' | 'sigint' | 'osint' | 'fusion' | 'threat' | 'location' | 'prediction';
    id: string;
    data: any;
  } | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const isValidCoordinate = (coord: any): boolean => {
    return coord && 
           typeof coord.lat === 'number' && !isNaN(coord.lat) &&
           typeof coord.lng === 'number' && !isNaN(coord.lng);
  };
  
  // Keep refs for layer groups to efficiently show/hide layers
  const layerGroups = useRef<{[key: string]: any}>({
    humint: null,
    sigint: null,
    osint: null,
    fusion: null,
    correlation: null,
    grid: null,
    base: null
  });

  // Extract HUMINT data
  const extractHumintData = useCallback((): ExtractedHumintData => {
    if (!humintData || !rawReportText) return { locations: [], observations: [], movements: [] };
    
    // Mock implementation of processReportForGeospatialData
    // In a real application, this would process the raw report text and extract coordinates
    const mockLocations = [
      {
        name: "Forward Operating Base Alpha",
        description: "Main military installation with command center",
        coordinates: { latitude: 49.85, longitude: 36.65 }
      },
      {
        name: "Checkpoint Bravo",
        description: "Security checkpoint on main highway",
        coordinates: { latitude: 50.01, longitude: 36.25 }
      }
    ];
    
    const mockObservations = [
      {
        name: "Enemy Patrol",
        description: "Observed enemy patrol with light vehicles",
        coordinates: { latitude: 49.92, longitude: 36.4 }
      },
      {
        name: "Artillery Position",
        description: "Suspected artillery position in forested area",
        coordinates: { latitude: 49.78, longitude: 36.55 }
      }
    ];
    
    const mockMovements = [
      {
        name: "Troop Movement",
        description: "Enemy troop movement toward the south",
        coordinates: { latitude: 49.88, longitude: 36.44 }
      }
    ];
    
    return {
      locations: mockLocations,
      observations: mockObservations,
      movements: mockMovements
    };
  }, [humintData, rawReportText]);

  // Extract SIGINT data with guaranteed non-null return values
  const extractSigintData = useCallback((): ExtractedEmitterData[] => {
    if (!sigintData || !sigintData.emitters || sigintData.emitters.length === 0) {
      return [];
    }
    
    return sigintData.emitters
      .map(emitter => {
        // Skip emitters with no locations
        if (!emitter.locations || emitter.locations.length === 0) {
          return null;
        }
        
        // Use the most recent location for each emitter
        const sortedLocations = [...emitter.locations].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const latestLocation = sortedLocations[0];
        
        // Skip if no location available
        if (!latestLocation || !latestLocation.location) {
          return null;
        }
        
        return {
          id: emitter.id,
          coordinates: {
            latitude: latestLocation.location.latitude,
            longitude: latestLocation.location.longitude
          },
          accuracy: latestLocation.accuracy,
          timestamp: latestLocation.timestamp,
          classification: emitter.classification?.type || 'Unknown',
          confidence: emitter.confidence || 'medium'
        };
      })
      // Filter out null values and type-cast the result
      .filter((emitter): emitter is ExtractedEmitterData => emitter !== null);
  }, [sigintData]);

  // Extract OSINT data with guaranteed non-null return values
  const extractOsintData = useCallback((): ExtractedOsintEvent[] => {
    if (!osintData || !osintData.events || osintData.events.length === 0) {
      return [];
    }
    
    return osintData.events
      .map(event => {
        // Skip events with no location
        if (!event.location || !event.location.latitude || !event.location.longitude) {
          return null;
        }
        
        return {
          id: event.id,
          type: event.type,
          title: event.title,
          coordinates: {
            latitude: event.location.latitude,
            longitude: event.location.longitude
          },
          timestamp: event.timestamp,
          confidence: event.confidence || 'medium'
        };
      })
      // Filter out null values and type-cast the result
      .filter((event): event is ExtractedOsintEvent => event !== null);
  }, [osintData]);

  // Extract fusion correlations with guaranteed non-null values
  const extractCorrelations = useCallback((): ExtractedCorrelation[] => {
    if (!fusionData || !fusionData.fusedEntities || fusionData.fusedEntities.length === 0) {
      return [];
    }
    
    return fusionData.fusedEntities
      .flatMap(entity => {
        // Skip entities with no correlations
        if (!entity.correlations || entity.correlations.length === 0) {
          return [];
        }
        
        return entity.correlations
          .map(correlation => {
            if (!correlation.humintEntityId || !correlation.sigintEmitterId) {
              return null;
            }
            
            return {
              id: `${correlation.humintEntityId}-${correlation.sigintEmitterId}${correlation.osintEntityId ? `-${correlation.osintEntityId}` : ''}`,
              humintEntityId: correlation.humintEntityId,
              sigintEmitterId: correlation.sigintEmitterId,
              osintEntityId: correlation.osintEntityId,
              strength: correlation.strength.value,
              type: correlation.correlationType as "confirmed" | "probable" | "possible"
            };
          })
          .filter((corr): corr is ExtractedCorrelation => corr !== null);
      });
  }, [fusionData]);

  // Convert coordinates object to Leaflet LatLng
  const toLeafletCoords = (coords: { latitude: number | undefined; longitude: number | undefined }): Coordinates => {
    // Check if coordinates are valid numbers
    if (!coords || 
        typeof coords.latitude !== 'number' || isNaN(coords.latitude) ||
        typeof coords.longitude !== 'number' || isNaN(coords.longitude)) {
      console.warn('Invalid coordinates provided:', coords);
      // Return default Ukraine coordinates as fallback
      return { lat: 49.0, lng: 36.0 };
    }
    
    // Fix for truncated coordinates (Ukraine is around 47-50°N)
    let lat = coords.latitude;
    const lng = coords.longitude;
    
    // If a lat value is less than 10 but should be in Ukraine, add 40
    if (lat < 10 && lng > 30 && lng < 41) {
      lat = 40 + lat;
    }
    
    return { lat, lng };
  };

  // Create HUMINT icon based on type
  const createHumintIcon = (type: string) => {
    if (!window.L) return null;
    
    let html = '';
    
    switch (type) {
      case 'location':
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/90 backdrop-blur-sm border-2 border-blue-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-300">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>`;
        break;
      case 'observation':
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/90 backdrop-blur-sm border-2 border-blue-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-300">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 5V3"/>
                    <path d="M12 21v-2"/>
                    <path d="M5 12H3"/>
                    <path d="M21 12h-2"/>
                    <path d="m16.95 7.05-1.41 1.41"/>
                    <path d="m7.05 16.95 1.41-1.41"/>
                    <path d="m16.95 16.95-1.41-1.41"/>
                    <path d="m7.05 7.05 1.41 1.41"/>
                  </svg>
                </div>`;
        break;
      case 'movement':
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/90 backdrop-blur-sm border-2 border-blue-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-300">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>`;
        break;
      default:
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/90 backdrop-blur-sm border-2 border-blue-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-300">
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                </div>`;
    }
    
    return window.L.divIcon({
      html: html,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };
  
  // Create SIGINT icon based on emitter type
  const createSigintIcon = (emitterType: string) => {
    if (!window.L) return null;
    
    const html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-red-900/90 backdrop-blur-sm border-2 border-red-700 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-300">
                      <path d="M2 12a10 10 0 1 1 20 0"/>
                      <path d="M5 12a7 7 0 1 1 14 0"/>
                      <path d="M8 12a4 4 0 1 1 8 0"/>
                      <line x1="12" x2="12" y1="12" y2="12.01"/>
                    </svg>
                  </div>`;
    
    return window.L.divIcon({
      html: html,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };
  
  // Create OSINT icon based on event type
  const createOsintIcon = (eventType: string) => {
    if (!window.L) return null;
    
    let html = '';
    
    switch (eventType.toLowerCase()) {
      case 'social':
      case 'post':
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-green-900/90 backdrop-blur-sm border-2 border-green-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-300">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>`;
        break;
      case 'media':
      case 'image':
      case 'video':
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-green-900/90 backdrop-blur-sm border-2 border-green-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-300">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>`;
        break;
      case 'event':
      case 'incident':
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-green-900/90 backdrop-blur-sm border-2 border-green-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-300">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                  </svg>
                </div>`;
        break;
      default:
        html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-green-900/90 backdrop-blur-sm border-2 border-green-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-300">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>`;
    }
    
    return window.L.divIcon({
      html: html,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  useEffect(() => {
    if (map && selectedEntity) {
      // Force a redraw/refresh when a popup is shown
      map.invalidateSize();
    }
  }, [map, selectedEntity]);
  
  // Create fusion icon (combined intelligence)
  const createFusionIcon = () => {
    if (!window.L) return null;
    
    const html = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-900/90 backdrop-blur-sm border-2 border-purple-700 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-300">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>`;
    
    return window.L.divIcon({
      html: html,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Load Leaflet library
  useEffect(() => {
    // Check if the Leaflet library is already loaded
    if (!window.L && !document.getElementById('leaflet-css') && !document.getElementById('leaflet-js')) {
      // Load Leaflet CSS
      const linkEl = document.createElement('link');
      linkEl.id = 'leaflet-css';
      linkEl.rel = 'stylesheet';
      linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(linkEl);
      
      // Load Leaflet JS
      const scriptEl = document.createElement('script');
      scriptEl.id = 'leaflet-js';
      scriptEl.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      scriptEl.onload = () => setMapLoaded(true);
      scriptEl.onerror = () => setMapError('Failed to load map library');
      document.head.appendChild(scriptEl);
    } else {
      // Leaflet is already loaded
      setMapLoaded(window.L !== undefined);
    }
  }, []);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!mapLoaded || !window.L || !mapContainerRef.current) return;
    
    try {
      // Initialize custom styles for map
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .leaflet-container {
          background: #1a1a1a;
        }

        .leaflet-pane {
          z-index: 400;
        }

        .leaflet-popup-pane {
          z-index: 700;
        }

        .custom-intelligence-popup {
          position: fixed !important;
          z-index: 1000 !important;
          background-color: white;
          pointer-events: auto !important;
        }
        
        .military-popup .leaflet-popup-content-wrapper {
          background-color: rgba(30, 30, 30, 0.9);
          color: #e0e0e0;
          border-radius: 4px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(100, 100, 100, 0.3);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }
        
        .military-popup .leaflet-popup-tip {
          background-color: rgba(30, 30, 30, 0.9);
          border: 1px solid rgba(100, 100, 100, 0.3);
        }
        
        .leaflet-bar a {
          background-color: rgba(40, 40, 40, 0.8);
          color: #e0e0e0;
          border: 1px solid rgba(100, 100, 100, 0.3);
          backdrop-filter: blur(5px);
        }
        
        .leaflet-bar a:hover {
          background-color: rgba(60, 60, 60, 0.8);
        }
        
        .leaflet-control-zoom {
          margin-top: 60px !important;
        }
        
        .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.6) !important;
          color: rgba(255, 255, 255, 0.5) !important;
          font-size: 8px !important;
          padding: 2px 5px !important;
        }
        
        .grid-label {
          color: rgba(200, 200, 200, 0.6);
          font-size: 10px;
          font-weight: 500;
          text-shadow: 0px 0px 3px rgba(0,0,0,0.8);
          background: none;
          border: none;
          box-shadow: none;
          pointer-events: none;
        }
        
        .coordinate-overlay {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background-color: rgba(30, 30, 30, 0.8);
          color: #e0e0e0;
          font-family: monospace;
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 4px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(100, 100, 100, 0.3);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
          pointer-events: none;
          z-index: 1000;
        }
        
        .pulse-circle {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          70% {
            opacity: 0.3;
            transform: scale(1.3);
          }
          100% {
            opacity: 0.6;
            transform: scale(0.8);
          }
        }
        
        .basemap-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #e0e0e0;
        }
        
        .basemap-option:hover {
          background-color: rgba(80, 80, 80, 0.5);
        }
        
        .basemap-option.active {
          background-color: rgba(100, 100, 100, 0.7);
        }
        
        .basemap-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 6px;
        }
      `;
      document.head.appendChild(styleElement);
      
      let centerCoords = { lat: 49.0, lng: 36.0 }; // Default center (Ukraine)

      // Try to get coords from HUMINT data
      const humintGeo = extractHumintData();
      if (humintGeo.locations && humintGeo.locations.length > 0 && 
          humintGeo.locations[0].coordinates && 
          typeof humintGeo.locations[0].coordinates.latitude === 'number' && 
          typeof humintGeo.locations[0].coordinates.longitude === 'number') {
        centerCoords = toLeafletCoords(humintGeo.locations[0].coordinates);
      }

      // Or try SIGINT data
      const sigintEmitters = extractSigintData();
      if (sigintEmitters.length > 0 && sigintEmitters[0].coordinates && 
          typeof sigintEmitters[0].coordinates.latitude === 'number' && 
          typeof sigintEmitters[0].coordinates.longitude === 'number') {
        centerCoords = toLeafletCoords(sigintEmitters[0].coordinates);
      }

      // Or try OSINT data
      const osintEvents = extractOsintData();
      if (osintEvents.length > 0 && osintEvents[0].coordinates && 
          typeof osintEvents[0].coordinates.latitude === 'number' && 
          typeof osintEvents[0].coordinates.longitude === 'number') {
        centerCoords = toLeafletCoords(osintEvents[0].coordinates);
      }

      // Ensure we have valid coordinates no matter what
      if (typeof centerCoords.lat !== 'number' || isNaN(centerCoords.lat) || 
          typeof centerCoords.lng !== 'number' || isNaN(centerCoords.lng)) {
        centerCoords = { lat: 49.0, lng: 36.0 }; // Fallback to default Ukraine coordinates
      }

      console.log('Map center coordinates:', centerCoords);

      // Create map instance with verified coordinates
      const mapInstance = window.L.map(mapContainerRef.current, {
        center: [centerCoords.lat, centerCoords.lng],
        zoom: 7,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false
      });
      
      // Collection of available basemaps
      const baseMaps: BaseMaps = {
        dark: {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          name: 'Dark Tactical',
          color: '#1a1a1a'
        },
        satellite: {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          name: 'Satellite',
          color: '#143d6b'
        },
        terrain: {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          name: 'Terrain',
          color: '#4e7146'
        }
      };
      
      // Initialize layer groups
      layerGroups.current.base = window.L.layerGroup().addTo(mapInstance);
      layerGroups.current.grid = window.L.layerGroup().addTo(mapInstance);
      layerGroups.current.humint = window.L.layerGroup().addTo(mapInstance);
      layerGroups.current.sigint = window.L.layerGroup().addTo(mapInstance);
      layerGroups.current.osint = window.L.layerGroup().addTo(mapInstance);
      layerGroups.current.fusion = window.L.layerGroup().addTo(mapInstance);
      layerGroups.current.correlation = window.L.layerGroup().addTo(mapInstance);
      
      // Add base layer
      const baseLayer = window.L.tileLayer(baseMaps[activeBaseMap].url, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        opacity: 0.9
      }).addTo(layerGroups.current.base);
      
      // Add mouse coordinate tracking overlay
      const coordinateOverlay = document.createElement('div');
      coordinateOverlay.className = 'coordinate-overlay';
      coordinateOverlay.innerHTML = 'COORD: --°N, --°E';
      mapContainerRef.current.appendChild(coordinateOverlay);
      
      mapInstance.on('mousemove', (e: any) => {
        const { lat, lng } = e.latlng;
        coordinateOverlay.innerHTML = `COORD: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      });
      
      // Initial grid draw if enabled
      if (gridEnabled) {
        drawGrid(mapInstance, layerGroups.current.grid);
      }
      
      // Update grid when map moves
      mapInstance.on('moveend', () => {
        if (gridEnabled) {
          drawGrid(mapInstance, layerGroups.current.grid);
        }
      });
      
      // Add zoom control
      window.L.control.zoom({
        position: 'topright'
      }).addTo(mapInstance);
      
      // Store map instance
      setMap(mapInstance);
      
      // Cleanup function
      return () => {
        if (mapInstance) {
          mapInstance.remove();
        }
        if (styleElement) {
          document.head.removeChild(styleElement);
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [mapLoaded, extractHumintData, extractSigintData, extractOsintData, activeBaseMap, gridEnabled]);
  
  // Toggle base map function
  const handleBaseMapChange = (mapId: string) => {
    if (!map || !window.L) return;
    
    // Clear the current base layer
    layerGroups.current.base.clearLayers();
    
    // Add new base layer
    const baseMaps: BaseMaps = {
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        name: 'Dark Tactical',
        color: '#1a1a1a'
      },
      satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        name: 'Satellite',
        color: '#143d6b'
      },
      terrain: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        name: 'Terrain',
        color: '#4e7146'
      }
    };
    
    window.L.tileLayer(baseMaps[mapId]?.url || baseMaps.dark.url, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      opacity: 0.9
    }).addTo(layerGroups.current.base);
    
    setActiveBaseMap(mapId);
    setShowBasemapSelector(false);
  };
  
  // Toggle grid visibility
  const handleGridToggle = () => {
    if (!map) return;
    
    setGridEnabled(!gridEnabled);
    
    if (!gridEnabled) {
      // Grid was off, turn it on
      drawGrid(map, layerGroups.current.grid);
    } else {
      // Grid was on, turn it off
      layerGroups.current.grid.clearLayers();
    }
  };
  
  // Handle entity selection
  const handleEntityClick = (entityId: string, type: 'humint' | 'sigint' | 'osint' | 'fusion') => {
    // Find entity data based on type and ID
    let entityData = null;
    let entityType: 'humint' | 'sigint' | 'osint' | 'fusion' | 'threat' | 'location' | 'prediction' = type;
    
    if (type === 'humint' && humintData) {
      // Try to find in enemy forces
      const forceMatch = entityId.match(/^force-(\d+)$/);
      if (forceMatch && forceMatch[1] && humintData.intelligence.enemyForces && parseInt(forceMatch[1]) < humintData.intelligence.enemyForces.length) {
        entityData = humintData.intelligence.enemyForces[parseInt(forceMatch[1])];
      }
      
      // Try to find in locations
      const locationMatch = entityId.match(/^location-(\d+)$/);
      if (locationMatch && locationMatch[1] && humintData.intelligence.locations && parseInt(locationMatch[1]) < humintData.intelligence.locations.length) {
        entityData = humintData.intelligence.locations[parseInt(locationMatch[1])];
        entityType = 'location';
      }
      
      // Try to find in threats
      const threatMatch = entityId.match(/^threat-(\d+)$/);
      if (threatMatch && threatMatch[1] && humintData.intelligence.threats && parseInt(threatMatch[1]) < humintData.intelligence.threats.length) {
        entityData = humintData.intelligence.threats[parseInt(threatMatch[1])];
        entityType = 'threat';
      }
    } else if (type === 'sigint' && sigintData) {
      // Try to find in emitters
      const emitter = sigintData.emitters?.find(e => e.id === entityId);
      if (emitter) {
        entityData = emitter;
      }
    } else if (type === 'osint' && osintData) {
      // Try to find in events
      const event = osintData.events?.find(e => e.id === entityId);
      if (event) {
        entityData = event;
      }
      
      // Try to find in media
      if (!entityData) {
        const media = osintData.media?.find(m => m.id === entityId);
        if (media) {
          entityData = media;
        }
      }
      
      // Try to find in posts
      if (!entityData) {
        const post = osintData.posts?.find(p => p.id === entityId);
        if (post) {
          entityData = post;
        }
      }
      
      // Try to find in narratives
      if (!entityData) {
        const narrative = osintData.narratives?.find(n => n.id === entityId);
        if (narrative) {
          entityData = narrative;
        }
      }
    } else if (type === 'fusion' && fusionData) {
      // Try to find in fused entities
      const entity = fusionData.fusedEntities?.find(e => e.id === entityId);
      if (entity) {
        entityData = entity;
      }
      
      // Try to find in predictions if they exist
      if (!entityData && fusionData.predictions && fusionData.predictions.length > 0) {
        const prediction = fusionData.predictions.find(p => p.id === entityId);
        if (prediction) {
          entityData = prediction;
          entityType = 'prediction';
        }
      }
    }
    
    // Update selected entity if found
    if (entityData) {
      setSelectedEntity({ type: entityType, id: entityId, data: entityData });
    }
    
    // Also propagate to parent if handler provided
    if (onMarkerClick) {
      onMarkerClick(entityId, type);
    }
  };
  
  // Close entity popup
  const handleClosePopup = () => {
    setSelectedEntity(null);
  };
  
  // Toggle layer visibility
  const handleLayerToggle = (layerId: string) => {
    if (onLayerToggle) {
      onLayerToggle(layerId);
    }
  };
  
  // Draw grid function
  const drawGrid = (map: any, layerGroup: any) => {
    if (!map || !window.L || !layerGroup) return;
    
    layerGroup.clearLayers();
    
    // Only draw grid at appropriate zoom levels
    if (map.getZoom() < 7) return;
    
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Calculate grid size based on zoom level
    const zoomLevel = map.getZoom();
    let gridSize = 1.0; // Default 1 degree grid
    
    if (zoomLevel >= 12) {
      gridSize = 0.05; // approx 5km grid
    } else if (zoomLevel >= 10) {
      gridSize = 0.1; // approx 10km grid
    } else if (zoomLevel >= 8) {
      gridSize = 0.25; // approx 25km grid
    } else if (zoomLevel >= 7) {
      gridSize = 0.5; // approx 50km grid
    }
    
    // Round to nearest grid size
    const startLat = Math.floor(sw.lat / gridSize) * gridSize;
    const startLng = Math.floor(sw.lng / gridSize) * gridSize;
    const endLat = Math.ceil(ne.lat / gridSize) * gridSize;
    const endLng = Math.ceil(ne.lng / gridSize) * gridSize;
    
    // Horizontal lines (latitude)
    for (let lat = startLat; lat <= endLat; lat += gridSize) {
      const line = window.L.polyline([[lat, sw.lng], [lat, ne.lng]], {
        color: 'rgba(255, 255, 255, 0.15)',
        weight: 1,
        dashArray: '5, 5',
        interactive: false
      }).addTo(layerGroup);
      
      // Add lat label on the left
      const label = window.L.marker([lat, sw.lng], {
        icon: window.L.divIcon({
          html: `<div>${lat.toFixed(2)}°N</div>`,
          className: 'grid-label',
          iconSize: [60, 20],
          iconAnchor: [0, 10]
        }),
        interactive: false
      }).addTo(layerGroup);
    }
    
    // Vertical lines (longitude)
    for (let lng = startLng; lng <= endLng; lng += gridSize) {
      const line = window.L.polyline([[sw.lat, lng], [ne.lat, lng]], {
        color: 'rgba(255, 255, 255, 0.15)',
        weight: 1,
        dashArray: '5, 5',
        interactive: false
      }).addTo(layerGroup);
      
      // Add lng label at the bottom
      const label = window.L.marker([sw.lat, lng], {
        icon: window.L.divIcon({
          html: `<div>${lng.toFixed(2)}°E</div>`,
          className: 'grid-label',
          iconSize: [60, 20],
          iconAnchor: [30, -5]
        }),
        interactive: false
      }).addTo(layerGroup);
    }
  };
  
  // Update HUMINT markers when data or visibility changes
  useEffect(() => {
    if (!map || !window.L || !layerGroups.current.humint) return;
    
    // Clear existing HUMINT markers
    layerGroups.current.humint.clearLayers();
    
    // If HUMINT layer is not visible, return early
    if (!visibleLayers.includes('humint')) return;
    
    const humintGeo = extractHumintData();
    
    // Add HUMINT location markers
    if (humintGeo.locations && humintGeo.locations.length > 0) {
      humintGeo.locations.forEach((location, index) => {
        if (!location.coordinates) return;
        
        const coords = toLeafletCoords(location.coordinates);
        
        // Skip invalid coordinates
        if (!isValidCoordinate(coords)) {
          console.warn('Invalid HUMINT location coordinates, skipping marker:', location);
          return;
        }
        
        const icon = createHumintIcon('location');
        if (!icon) return;
        
        const marker = window.L.marker(coords, { icon }).addTo(layerGroups.current.humint);
        
        // Add pulse effect circle
        const pulseOptions = {
          color: 'rgba(59, 130, 246, 0.4)',
          fillColor: 'rgba(59, 130, 246, 0.1)',
          fillOpacity: 0.5,
          radius: 150,
          weight: 1
        };
        
        const pulseCircle = window.L.circle(coords, pulseOptions).addTo(layerGroups.current.humint);
        
        // Add range circle
        const rangeOptions = {
          color: 'rgba(59, 130, 246, 0.2)',
          fillColor: 'transparent',
          radius: 500,
          weight: 1,
          dashArray: '5, 5'
        };
        
        const rangeCircle = window.L.circle(coords, rangeOptions).addTo(layerGroups.current.humint);
        
        // Add military-style popup
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-sm text-white mb-1 border-b border-gray-600 pb-1">${location.name || 'Location'}</h3>
            ${location.description ? `<p class="text-xs mt-2 text-gray-300">${location.description}</p>` : ''}
            <div class="flex justify-between mt-2 pt-1 border-t border-gray-600">
              <div class="text-xs text-gray-300">
                <span class="font-mono">${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°E</span>
              </div>
              <div class="text-xs px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300">HUMINT</div>
            </div>
          </div>
        `;
        
        const popup = window.L.popup({
          className: 'military-popup',
          closeButton: false,
          maxWidth: 250
        }).setContent(popupContent);
        
        marker.bindPopup(popup);
        
        if (onMarkerClick) {
          marker.on('click', () => handleEntityClick(`location-${index}`, 'humint'));
        }
      });
    }
    
    // Add HUMINT observation markers
    if (humintGeo.observations && humintGeo.observations.length > 0) {
      humintGeo.observations.forEach((observation, index) => {
        if (!observation.coordinates) return;
        
        const coords = toLeafletCoords(observation.coordinates);
        const icon = createHumintIcon('observation');
        
        if (!icon) return;
        
        const marker = window.L.marker(coords, { icon }).addTo(layerGroups.current.humint);
        
        // Add pulse effect circle
        const pulseOptions = {
          color: 'rgba(59, 130, 246, 0.4)',
          fillColor: 'rgba(59, 130, 246, 0.1)',
          fillOpacity: 0.5,
          radius: 150,
          weight: 1
        };
        
        const pulseCircle = window.L.circle(coords, pulseOptions).addTo(layerGroups.current.humint);
        
        // Add range circle (larger for observation)
        const rangeOptions = {
          color: 'rgba(59, 130, 246, 0.2)',
          fillColor: 'transparent',
          radius: 1000,
          weight: 1,
          dashArray: '5, 5'
        };
        
        const rangeCircle = window.L.circle(coords, rangeOptions).addTo(layerGroups.current.humint);
        
        // Add military-style popup
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-sm text-white mb-1 border-b border-gray-600 pb-1">${observation.name || 'Observation'}</h3>
            ${observation.description ? `<p class="text-xs mt-2 text-gray-300">${observation.description}</p>` : ''}
            <div class="flex justify-between mt-2 pt-1 border-t border-gray-600">
              <div class="text-xs text-gray-300">
                <span class="font-mono">${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°E</span>
              </div>
              <div class="text-xs px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300">HUMINT</div>
            </div>
          </div>
        `;
        
        const popup = window.L.popup({
          className: 'military-popup',
          closeButton: false,
          maxWidth: 250
        }).setContent(popupContent);
        
        marker.bindPopup(popup);
        
        if (onMarkerClick) {
          marker.on('click', () => handleEntityClick(`observation-${index}`, 'humint'));
        }
      });
    }
    
    // Add HUMINT movement markers
    if (humintGeo.movements && humintGeo.movements.length > 0) {
      humintGeo.movements.forEach((movement, index) => {
        if (!movement.coordinates) return;
        
        const coords = toLeafletCoords(movement.coordinates);
        const icon = createHumintIcon('movement');
        
        if (!icon) return;
        
        const marker = window.L.marker(coords, { icon }).addTo(layerGroups.current.humint);
        
        // Add military-style popup
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-sm text-white mb-1 border-b border-gray-600 pb-1">${movement.name || 'Movement'}</h3>
            ${movement.description ? `<p class="text-xs mt-2 text-gray-300">${movement.description}</p>` : ''}
            <div class="flex justify-between mt-2 pt-1 border-t border-gray-600">
              <div class="text-xs text-gray-300">
                <span class="font-mono">${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°E</span>
              </div>
              <div class="text-xs px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300">HUMINT</div>
            </div>
          </div>
        `;
        
        const popup = window.L.popup({
          className: 'military-popup',
          closeButton: false,
          maxWidth: 250
        }).setContent(popupContent);
        
        marker.bindPopup(popup);
        
        if (onMarkerClick) {
          marker.on('click', () => handleEntityClick(`movement-${index}`, 'humint'));
        }
        
        // Add movement arrow
        // In a real application, this would connect start and end points
        // Here we're just adding a simple indicator
        const arrowOptions = {
          color: 'rgba(59, 130, 246, 0.7)',
          weight: 2,
          dashArray: '5, 5'
        };
        
        // Simulate a destination point
        const destLat = coords.lat + 0.05;
        const destLng = coords.lng + 0.05;
        
        const arrow = window.L.polyline([
          [coords.lat, coords.lng],
          [destLat, destLng]
        ], arrowOptions).addTo(layerGroups.current.humint);
        
        // Add arrowhead
        const arrowHead = window.L.divIcon({
          html: `<div class="flex items-center justify-center h-6 w-6 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        window.L.marker([destLat, destLng], { icon: arrowHead }).addTo(layerGroups.current.humint);
      });
    }
    
  }, [map, visibleLayers, extractHumintData, onMarkerClick, handleEntityClick]);

  // Update SIGINT markers when data or visibility changes
  useEffect(() => {
    if (!map || !window.L || !layerGroups.current.sigint) return;
    
    // Clear existing SIGINT markers
    layerGroups.current.sigint.clearLayers();
    
    // If SIGINT layer is not visible, return early
    if (!visibleLayers.includes('sigint')) return;
    
    const sigintEmitters = extractSigintData();
    
    // Add SIGINT emitter markers
    if (sigintEmitters.length > 0) {
      sigintEmitters.forEach((emitter) => {
        const coords = toLeafletCoords(emitter.coordinates);
        
        // Skip invalid coordinates
        if (!isValidCoordinate(coords)) {
          console.warn('Invalid SIGINT emitter coordinates, skipping marker:', emitter);
          return;
        }
        
        const icon = createSigintIcon(emitter.classification);
        if (!icon) return;
        
        const marker = window.L.marker(coords, { icon }).addTo(layerGroups.current.sigint);
        
        // Add accuracy circle
        const accuracyOptions = {
          color: 'rgba(220, 38, 38, 0.4)',
          fillColor: 'rgba(220, 38, 38, 0.1)',
          fillOpacity: 0.5,
          radius: emitter.accuracy,
          weight: 1
        };
        
        const accuracyCircle = window.L.circle(coords, accuracyOptions).addTo(layerGroups.current.sigint);
        
        // Add military-style popup
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-sm text-white mb-1 border-b border-gray-600 pb-1">${emitter.classification || 'Unknown Emitter'}</h3>
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-300 mt-2">
              <div>
                <span class="text-gray-500">ID:</span> ${emitter.id}
              </div>
              <div>
                <span class="text-gray-500">Confidence:</span> ${emitter.confidence}
              </div>
              <div>
                <span class="text-gray-500">Timestamp:</span> ${new Date(emitter.timestamp).toLocaleString()}
              </div>
              <div>
                <span class="text-gray-500">Accuracy:</span> ±${emitter.accuracy}m
              </div>
            </div>
            <div class="flex justify-between mt-2 pt-1 border-t border-gray-600">
              <div class="text-xs text-gray-300">
                <span class="font-mono">${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°E</span>
              </div>
              <div class="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-300">SIGINT</div>
            </div>
          </div>
        `;
        
        const popup = window.L.popup({
          className: 'military-popup',
          closeButton: false,
          maxWidth: 250
        }).setContent(popupContent);
        
        marker.bindPopup(popup);
        
        if (onMarkerClick) {
          marker.on('click', () => handleEntityClick(emitter.id, 'sigint'));
        }
      });
    }
    
  }, [map, visibleLayers, extractSigintData, onMarkerClick, handleEntityClick]);

  // Update OSINT markers when data or visibility changes
  useEffect(() => {
    if (!map || !window.L || !layerGroups.current.osint) return;
    
    // Clear existing OSINT markers
    layerGroups.current.osint.clearLayers();
    
    // If OSINT layer is not visible, return early
    if (!visibleLayers.includes('osint')) return;
    
    const osintEvents = extractOsintData();
    
    // Add OSINT event markers
    if (osintEvents.length > 0) {
      osintEvents.forEach((event) => {
        const coords = toLeafletCoords(event.coordinates);
        
        // Skip invalid coordinates
        if (!isValidCoordinate(coords)) {
          console.warn('Invalid OSINT event coordinates, skipping marker:', event);
          return;
        }
        
        const icon = createOsintIcon(event.type);
        if (!icon) return;
        
        const marker = window.L.marker(coords, { icon }).addTo(layerGroups.current.osint);
        
        // Add highlight circle
        const highlightOptions = {
          color: 'rgba(16, 185, 129, 0.4)',
          fillColor: 'rgba(16, 185, 129, 0.1)',
          fillOpacity: 0.5,
          radius: 200,
          weight: 1
        };
        
        const highlightCircle = window.L.circle(coords, highlightOptions).addTo(layerGroups.current.osint);
        
        // Add military-style popup
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-sm text-white mb-1 border-b border-gray-600 pb-1">${event.title || 'OSINT Event'}</h3>
            <div class="text-xs text-gray-300 mt-2">
              <div class="mb-1"><span class="text-gray-500">Type:</span> ${event.type}</div>
              <div class="mb-1"><span class="text-gray-500">Timestamp:</span> ${new Date(event.timestamp).toLocaleString()}</div>
              <div><span class="text-gray-500">Confidence:</span> ${event.confidence}</div>
            </div>
            <div class="flex justify-between mt-2 pt-1 border-t border-gray-600">
              <div class="text-xs text-gray-300">
                <span class="font-mono">${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°E</span>
              </div>
              <div class="text-xs px-1.5 py-0.5 rounded bg-green-900/30 text-green-300">OSINT</div>
            </div>
          </div>
        `;
        
        const popup = window.L.popup({
          className: 'military-popup',
          closeButton: false,
          maxWidth: 250
        }).setContent(popupContent);
        
        marker.bindPopup(popup);
        
        if (onMarkerClick) {
          marker.on('click', () => handleEntityClick(event.id, 'osint'));
        }
      });
    }
    
  }, [map, visibleLayers, extractOsintData, onMarkerClick, handleEntityClick]);

  // Update Fusion markers and correlation lines when data or visibility changes
  useEffect(() => {
    if (!map || !window.L || !layerGroups.current.fusion || !layerGroups.current.correlation) return;
    
    // Clear existing fusion markers and correlation lines
    layerGroups.current.fusion.clearLayers();
    layerGroups.current.correlation.clearLayers();
    
    // If fusion layer is not visible, skip fusion entities
    if (visibleLayers.includes('fusion') && fusionData && fusionData.fusedEntities) {
      // Create fusion entity markers
      fusionData.fusedEntities.forEach((entity) => {
        // Find associated locations from different intelligence sources
        let entityLocation: Coordinates | null = null;
        
        // Check HUMINT sources for location
        if (entity.humintSources && entity.humintSources.length > 0 && humintData) {
          const humintGeo = extractHumintData();
          
          // Try to find location in HUMINT data
          for (const locationId of entity.humintSources) {
            const locationMatch = locationId.match(/^location-(\d+)$/);
            if (locationMatch && locationMatch[1] && 
                humintGeo.locations[parseInt(locationMatch[1])] &&
                humintGeo.locations[parseInt(locationMatch[1])].coordinates) {
              entityLocation = toLeafletCoords(humintGeo.locations[parseInt(locationMatch[1])].coordinates);
              break;
            }
          }
        }
        
        // If no location found in HUMINT, check SIGINT sources
        if (!entityLocation && entity.sigintSources && entity.sigintSources.length > 0 && sigintData) {
          const sigintEmitters = extractSigintData();
          
          // Try to find emitter by ID
          const emitter = sigintEmitters.find(e => entity.sigintSources.includes(e.id));
          if (emitter && emitter.coordinates) {
            entityLocation = toLeafletCoords(emitter.coordinates);
          }
        }
        
        // If still no location, check OSINT sources
        if (!entityLocation && entity.osintSources && entity.osintSources.length > 0 && osintData) {
          const osintEvents = extractOsintData();
          
          // Try to find event by ID
          const event = osintEvents.find(e => entity.osintSources.includes(e.id));
          if (event && event.coordinates) {
            entityLocation = toLeafletCoords(event.coordinates);
          }
        }
        
        // If we have a location, create a fusion marker
        if (entityLocation) {
          const icon = createFusionIcon();
          
          if (icon) {
            const marker = window.L.marker(entityLocation, { icon }).addTo(layerGroups.current.fusion);
            
            // Add fusion highlight circle
            const highlightOptions = {
              color: 'rgba(147, 51, 234, 0.4)',
              fillColor: 'rgba(147, 51, 234, 0.1)',
              fillOpacity: 0.5,
              radius: 300,
              weight: 1
            };
            
            const highlightCircle = window.L.circle(entityLocation, highlightOptions).addTo(layerGroups.current.fusion);
            
            // Add military-style popup
            const sourceCounts = {
              humint: entity.humintSources?.length || 0,
              sigint: entity.sigintSources?.length || 0,
              osint: entity.osintSources?.length || 0
            };
            
            const popupContent = `
              <div class="p-3">
                <h3 class="font-bold text-sm text-white mb-1 border-b border-gray-600 pb-1">${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}</h3>
                <div class="text-xs text-gray-300 mt-2">
                  <div class="mb-1"><span class="text-gray-500">ID:</span> ${entity.id}</div>
                  <div class="mb-1"><span class="text-gray-500">Confidence:</span> ${entity.combinedConfidence}</div>
                  <div class="mb-1"><span class="text-gray-500">Sources:</span> 
                    <span class="text-blue-300">${sourceCounts.humint} HUMINT</span> | 
                    <span class="text-red-300">${sourceCounts.sigint} SIGINT</span> | 
                    <span class="text-green-300">${sourceCounts.osint} OSINT</span>
                  </div>
                </div>
                <div class="flex justify-between mt-2 pt-1 border-t border-gray-600">
                  <div class="text-xs text-gray-300">
                    <span class="font-mono">${entityLocation.lat.toFixed(5)}°N, ${entityLocation.lng.toFixed(5)}°E</span>
                  </div>
                  <div class="text-xs px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300">FUSION</div>
                </div>
              </div>
            `;
            
            const popup = window.L.popup({
              className: 'military-popup',
              closeButton: false,
              maxWidth: 250
            }).setContent(popupContent);
            
            marker.bindPopup(popup);
            
            if (onMarkerClick) {
              marker.on('click', () => handleEntityClick(entity.id, 'fusion'));
            }
          }
        }
      });
    }
    
    // If correlation layer is visible, draw correlation lines
    if (visibleLayers.includes('correlation') && fusionData) {
      const correlations = extractCorrelations();
      
      correlations.forEach(correlation => {
        // Find related entities
        let humintLocation: Coordinates | null = null;
        let sigintLocation: Coordinates | null = null;
        let osintLocation: Coordinates | null = null;
        
        // Find HUMINT location
        if (correlation.humintEntityId && humintData) {
          const humintGeo = extractHumintData();
          const locationMatch = correlation.humintEntityId.match(/^location-(\d+)$/);
          
          if (locationMatch && locationMatch[1] && 
              humintGeo.locations[parseInt(locationMatch[1])] &&
              humintGeo.locations[parseInt(locationMatch[1])].coordinates) {
            humintLocation = toLeafletCoords(humintGeo.locations[parseInt(locationMatch[1])].coordinates);
          }
          
          // If not found in locations, try observations
          if (!humintLocation) {
            const obsMatch = correlation.humintEntityId.match(/^observation-(\d+)$/);
            if (obsMatch && obsMatch[1] && 
                humintGeo.observations[parseInt(obsMatch[1])] &&
                humintGeo.observations[parseInt(obsMatch[1])].coordinates) {
              humintLocation = toLeafletCoords(humintGeo.observations[parseInt(obsMatch[1])].coordinates);
            }
          }
        }
        
        // Find SIGINT location
        if (correlation.sigintEmitterId && sigintData) {
          const sigintEmitters = extractSigintData();
          const emitter = sigintEmitters.find(e => e.id === correlation.sigintEmitterId);
          
          if (emitter && emitter.coordinates) {
            sigintLocation = toLeafletCoords(emitter.coordinates);
          }
        }
        
        // Find OSINT location if present
        if (correlation.osintEntityId !== undefined && osintData) {
          const osintEvents = extractOsintData();
          const event = osintEvents.find(e => e.id === correlation.osintEntityId);
          
          if (event && event.coordinates) {
            osintLocation = toLeafletCoords(event.coordinates);
          }
        }
        
        // Draw correlation line between HUMINT and SIGINT
        if (humintLocation && sigintLocation) {
          let lineColor: string;
          let lineWeight: number;
          let lineDash: string | undefined;
          
          // Style based on correlation strength
          if (correlation.strength > 0.7) {
            lineColor = 'rgba(147, 51, 234, 0.8)'; // Strong - solid purple
            lineWeight = 2;
            lineDash = undefined;
          } else if (correlation.strength > 0.4) {
            lineColor = 'rgba(147, 51, 234, 0.6)'; // Medium - dashed purple
            lineWeight = 2;
            lineDash = '5, 5';
          } else {
            lineColor = 'rgba(147, 51, 234, 0.4)'; // Weak - dotted purple
            lineWeight = 1;
            lineDash = '2, 4';
          }
          
          const lineOptions = {
            color: lineColor,
            weight: lineWeight,
            dashArray: lineDash
          };
          
          const line = window.L.polyline([
            [humintLocation.lat, humintLocation.lng],
            [sigintLocation.lat, sigintLocation.lng]
          ], lineOptions).addTo(layerGroups.current.correlation);
          
          // Add line label with correlation strength
          const midPoint = {
            lat: (humintLocation.lat + sigintLocation.lat) / 2,
            lng: (humintLocation.lng + sigintLocation.lng) / 2
          };
          
          const labelIcon = window.L.divIcon({
            html: `<div class="px-1 py-0.5 bg-purple-900/80 text-purple-100 text-[10px] rounded">
                    ${Math.floor(correlation.strength * 100)}%
                  </div>`,
            className: '',
            iconSize: [30, 16],
            iconAnchor: [15, 8]
          });
          
          window.L.marker([midPoint.lat, midPoint.lng], { 
            icon: labelIcon, 
            interactive: false 
          }).addTo(layerGroups.current.correlation);
        }
        
        // Draw correlation line between HUMINT and OSINT if both exist
        if (humintLocation && osintLocation) {
          const lineOptions = {
            color: 'rgba(147, 51, 234, 0.4)',
            weight: 1,
            dashArray: '5, 5'
          };
          
          const line = window.L.polyline([
            [humintLocation.lat, humintLocation.lng],
            [osintLocation.lat, osintLocation.lng]
          ], lineOptions).addTo(layerGroups.current.correlation);
        }
        
        // Draw correlation line between SIGINT and OSINT if both exist
        if (sigintLocation && osintLocation) {
          const lineOptions = {
            color: 'rgba(147, 51, 234, 0.4)',
            weight: 1,
            dashArray: '5, 5'
          };
          
          const line = window.L.polyline([
            [sigintLocation.lat, sigintLocation.lng],
            [osintLocation.lat, osintLocation.lng]
          ], lineOptions).addTo(layerGroups.current.correlation);
        }
      });
    }
    
  }, [map, visibleLayers, fusionData, humintData, sigintData, osintData, extractHumintData, extractSigintData, extractOsintData, extractCorrelations, onMarkerClick, handleEntityClick]);

  // Toggle layer visibility when visibleLayers changes
  useEffect(() => {
    if (!map || !layerGroups.current) return;
    
    // Handle HUMINT layer visibility
    if (layerGroups.current.humint) {
      if (visibleLayers.includes('humint')) {
        map.addLayer(layerGroups.current.humint);
      } else {
        map.removeLayer(layerGroups.current.humint);
      }
    }
    
    // Handle SIGINT layer visibility
    if (layerGroups.current.sigint) {
      if (visibleLayers.includes('sigint')) {
        map.addLayer(layerGroups.current.sigint);
      } else {
        map.removeLayer(layerGroups.current.sigint);
      }
    }
    
    // Handle OSINT layer visibility
    if (layerGroups.current.osint) {
      if (visibleLayers.includes('osint')) {
        map.addLayer(layerGroups.current.osint);
      } else {
        map.removeLayer(layerGroups.current.osint);
      }
    }
    
    // Handle Fusion layer visibility
    if (layerGroups.current.fusion) {
      if (visibleLayers.includes('fusion')) {
        map.addLayer(layerGroups.current.fusion);
      } else {
        map.removeLayer(layerGroups.current.fusion);
      }
    }
    
    // Handle Correlation layer visibility
    if (layerGroups.current.correlation) {
      if (visibleLayers.includes('correlation')) {
        map.addLayer(layerGroups.current.correlation);
      } else {
        map.removeLayer(layerGroups.current.correlation);
      }
    }
  }, [map, visibleLayers]);
  
  // If there's an error loading the map
  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="rounded-lg bg-gray-800 border border-gray-700 p-8 text-center max-w-md">
          <div className="text-red-500 mb-4"><AlertTriangle size={48} className="mx-auto" /></div>
          <p className="text-gray-300 text-lg font-medium mb-2">{mapError}</p>
          <p className="text-gray-500">Please check your network connection and try again.</p>
        </div>
      </div>
    );
  }
  
  // Show loading state while map is initializing
  if (!mapLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="rounded-lg bg-gray-800 border border-gray-700 p-8 flex flex-col items-center justify-center">
          <div className="animate-spin mb-4">
            <Map className="h-12 w-12 text-gray-500" />
          </div>
          <p className="text-gray-300 text-lg font-medium">{t('loadingMap') || 'Loading tactical map...'}</p>
          <p className="text-gray-500 mt-2">Preparing intelligence visualization</p>
        </div>
      </div>
    );
  }
  
  // Count entities by type (for the legend)
  const countHumintEntities = () => {
    const humintGeo = extractHumintData();
    return (humintGeo.locations?.length || 0) + 
           (humintGeo.observations?.length || 0) + 
           (humintGeo.movements?.length || 0);
  };
  
  const countSigintEntities = () => {
    return extractSigintData().length;
  };
  
  const countOsintEntities = () => {
    return extractOsintData().length;
  };
  
  const countFusionEntities = () => {
    return fusionData?.fusedEntities?.length || 0;
  };
  
  const countCorrelations = () => {
    return extractCorrelations().length;
  };
  
  // Render the map container
  return (
    <div className="h-full bg-gray-900 relative" ref={mapContainerRef}>
      <div className="h-full" id="fusion-map"></div>
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button 
          onClick={() => setShowLayerControl(!showLayerControl)}
          className={`
            p-2 rounded-md shadow-lg transition-all
            ${showLayerControl 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          title={t('toggleLayers') || "Toggle layer controls"}
        >
          <Layers size={20} />
        </button>
        
        <button 
          onClick={() => setShowTimeControl(!showTimeControl)}
          className={`
            p-2 rounded-md shadow-lg transition-all
            ${showTimeControl 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          title={t('toggleTimeline') || "Toggle time controls"}
        >
          <Clock size={20} />
        </button>
        
        <button
          onClick={() => setShowBasemapSelector(!showBasemapSelector)}
          className={`
            p-2 rounded-md shadow-lg transition-all
            ${showBasemapSelector 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          title="Change base map"
        >
          <Map size={20} />
        </button>
        
        <button
          onClick={handleGridToggle}
          className={`
            p-2 rounded-md shadow-lg transition-all
            ${gridEnabled 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          title="Toggle grid"
        >
          <Target size={20} />
        </button>
      </div>
      
      {/* Basemap Selector */}
      {showBasemapSelector && (
        <div className="absolute top-4 right-16 z-20 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-md p-3 shadow-lg w-56">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-200">Map Style</h3>
            <button 
              onClick={() => setShowBasemapSelector(false)}
              className="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700"
            >
              <XCircle size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            <div 
              className={`basemap-option ${activeBaseMap === 'dark' ? 'active' : ''}`}
              onClick={() => handleBaseMapChange('dark')}
            >
              <div className="basemap-color" style={{ backgroundColor: '#1a1a1a' }}></div>
              <span>Dark Tactical</span>
            </div>
            
            <div 
              className={`basemap-option ${activeBaseMap === 'satellite' ? 'active' : ''}`}
              onClick={() => handleBaseMapChange('satellite')}
            >
              <div className="basemap-color" style={{ backgroundColor: '#143d6b' }}></div>
              <span>Satellite</span>
            </div>
            
            <div 
              className={`basemap-option ${activeBaseMap === 'terrain' ? 'active' : ''}`}
              onClick={() => handleBaseMapChange('terrain')}
            >
              <div className="basemap-color" style={{ backgroundColor: '#4e7146' }}></div>
              <span>Terrain</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Layer Controls Panel */}
      {showLayerControl && (
        <div className="absolute top-16 right-4 z-20 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-md p-3 shadow-lg w-64">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-200">{t('layers') || "Display Layers"}</h3>
            <button 
              onClick={() => setShowLayerControl(false)}
              className="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700"
            >
              <XCircle size={16} />
            </button>
          </div>
          
          <div className="space-y-2 mt-2">
            {/* HUMINT Layer */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibleLayers.includes('humint')}
                  onChange={() => handleLayerToggle('humint')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-300 flex items-center">
                  <Eye size={14} className="mr-1 text-blue-400" />
                  HUMINT
                </span>
              </label>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
            
            {/* SIGINT Layer */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibleLayers.includes('sigint')}
                  onChange={() => handleLayerToggle('sigint')}
                  className="h-4 w-4 text-red-600 rounded border-gray-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-300 flex items-center">
                  <Radio size={14} className="mr-1 text-red-400" />
                  SIGINT
                </span>
              </label>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            
            {/* OSINT Layer */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibleLayers.includes('osint')}
                  onChange={() => handleLayerToggle('osint')}
                  className="h-4 w-4 text-green-600 rounded border-gray-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-300 flex items-center">
                  <Globe size={14} className="mr-1 text-green-400" />
                  OSINT
                </span>
              </label>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            
            {/* Fusion Layer */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibleLayers.includes('fusion')}
                  onChange={() => handleLayerToggle('fusion')}
                  className="h-4 w-4 text-purple-600 rounded border-gray-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-300 flex items-center">
                  <Zap size={14} className="mr-1 text-purple-400" />
                  Fusion
                </span>
              </label>
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            </div>
            
            {/* Correlation Lines */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibleLayers.includes('correlation')}
                  onChange={() => handleLayerToggle('correlation')}
                  className="h-4 w-4 text-purple-600 rounded border-gray-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-300">Correlation Lines</span>
              </label>
              <div className="w-8 h-1 bg-purple-500 rounded"></div>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              {/* Show layer stats */}
              <div>HUMINT: {countHumintEntities()} entities</div>
              <div>SIGINT: {countSigintEntities()} emitters</div>
              <div>OSINT: {countOsintEntities()} events</div>
              <div>Fusion: {countFusionEntities()} entities</div>
              <div>Correlations: {countCorrelations()} connections</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Time Controls Panel */}
      {showTimeControl && (
        <div className="absolute top-16 right-4 z-20 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-md p-3 shadow-lg w-64">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-200">{t('timeline') || "Timeline"}</h3>
            <button 
              onClick={() => setShowTimeControl(false)}
              className="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700"
            >
              <XCircle size={16} />
            </button>
          </div>
          
          <div className="space-y-4 mt-3">
            {/* Timeline slider */}
            <div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="100"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>12:00</span>
                <span>Current</span>
              </div>
            </div>
            
            {/* Playback controls */}
            <div className="flex justify-center gap-2">
              <button className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="19 20 9 12 19 4 19 20"></polygon>
                  <line x1="5" y1="19" x2="5" y2="5"></line>
                </svg>
              </button>
              
              <button className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </button>
              
              <button className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"></polygon>
                </svg>
              </button>
              
              <button className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded">
                <RefreshCcw size={16} />
              </button>
            </div>
            
            <div className="text-center text-xs text-gray-400">
              {currentTime 
                ? new Date(currentTime).toLocaleString() 
                : new Date().toLocaleString()
              }
            </div>
          </div>
        </div>
      )}
      
      {/* Fixed Legend */}
      <div className="absolute bottom-6 right-4 z-10 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-md p-3 shadow-lg">
        <div className="text-xs font-medium text-gray-300 mb-2">INTELLIGENCE SOURCES</div>
        
        <div className="space-y-1.5">
          {visibleLayers.includes('humint') && (
            <div className="flex items-center">
              <div className="legend-color" style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)', border: '1px solid rgba(59, 130, 246, 1)' }}></div>
              <span className="text-xs text-gray-300">HUMINT ({countHumintEntities()})</span>
            </div>
          )}
          
          {visibleLayers.includes('sigint') && (
            <div className="flex items-center">
              <div className="legend-color" style={{ backgroundColor: 'rgba(220, 38, 38, 0.8)', border: '1px solid rgba(220, 38, 38, 1)' }}></div>
              <span className="text-xs text-gray-300">SIGINT ({countSigintEntities()})</span>
            </div>
          )}
          
          {visibleLayers.includes('osint') && (
            <div className="flex items-center">
              <div className="legend-color" style={{ backgroundColor: 'rgba(16, 185, 129, 0.8)', border: '1px solid rgba(16, 185, 129, 1)' }}></div>
              <span className="text-xs text-gray-300">OSINT ({countOsintEntities()})</span>
            </div>
          )}
          
          {visibleLayers.includes('fusion') && (
            <div className="flex items-center">
              <div className="legend-color" style={{ backgroundColor: 'rgba(147, 51, 234, 0.8)', border: '1px solid rgba(147, 51, 234, 1)' }}></div>
              <span className="text-xs text-gray-300">Fusion ({countFusionEntities()})</span>
            </div>
          )}
          
          {visibleLayers.includes('correlation') && (
            <div className="flex items-center">
              <div className="w-12 h-1 bg-purple-500 mr-2"></div>
              <span className="text-xs text-gray-300">Correlations ({countCorrelations()})</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Bar - Theater designation for Ukraine */}
      <div className="absolute bottom-4 left-4 z-10 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 px-3 py-2">
        <div className="flex items-center text-xs text-gray-400">
          <Zap className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
          <span className="font-mono uppercase tracking-wider">THEATER: UKRAINE</span>
        </div>
      </div>
      
      {/* Selected entity popup */}
      {selectedEntity && (
        <div className="fixed left-1/2 bottom-10 transform -translate-x-1/2 custom-intelligence-popup">
          <IntelligencePopup
            entityType={selectedEntity.type}
            entityData={selectedEntity.data}
            onClose={handleClosePopup}
          />
        </div>
      )}
    </div>
  );
};

export default FusionMap;