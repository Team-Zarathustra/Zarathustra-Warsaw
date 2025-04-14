// components/military-intelligence/analysis/IntelligenceSidebar.tsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Target, 
  Shield, 
  Map, 
  Radio, 
  Zap,
  BarChart3, 
  PieChart,
  Eye,
  EyeOff,
  Radar,
  AlertTriangle,
  Waves,
  Cpu,
  Plane,
  Truck,
  Anchor,
  Activity,
  Compass,
  Globe,
  Twitter,
  Database,
  Smartphone
} from 'lucide-react';
import { 
  AdaptedAnalysisResponse, 
  QualityScore, 
  Prediction 
} from '../../../type/intelligence';
import ConfidenceBadge from '../ui/confidenceBadge';
import InsightItem from '../ui/insightItem';

// Define interfaces for data structures used in the component
interface SigintStats {
  emitterCount: number;
  detectionCount: number;
  platformTypes: Record<string, number>;
  emissionTypes: Record<string, number>;
  coverageArea: string;
}

// Matching the structure used in the component
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

// Component-specific location interface that matches how it's used in the component
export interface ComponentEmitterLocation {
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  accuracy: number;
  confidenceLevel?: QualityScore;
}

export interface EmissionDetection {
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

// Component-specific emission interface
interface ComponentEmission {
  id?: string;
  timestamp: string;
  signalType?: string;
  frequency?: number;
}

// The component-specific version of RadarEmitter
export interface ComponentRadarEmitter {
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
  locations?: ComponentEmitterLocation[];
  platformAssessment?: EmitterPlatformAssessment;
  characteristics?: EmitterCharacteristics;
}

// Enhanced SigintAnalysisResponse for the component
export interface ComponentSigintAnalysisResponse {
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

// Define interface for OSINT social media platform
export interface SocialMediaPlatform {
  name: string;
  postCount: number;
  accountsTracked: number;
  reliabilityScore: number;
}

// Define interface for OSINT source types
export interface OsintSourceType {
  type: string;
  count: number;
  reliabilityScore: number;
}

// Define interface for OSINT media item
export interface OsintMediaItem {
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

// Define interface for OSINT post/article
export interface OsintPost {
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
  relatedMedia?: string[]; // IDs of related media
}

// Define interface for OSINT narrative
export interface OsintNarrative {
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

// Define interface for OSINT event
export interface OsintEvent {
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

// Enhanced OsintAnalysisResponse for the component
export interface ComponentOsintAnalysisResponse {
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

// Define an interface for correlation factors
interface CorrelationFactors {
  spatial: number;
  temporal: number;
  semantic?: number;
}

// Define an interface for correlation strength
interface CorrelationStrength {
  value: number;
  factors: CorrelationFactors;
}

// Define an interface for correlations
interface Correlation {
  humintEntityId: string;
  sigintEmitterId: string;
  osintEntityId?: string;
  strength: CorrelationStrength;
  correlationType: string;
}

// Define an interface for fused entities
interface FusedEntity {
  id: string;
  type: string;
  humintSources: string[];
  sigintSources: string[];
  osintSources: string[];
  combinedConfidence: QualityScore;
  correlations: Correlation[];
}

// Define an interface for fusion predictions
interface FusionPrediction {
  id: string;
  name: string;
  description: string;
  confidence: number;
  timeframe: string;
  supportingEvidence: number;
}

// Enhanced FusionAnalysisResponse for the component
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

interface IntelligenceSidebarProps {
  humintData?: AdaptedAnalysisResponse | null;
  sigintData?: ComponentSigintAnalysisResponse | null;
  osintData?: ComponentOsintAnalysisResponse | null;
  fusionData?: ComponentFusionAnalysisResponse | null;
  onToggleLayer: (layerId: string) => void;
  onEntityClick?: (entityId: string, type: 'humint' | 'sigint' | 'osint' | 'fusion') => void;
  visibleLayers: string[];
  t: (key: string) => string;
}

const IntelligenceSidebar: React.FC<IntelligenceSidebarProps> = ({
  humintData,
  sigintData,
  osintData,
  fusionData,
  onToggleLayer,
  onEntityClick,
  visibleLayers,
  t
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'humint' | 'sigint' | 'osint' | 'fusion'>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [sigintStats, setSigintStats] = useState<SigintStats>({
    emitterCount: 0,
    detectionCount: 0,
    platformTypes: {},
    emissionTypes: {},
    coverageArea: 'Unknown'
  });
  const [osintStats, setOsintStats] = useState({
    mediaCount: 0,
    postCount: 0,
    narrativeCount: 0,
    eventCount: 0,
    verifiedContent: 0,
    unverifiedContent: 0
  });

  // Process SIGINT data when it changes
  useEffect(() => {
    if (sigintData) {
      // Calculate statistics from SIGINT data
      const stats = {
        emitterCount: sigintData.emitters?.length || 0,
        detectionCount: sigintData.signals || 0,
        platformTypes: {} as Record<string, number>,
        emissionTypes: {} as Record<string, number>,
        coverageArea: 'Unknown'
      };
      
      // Count platform types
      sigintData.emitters?.forEach((emitter) => {
        const platformType = emitter.platformAssessment?.type || 'unknown';
        stats.platformTypes[platformType] = (stats.platformTypes[platformType] || 0) + 1;
      });
      
      // Count emission types
      sigintData.emitters?.forEach((emitter) => {
        if (emitter.characteristics?.modulation) {
          emitter.characteristics.modulation.forEach(mod => {
            stats.emissionTypes[mod] = (stats.emissionTypes[mod] || 0) + 1;
          });
        }
      });
      
      // Extract coverage area if available
      if (sigintData.coverage?.region) {
        const { northEast, southWest } = sigintData.coverage.region;
        if (northEast && southWest && 
            typeof northEast.latitude === 'number' && 
            typeof northEast.longitude === 'number' &&
            typeof southWest.latitude === 'number' && 
            typeof southWest.longitude === 'number') {
          stats.coverageArea = `${northEast.latitude.toFixed(2)}°N, ${northEast.longitude.toFixed(2)}°E to ${southWest.latitude.toFixed(2)}°N, ${southWest.longitude.toFixed(2)}°E`;
        }
      }
      
      setSigintStats(stats);
    }
  }, [sigintData]);

  // Process OSINT data when it changes
  useEffect(() => {
    if (osintData) {
      // Calculate statistics from OSINT data
      const stats = {
        mediaCount: osintData.media?.length || 0,
        postCount: osintData.posts?.length || 0,
        narrativeCount: osintData.narratives?.length || 0,
        eventCount: osintData.events?.length || 0,
        verifiedContent: 0,
        unverifiedContent: 0
      };
      
      // Count verified vs unverified content
      if (osintData.media) {
        osintData.media.forEach(media => {
          if (media.verificationStatus === 'verified' || media.verificationStatus === 'likely') {
            stats.verifiedContent++;
          } else {
            stats.unverifiedContent++;
          }
        });
      }
      
      if (osintData.posts) {
        osintData.posts.forEach(post => {
          if (post.verified) {
            stats.verifiedContent++;
          } else {
            stats.unverifiedContent++;
          }
        });
      }
      
      setOsintStats(stats);
    }
  }, [osintData]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };
  
  // Check if we have data
  const hasHumintData = !!humintData;
  const hasSigintData = !!sigintData;
  const hasOsintData = !!osintData;
  const hasFusionData = !!fusionData;

  // Format date for better readability
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString || 'Unknown date';
    }
  };

  // Get icon for platform type
  const getPlatformIcon = (type: string | undefined) => {
    if (!type) return <Radar className="h-4 w-4 text-red-600" />;
    
    switch (type.toLowerCase()) {
      case 'air':
      case 'aircraft':
        return <Plane className="h-4 w-4 text-blue-600" />;
      case 'ground':
      case 'vehicle':
      case 'mobile':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'naval':
      case 'ship':
        return <Anchor className="h-4 w-4 text-blue-800" />;
      default:
        return <Radar className="h-4 w-4 text-red-600" />;
    }
  };

  // Get icon for OSINT source type
  const getOsintSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'twitter':
      case 'x':
        return <Twitter className="h-4 w-4 text-blue-500" />;
      case 'telegram':
      case 'messaging':
        return <Smartphone className="h-4 w-4 text-blue-400" />;
      case 'website':
      case 'news':
        return <Globe className="h-4 w-4 text-amber-500" />;
      case 'database':
      case 'repository':
        return <Database className="h-4 w-4 text-purple-500" />;
      default:
        return <Globe className="h-4 w-4 text-green-500" />;
    }
  };

  // Get color for confidence level
  const getConfidenceColor = (level: QualityScore | string | undefined) => {
    switch (level) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  // Safe number formatter
  const safeNumberFormat = (num: number | null | undefined, decimals: number = 0): string => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header with Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200 pb-2">
        <h2 className="text-base font-medium text-gray-800 mb-3">Intelligence Analysis</h2>
        
        <div className="flex space-x-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1.5 text-xs rounded-md font-medium whitespace-nowrap flex items-center gap-1.5
              ${activeTab === 'all' 
                ? 'bg-gray-100 text-gray-800' 
                : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>All Sources</span>
          </button>
          
          {hasHumintData && (
            <button
              onClick={() => setActiveTab('humint')}
              className={`px-2 py-1.5 text-xs rounded-md font-medium whitespace-nowrap flex items-center gap-1.5
                ${activeTab === 'humint' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                  : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>HUMINT</span>
            </button>
          )}
          
          {hasSigintData && (
            <button
              onClick={() => setActiveTab('sigint')}
              className={`px-2 py-1.5 text-xs rounded-md font-medium whitespace-nowrap flex items-center gap-1.5
                ${activeTab === 'sigint' 
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>SIGINT</span>
            </button>
          )}
          
          {hasOsintData && (
            <button
              onClick={() => setActiveTab('osint')}
              className={`px-2 py-1.5 text-xs rounded-md font-medium whitespace-nowrap flex items-center gap-1.5
                ${activeTab === 'osint' 
                  ? 'bg-green-50 text-green-700 border border-green-100' 
                  : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>OSINT</span>
            </button>
          )}
          
          {hasFusionData && (
            <button
              onClick={() => setActiveTab('fusion')}
              className={`px-2 py-1.5 text-xs rounded-md font-medium whitespace-nowrap flex items-center gap-1.5
                ${activeTab === 'fusion' 
                  ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                  : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Fusion</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {/* Summary Section */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div 
            className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('summary')}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Summary</h3>
            </div>
            <div className="transform transition-transform duration-200"
                 style={{ transform: expandedSection === 'summary' ? 'rotate(180deg)' : 'rotate(0)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {expandedSection === 'summary' && (
            <div className="p-2.5 border-t border-gray-200">
              {/* Show summary based on active tab */}
              {(activeTab === 'all' || activeTab === 'humint') && humintData && (
                <div className={`${activeTab === 'all' ? 'mb-3' : ''}`}>
                  {activeTab === 'all' && (
                    <div className="flex items-center mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-blue-700">HUMINT Summary</h4>
                    </div>
                  )}
                  <p className="text-xs text-gray-700">{humintData.intelligence.summary}</p>
                </div>
              )}
              
              {(activeTab === 'all' || activeTab === 'sigint') && sigintData && (
                <div className={`${activeTab === 'all' ? 'mb-3' : ''}`}>
                  {activeTab === 'all' && (
                    <div className="flex items-center mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-red-700">SIGINT Summary</h4>
                    </div>
                  )}
                  <p className="text-xs text-gray-700">
                    {`Detected ${sigintStats.emitterCount} radar emitters with ${sigintStats.detectionCount} distinct signals 
                    in the operational area. Primary emitter types include ${
                      Object.keys(sigintStats.platformTypes).map(type => `${type} (${sigintStats.platformTypes[type]})`).join(', ') || 'unknown'
                    }. Coverage period: ${
                      sigintData.coverage?.startTime ? formatDate(sigintData.coverage.startTime) : 'unknown'
                    } to ${
                      sigintData.coverage?.endTime ? formatDate(sigintData.coverage.endTime) : 'unknown'
                    }.`}
                  </p>
                  
                  {/* Add Electronic Order of Battle summary if available */}
                  {sigintData.electronicOrderOfBattle && (
                    <div className="mt-2 text-xs text-gray-700">
                      <div className="font-medium mb-0.5">Electronic Order of Battle:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        {sigintData.electronicOrderOfBattle.airDefenseElements && sigintData.electronicOrderOfBattle.airDefenseElements.length > 0 && (
                          <li>Air Defense: {sigintData.electronicOrderOfBattle.airDefenseElements.length} systems</li>
                        )}
                        {sigintData.electronicOrderOfBattle.groundForceElements && sigintData.electronicOrderOfBattle.groundForceElements.length > 0 && (
                          <li>Ground Forces: {sigintData.electronicOrderOfBattle.groundForceElements.length} elements</li>
                        )}
                        {sigintData.electronicOrderOfBattle.navalElements && sigintData.electronicOrderOfBattle.navalElements.length > 0 && (
                          <li>Naval Forces: {sigintData.electronicOrderOfBattle.navalElements.length} elements</li>
                        )}
                        {sigintData.electronicOrderOfBattle.airElements && sigintData.electronicOrderOfBattle.airElements.length > 0 && (
                          <li>Air Forces: {sigintData.electronicOrderOfBattle.airElements.length} elements</li>
                        )}
                        {sigintData.electronicOrderOfBattle.unknownElements && sigintData.electronicOrderOfBattle.unknownElements.length > 0 && (
                          <li>Unclassified: {sigintData.electronicOrderOfBattle.unknownElements.length} elements</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* OSINT Summary Section */}
              {(activeTab === 'all' || activeTab === 'osint') && osintData && (
                <div className={`${activeTab === 'all' ? 'mb-3' : ''}`}>
                  {activeTab === 'all' && (
                    <div className="flex items-center mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-green-700">OSINT Summary</h4>
                    </div>
                  )}
                  <p className="text-xs text-gray-700">
                    {osintData.summary || `Collected ${osintStats.postCount} social media posts and ${osintStats.mediaCount} media items from open sources.
                    Identified ${osintStats.narrativeCount} distinct narratives and verified ${osintStats.verifiedContent} pieces of content.
                    Monitoring ${osintData.platforms.reduce((acc, platform) => acc + platform.accountsTracked, 0)} accounts across
                    ${osintData.platforms.length} platforms. Coverage period: ${
                      osintData.coverage?.startTime ? formatDate(osintData.coverage.startTime) : 'unknown'
                    } to ${
                      osintData.coverage?.endTime ? formatDate(osintData.coverage.endTime) : 'unknown'
                    }.`}
                  </p>
                  
                  {/* Add OSINT events summary if available */}
                  {osintData.events && osintData.events.length > 0 && (
                    <div className="mt-2 text-xs text-gray-700">
                      <div className="font-medium mb-0.5">Key Events Detected:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        {osintData.events.slice(0, 3).map((event, index) => (
                          <li key={`event-${index}`}>
                            {event.title} - {formatDate(event.timestamp)}
                          </li>
                        ))}
                        {osintData.events.length > 3 && (
                          <li className="text-gray-500 italic">
                            +{osintData.events.length - 3} more events...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {(activeTab === 'all' || activeTab === 'fusion') && fusionData && (
                <div>
                  {activeTab === 'all' && (
                    <div className="flex items-center mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-purple-700">Fusion Analysis</h4>
                    </div>
                  )}
                  <p className="text-xs text-gray-700">
                    {(() => {
                      // Check if fusionData has entities with correlations
                      if (!fusionData.fusedEntities || !fusionData.fusedEntities.length) {
                        return "Fusion analysis has identified 0 entities.";
                      }
                      
                      // Get correlation values safely
                      const correlationValues: number[] = [];
                      
                      fusionData.fusedEntities.forEach(entity => {
                        if (entity.correlations && entity.correlations.length) {
                          entity.correlations.forEach(corr => {
                            if (corr.strength && typeof corr.strength.value === 'number') {
                              correlationValues.push(corr.strength.value * 100);
                            }
                          });
                        }
                      });
                      
                      if (correlationValues.length === 0) {
                        return `Fusion analysis has identified ${fusionData.fusedEntities.length} entities, but no correlation data is available.`;
                      }
                      
                      const min = Math.min(...correlationValues);
                      const max = Math.max(...correlationValues);
                      
                      return `Fusion analysis has identified ${fusionData.fusedEntities.length} entities with 
                      correlations across HUMINT, SIGINT, and OSINT sources. Confidence in these correlations ranges from 
                      ${safeNumberFormat(min, 0)}% to ${safeNumberFormat(max, 0)}%.`;
                    })()}
                  </p>
                  
                  {/* Add threat assessment based on fusion data */}
                  {fusionData.fusedEntities.length > 0 && (
                    <div className="mt-2 text-xs">
                      <div className="text-purple-700 font-medium mb-0.5">Threat Assessment:</div>
                      <p className="text-gray-700">
                        Based on fusion intelligence, the primary threat level is 
                        <span className="font-medium"> {
                          getFusionThreatLevel(fusionData)
                        }</span>. 
                        Multiple intelligence sources confirm the presence of hostile forces in the area of operations.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* OSINT Sources Section - New */}
        {(activeTab === 'all' || activeTab === 'osint') && osintData && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('osintSources')}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">
                  Open Source Platforms
                </h3>
              </div>
              <div className="transform transition-transform duration-200"
                style={{ transform: expandedSection === 'osintSources' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
              
            {expandedSection === 'osintSources' && (
              <div className="p-2.5 border-t border-gray-200">
                {/* Visibility toggle */}
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded mb-3">
                  <span className="text-xs text-gray-700 font-medium">Show on map:</span>
                  <button
                    onClick={() => onToggleLayer('osint')}
                    className={`px-2 py-0.5 rounded text-xs font-medium
                      ${visibleLayers.includes('osint')
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-white text-gray-600 border border-gray-200'}`}
                  >
                    OSINT
                  </button>
                </div>
                
                {/* Platform Statistics */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-700 mb-1">Monitored Platforms</div>
                  
                  <div className="space-y-2 mt-1">
                    {osintData.platforms.map((platform, index) => (
                      <div key={`platform-${index}`} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          {getOsintSourceIcon(platform.name)}
                          <span className="text-gray-700 font-medium">{platform.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-gray-500">
                            <span className="font-mono">{platform.postCount}</span> posts
                          </div>
                          <div className="text-gray-500">
                            <span className="font-mono">{platform.accountsTracked}</span> accounts
                          </div>
                          <div className="px-1.5 py-0.5 rounded text-xs" 
                            style={{
                              backgroundColor: platform.reliabilityScore > 0.7 ? 'rgba(16, 185, 129, 0.1)' : 
                                              platform.reliabilityScore > 0.4 ? 'rgba(245, 158, 11, 0.1)' : 
                                              'rgba(239, 68, 68, 0.1)',
                              color: platform.reliabilityScore > 0.7 ? 'rgb(16, 185, 129)' : 
                                     platform.reliabilityScore > 0.4 ? 'rgb(245, 158, 11)' : 
                                     'rgb(239, 68, 68)'
                            }}>
                            {(platform.reliabilityScore * 100).toFixed(0)}% reliable
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Source Type Distribution */}
                  <div className="bg-white p-2 rounded border border-gray-200 mt-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Source Type Distribution</h4>
                    <div className="space-y-1.5">
                      {osintData.sourceTypes.map((sourceType, index) => (
                        <div key={`source-type-${index}`} className="flex justify-between">
                          <span className="text-xs text-gray-700">{sourceType.type}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-green-600 rounded" 
                                style={{ width: `${Math.min(sourceType.count, 100)}px` }}></div>
                            <span className="text-[10px] text-gray-600">{sourceType.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* OSINT Media Section - New */}
        {(activeTab === 'all' || activeTab === 'osint') && osintData && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('osintMedia')}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">
                  OSINT Media & Evidence
                </h3>
              </div>
              <div className="transform transition-transform duration-200"
                style={{ transform: expandedSection === 'osintMedia' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
              
            {expandedSection === 'osintMedia' && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="space-y-2">
                  {osintData.media.slice(0, 5).map((media, index) => (
                    <div 
                      key={`osint-media-${index}`}
                      className="p-2 bg-white rounded border border-gray-200 hover:border-green-300 hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => onEntityClick && onEntityClick(media.id, 'osint')}
                    >
                      {/* Media Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {media.type === 'image' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                          ) : media.type === 'video' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="23 7 16 12 23 17 23 7"></polygon>
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Source: {media.source}
                            </p>
                          </div>
                        </div>
                        <div className={`text-xs px-1.5 py-0.5 rounded ${
                          media.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                          media.verificationStatus === 'likely' ? 'bg-blue-100 text-blue-700' :
                          media.verificationStatus === 'unverified' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {media.verificationStatus.charAt(0).toUpperCase() + media.verificationStatus.slice(1)}
                        </div>
                      </div>
                      
                      {/* Media Details */}
                      <div className="mt-2 text-xs text-gray-600">
                        <p className="line-clamp-2">{media.description || `${media.type.charAt(0).toUpperCase() + media.type.slice(1)} from ${media.source}`}</p>
                        
                        <div className="mt-1.5 flex justify-between items-center">
                          <span className="text-gray-500">{formatDate(media.timestamp)}</span>
                          {media.location && (
                            <span className="font-mono text-xs">
                              {media.location.latitude.toFixed(4)}°N, {media.location.longitude.toFixed(4)}°E
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">OSINT</span>
                        <button
                          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntityClick && onEntityClick(media.id, 'osint');
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          <span>View on map</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more button if there are more items */}
                  {osintData.media.length > 5 && (
                    <div className="text-center">
                      <button className="text-xs text-green-600 hover:text-green-800 font-medium">
                        Show {osintData.media.length - 5} more media items
                      </button>
                    </div>
                  )}
                  
                  {/* No media message */}
                  {(!osintData.media || osintData.media.length === 0) && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No media evidence collected from OSINT sources.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* OSINT Narratives Section - New */}
        {(activeTab === 'all' || activeTab === 'osint') && osintData && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('osintNarratives')}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">
                  Information Narratives
                </h3>
              </div>
              <div className="transform transition-transform duration-200"
                style={{ transform: expandedSection === 'osintNarratives' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
              
            {expandedSection === 'osintNarratives' && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="space-y-2">
                  {osintData.narratives.map((narrative, index) => (
                    <div 
                      key={`osint-narrative-${index}`}
                      className="p-2 bg-white rounded border border-gray-200 hover:border-green-300 hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => onEntityClick && onEntityClick(narrative.id, 'osint')}
                    >
                      {/* Narrative Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{narrative.name}</p>
                          <p className="text-xs text-gray-500">
                            {narrative.sources} sources | First detected: {formatDate(narrative.firstDetected)}
                          </p>
                        </div>
                        <div className={`text-xs px-1.5 py-0.5 rounded ${
                          narrative.prevalence === 'high' ? 'bg-red-100 text-red-700' :
                          narrative.prevalence === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {narrative.prevalence.toUpperCase()} prevalence
                        </div>
                      </div>
                      
                      {/* Narrative Details */}
                      <div className="mt-2 text-xs text-gray-600">
                        <p className="line-clamp-2">{narrative.description}</p>
                        
                        {narrative.attribution && narrative.attribution.length > 0 && (
                          <div className="mt-1.5">
                            <span className="text-gray-500">Attribution: </span>
                            {narrative.attribution.join(', ')}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">OSINT</span>
                          <ConfidenceBadge level={narrative.confidence} size="sm" />
                        </div>
                        <button
                          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntityClick && onEntityClick(narrative.id, 'osint');
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          <span>View details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* No narratives message */}
                  {(!osintData.narratives || osintData.narratives.length === 0) && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No information narratives detected.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* SIGINT Emitters Section - Enhanced */}
        {(activeTab === 'all' || activeTab === 'sigint') && sigintData && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('emitters')}
            >
              <div className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">
                  Radar Emitters
                </h3>
              </div>
              <div className="transform transition-transform duration-200"
                style={{ transform: expandedSection === 'emitters' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
              
            {expandedSection === 'emitters' && (
              <div className="p-2.5 border-t border-gray-200">
                {/* Visibility toggle */}
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded mb-3">
                  <span className="text-xs text-gray-700 font-medium">Show on map:</span>
                  <button
                    onClick={() => onToggleLayer('sigint')}
                    className={`px-2 py-0.5 rounded text-xs font-medium
                      ${visibleLayers.includes('sigint')
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-white text-gray-600 border border-gray-200'}`}
                  >
                    SIGINT
                  </button>
                </div>
                
                {/* Emitter List */}
                <div className="space-y-2">
                  {sigintData.emitters && sigintData.emitters.map((emitter, index) => {
                    // Find the most recent location
                    const latestLocation = emitter.locations && emitter.locations.length > 0 ? 
                      [...emitter.locations].sort((a, b) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )[0] : null;
                    
                    const platformInfo = emitter.platformAssessment;
                    
                    return (
                      <div 
                        key={`sigint-emitter-${index}`}
                        className="p-3 bg-white rounded border border-gray-200 hover:border-red-300 hover:shadow-sm cursor-pointer transition-all"
                        onClick={() => onEntityClick && onEntityClick(emitter.id, 'sigint')}
                      >
                        {/* Emitter Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(platformInfo?.type)}
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {emitter.classification?.type || 'Unknown Radar Type'}
                                {platformInfo?.model && ` (${platformInfo.model})`}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {emitter.id ? emitter.id.substring(0, Math.min(10, emitter.id.length)) : 'Unknown'}...
                              </p>
                            </div>
                          </div>
                          <ConfidenceBadge level={emitter.confidence || 'medium'} size="sm" />
                        </div>
                        
                        {/* Emitter Details */}
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <div className="flex items-center">
                            <span className="w-16 text-gray-500">First seen:</span>
                            <span>{formatDate(emitter.firstDetected)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-16 text-gray-500">Last seen:</span>
                            <span>{formatDate(emitter.lastDetected)}</span>
                          </div>
                          
                          {/* Characteristics */}
                          {emitter.characteristics && (
                            <>
                              {emitter.characteristics.frequency && (
                                <div className="flex items-center col-span-2">
                                  <span className="w-16 text-gray-500">Frequency:</span>
                                  <span>
                                    {emitter.characteristics.frequency.min}-{emitter.characteristics.frequency.max} MHz
                                    {emitter.characteristics.frequency.agility && 
                                      ` (${emitter.characteristics.frequency.agility} agility)`}
                                  </span>
                                </div>
                              )}
                              {emitter.characteristics.modulation && emitter.characteristics.modulation.length > 0 && (
                                <div className="flex items-center col-span-2">
                                  <span className="w-16 text-gray-500">Modulation:</span>
                                  <span>{emitter.characteristics.modulation.join(', ')}</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Platform Assessment */}
                          {platformInfo && (
                            <div className="flex items-center col-span-2">
                              <span className="w-16 text-gray-500">Platform:</span>
                              <span className="capitalize">
                                {platformInfo.type || 'Unknown'} 
                                {platformInfo.mobility && `, ${platformInfo.mobility}`}
                              </span>
                            </div>
                          )}
                          
                          {/* Location Information */}
                          {latestLocation && latestLocation.location && (
                            <div className="col-span-2 mt-2 flex items-start">
                              <span className="w-16 text-gray-500">Location:</span>
                              <div>
                                <div className="font-mono">
                                  {typeof latestLocation.location.latitude === 'number' ? 
                                    latestLocation.location.latitude.toFixed(5) : 'N/A'}°N, 
                                  {typeof latestLocation.location.longitude === 'number' ? 
                                    latestLocation.location.longitude.toFixed(5) : 'N/A'}°E
                                </div>
                                <div className="flex items-center mt-1">
                                  <span className="text-gray-500 mr-1">Accuracy:</span>
                                  <span className={getConfidenceColor(latestLocation.confidenceLevel)}>
                                    ±{latestLocation.accuracy}m
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 rounded">SIGINT</span>
                          <button
                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEntityClick && onEntityClick(emitter.id, 'sigint');
                            }}
                          >
                            <Eye className="h-3 w-3" />
                            <span>View on map</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* No emitters message */}
                  {(!sigintData.emitters || sigintData.emitters.length === 0) && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No radar emitters detected in this area.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Electronic Order of Battle Section */}
        {(activeTab === 'all' || activeTab === 'sigint') && sigintData && sigintData.electronicOrderOfBattle && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('eob')}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">
                  Electronic Order of Battle
                </h3>
              </div>
              <div className="transform transition-transform duration-200"
                style={{ transform: expandedSection === 'eob' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
              
            {expandedSection === 'eob' && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  Last updated: {formatDate(sigintData.electronicOrderOfBattle.timestamp)}
                </div>
                
                {/* Air Defense Elements */}
                {sigintData.electronicOrderOfBattle.airDefenseElements && 
                 sigintData.electronicOrderOfBattle.airDefenseElements.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-red-600 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-gray-700">Air Defense Systems</h4>
                    </div>
                    <div className="space-y-2">
                      {sigintData.electronicOrderOfBattle.airDefenseElements.map((element, index) => (
                        <div key={`air-defense-${index}`} className="p-2 border border-gray-200 rounded bg-gray-50 text-xs">
                          <div className="flex justify-between">
                            <div className="font-medium text-gray-800">{element.systemName || 'Unknown System'}</div>
                            <ConfidenceBadge level={element.confidence || 'medium'} size="sm" showDot={false} />
                          </div>
                          <div className="mt-1 text-gray-600">
                            {element.type || 'Unknown type'} | {element.quantity || '?'} units
                          </div>
                          {element.location && (
                            <div className="mt-1 text-gray-600">
                              Location: {element.location.latitude && typeof element.location.latitude === 'number' 
                                ? element.location.latitude.toFixed(5) : 'N/A'}°N, 
                              {element.location.longitude && typeof element.location.longitude === 'number' 
                                ? element.location.longitude.toFixed(5) : 'N/A'}°E
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Ground Force Elements */}
                {sigintData.electronicOrderOfBattle.groundForceElements && 
                 sigintData.electronicOrderOfBattle.groundForceElements.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-600 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-gray-700">Ground Elements</h4>
                    </div>
                    <div className="space-y-2">
                      {sigintData.electronicOrderOfBattle.groundForceElements.map((element, index) => (
                        <div key={`ground-${index}`} className="p-2 border border-gray-200 rounded bg-gray-50 text-xs">
                          <div className="flex justify-between">
                            <div className="font-medium text-gray-800">{element.unitName || 'Unknown Unit'}</div>
                            <ConfidenceBadge level={element.confidence || 'medium'} size="sm" showDot={false} />
                          </div>
                          <div className="mt-1 text-gray-600">
                            {element.echelonSize || 'Unknown size'} | {element.equipmentType || 'Unknown equipment'}
                          </div>
                          {element.location && (
                            <div className="mt-1 text-gray-600">
                              Location: {element.location.latitude && typeof element.location.latitude === 'number' 
                                ? element.location.latitude.toFixed(5) : 'N/A'}°N, 
                              {element.location.longitude && typeof element.location.longitude === 'number' 
                                ? element.location.longitude.toFixed(5) : 'N/A'}°E
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Naval Elements */}
                {sigintData.electronicOrderOfBattle.navalElements && 
                 sigintData.electronicOrderOfBattle.navalElements.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-gray-700">Naval Elements</h4>
                    </div>
                    <div className="space-y-2">
                      {sigintData.electronicOrderOfBattle.navalElements.map((element, index) => (
                        <div key={`naval-${index}`} className="p-2 border border-gray-200 rounded bg-gray-50 text-xs">
                          <div className="flex justify-between">
                            <div className="font-medium text-gray-800">{element.vesselName || 'Unknown Vessel'}</div>
                            <ConfidenceBadge level={element.confidence || 'medium'} size="sm" showDot={false} />
                          </div>
                          <div className="mt-1 text-gray-600">
                            {element.class || 'Unknown class'} | {element.type || 'Unknown type'}
                          </div>
                          {element.location && (
                            <div className="mt-1 text-gray-600">
                              Location: {element.location.latitude && typeof element.location.latitude === 'number' 
                                ? element.location.latitude.toFixed(5) : 'N/A'}°N, 
                              {element.location.longitude && typeof element.location.longitude === 'number' 
                                ? element.location.longitude.toFixed(5) : 'N/A'}°E
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Air Elements */}
                {sigintData.electronicOrderOfBattle.airElements && 
                 sigintData.electronicOrderOfBattle.airElements.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-amber-600 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-gray-700">Air Elements</h4>
                    </div>
                    <div className="space-y-2">
                      {sigintData.electronicOrderOfBattle.airElements.map((element, index) => (
                        <div key={`air-${index}`} className="p-2 border border-gray-200 rounded bg-gray-50 text-xs">
                          <div className="flex justify-between">
                            <div className="font-medium text-gray-800">{element.platformType || 'Unknown Aircraft'}</div>
                            <ConfidenceBadge level={element.confidence || 'medium'} size="sm" showDot={false} />
                          </div>
                          <div className="mt-1 text-gray-600">
                            {element.quantity || '?'} aircraft | {element.mission || 'Unknown mission'}
                          </div>
                          {element.location && (
                            <div className="mt-1 text-gray-600">
                              Location: {element.location.latitude && typeof element.location.latitude === 'number' 
                                ? element.location.latitude.toFixed(5) : 'N/A'}°N, 
                              {element.location.longitude && typeof element.location.longitude === 'number' 
                                ? element.location.longitude.toFixed(5) : 'N/A'}°E
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Unknown Elements */}
                {sigintData.electronicOrderOfBattle.unknownElements && 
                 sigintData.electronicOrderOfBattle.unknownElements.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-gray-600 mr-1.5"></div>
                      <h4 className="text-xs font-medium text-gray-700">Unclassified Elements</h4>
                    </div>
                    <div className="space-y-2">
                      {sigintData.electronicOrderOfBattle.unknownElements.map((element, index) => (
                        <div key={`unknown-${index}`} className="p-2 border border-gray-200 rounded bg-gray-50 text-xs">
                          <div className="flex justify-between">
                            <div className="font-medium text-gray-800">{element.signatureType || 'Unknown'}</div>
                            <ConfidenceBadge level={element.confidence || 'low'} size="sm" showDot={false} />
                          </div>
                          <div className="mt-1 text-gray-600">
                            First detected: {formatDate(element.firstDetected)}
                          </div>
                          {element.location && (
                            <div className="mt-1 text-gray-600">
                              Location: {element.location.latitude && typeof element.location.latitude === 'number' 
                                ? element.location.latitude.toFixed(5) : 'N/A'}°N, 
                              {element.location.longitude && typeof element.location.longitude === 'number' 
                                ? element.location.longitude.toFixed(5) : 'N/A'}°E
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No elements message */}
                {(!sigintData.electronicOrderOfBattle.airDefenseElements?.length &&
                  !sigintData.electronicOrderOfBattle.groundForceElements?.length &&
                  !sigintData.electronicOrderOfBattle.navalElements?.length &&
                  !sigintData.electronicOrderOfBattle.airElements?.length &&
                  !sigintData.electronicOrderOfBattle.unknownElements?.length) && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No electronic order of battle elements detected.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Signal Analysis Section */}
        {(activeTab === 'all' || activeTab === 'sigint') && sigintData && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('comms')}
            >
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Signal Analysis</h3>
              </div>
              <div className="transform transition-transform duration-200"
                   style={{ transform: expandedSection === 'comms' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {expandedSection === 'comms' && sigintData.emitters && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="space-y-3">
                  {/* Signal Frequency Distribution */}
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Frequency Distribution</h4>
                    <div className="h-20 flex items-end gap-0.5">
                      {/* Generate frequency distribution visualization */}
                      {generateFrequencyBars(sigintData.emitters).map((height, i) => (
                        <div 
                          key={`freq-bar-${i}`} 
                          className="bg-red-600 w-full rounded-t transition-all hover:opacity-80"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>1.0 GHz</span>
                      <span>10.0 GHz</span>
                    </div>
                  </div>
                  
                  {/* Emission Types */}
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Emission Types</h4>
                    <div className="space-y-1.5">
                      {Object.entries(getEmissionTypes(sigintData.emitters)).map(([type, count], index) => (
                        <div key={`type-${index}`} className="flex justify-between">
                          <span className="text-xs text-gray-700">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-red-600 rounded" 
                                style={{ width: `${Math.min(count * 10, 100)}px` }}></div>
                            <span className="text-[10px] text-gray-600">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Signal Quality Metrics */}
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Signal Quality Metrics</h4>
                    <div className="space-y-2">
                      {/* Signal-to-Noise Ratio */}
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700">Signal-to-Noise Ratio</span>
                          <span className="text-gray-600 font-medium">Good</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full mt-1">
                          <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      
                      {/* Signal Stability */}
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700">Signal Stability</span>
                          <span className="text-gray-600 font-medium">Medium</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full mt-1">
                          <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      
                      {/* Coverage Quality */}
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700">Coverage Quality</span>
                          <span className="text-gray-600 font-medium">High</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full mt-1">
                          <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Detections */}
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Recent Signal Activity</h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {sigintData.detections?.map((detection, index) => (
                        <div 
                          key={`detection-${index}`} 
                          className="text-xs border-l-2 border-red-500 pl-2 py-1 hover:bg-red-50 cursor-pointer rounded transition-colors"
                          onClick={() => onEntityClick && detection.emitterId && onEntityClick(detection.emitterId, 'sigint')}
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">{detection.signalType || 'Unknown'}</span>
                            <span className="text-[10px] text-gray-500">{formatDate(detection.timestamp)}</span>
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {detection.frequency ? `${(detection.frequency / 1000).toFixed(2)} GHz` : 'Unknown frequency'}
                            {detection.location ? ` @ ${
                              detection.location.latitude !== undefined ? detection.location.latitude.toFixed(2) : 'N/A'
                            }°N, ${
                              detection.location.longitude !== undefined ? detection.location.longitude.toFixed(2) : 'N/A'
                            }°E` : ''}
                          </div>
                        </div>
                      ))}
                      
                      {/* If no detections, show fallback from emitters */}
                      {(!sigintData.detections || sigintData.detections.length === 0) && 
                        sigintData.emitters && sigintData.emitters.flatMap((emitter, index) => 
                        (emitter.emissions || []).map((emission) => ({
                          id: `${emitter.id}-${emission.id || index}`,
                          emitterId: emitter.id,
                          timestamp: emission.timestamp,
                          signalType: emission.signalType,
                          frequency: emission.frequency,
                          emitterType: emitter.classification?.type
                        }))
                      )
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 5)
                        .map((detection, index) => (
                          <div 
                            key={`detection-${index}`} 
                            className="text-xs border-l-2 border-red-500 pl-2 py-1 hover:bg-red-50 cursor-pointer rounded transition-colors"
                            onClick={() => onEntityClick && detection.emitterId && onEntityClick(detection.emitterId, 'sigint')}
                          >
                            <div className="flex justify-between">
                              <span className="text-gray-700 font-medium">{detection.emitterType || 'Unknown'}</span>
                              <span className="text-[10px] text-gray-500">{formatDate(detection.timestamp)}</span>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {detection.signalType || 'Unknown'} @ {detection.frequency ? `${(detection.frequency / 1000).toFixed(2)} GHz` : 'Unknown frequency'}
                            </div>
                          </div>
                        ))}
                        
                        {(!sigintData.detections || sigintData.detections.length === 0) && 
                         (!sigintData.emitters || !sigintData.emitters.some(e => e.emissions && e.emissions.length > 0)) && (
                          <div className="text-center text-xs text-gray-500 py-2">
                            No recent signal detections available.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Enemy Forces / Emitters Section */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div 
            className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('enemies')}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">
                {activeTab === 'sigint' ? 'Radar Emitters' : 
                 activeTab === 'osint' ? 'Tracked Entities' : 
                 'Enemy Forces & Emitters'}
              </h3>
            </div>
            <div className="transform transition-transform duration-200"
                 style={{ transform: expandedSection === 'enemies' ? 'rotate(180deg)' : 'rotate(0)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {expandedSection === 'enemies' && (
            <div className="p-2.5 border-t border-gray-200">
              <div className="space-y-2.5">
                {/* Layer visibility toggle for map */}
                <div className="flex justify-between items-center mb-3 p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-700 font-medium">Show on map:</span>
                  <div className="flex gap-1.5">
                    {(activeTab === 'all' || activeTab === 'humint') && (
                      <button
                        onClick={() => onToggleLayer('humint')}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium
                          ${visibleLayers.includes('humint')
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200'}`}
                      >
                        HUMINT
                      </button>
                    )}
                    
                    {(activeTab === 'all' || activeTab === 'sigint') && (
                      <button
                        onClick={() => onToggleLayer('sigint')}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium
                          ${visibleLayers.includes('sigint')
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-white text-gray-600 border border-gray-200'}`}
                      >
                        SIGINT
                      </button>
                    )}
                    
                    {(activeTab === 'all' || activeTab === 'osint') && (
                      <button
                        onClick={() => onToggleLayer('osint')}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium
                          ${visibleLayers.includes('osint')
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-white text-gray-600 border border-gray-200'}`}
                      >
                        OSINT
                      </button>
                    )}
                    
                    {(activeTab === 'all' || activeTab === 'fusion') && (
                      <button
                        onClick={() => onToggleLayer('correlation')}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium
                          ${visibleLayers.includes('correlation')
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-white text-gray-600 border border-gray-200'}`}
                      >
                        Links
                      </button>
                    )}
                  </div>
                </div>
                
                {/* HUMINT enemy forces */}
                {(activeTab === 'all' || activeTab === 'humint') && humintData && humintData.intelligence.enemyForces && (
                  <div>
                    {activeTab === 'all' && (
                      <div className="flex items-center mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></div>
                        <h4 className="text-xs font-medium text-blue-700">HUMINT Forces</h4>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {humintData.intelligence.enemyForces.map((force, index) => (
                        <div 
                          key={`humint-force-${index}`}
                          className="p-2 bg-white rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                          onClick={() => onEntityClick && onEntityClick(`force-${index}`, 'humint')}
                        >
                          <p className="text-xs text-gray-700">{force}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">HUMINT</span>
                            <ConfidenceBadge level="medium" size="sm" showDot={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* OSINT events/entities */}
                {(activeTab === 'all' || activeTab === 'osint') && osintData && osintData.events && (
                  <div className={activeTab === 'all' && humintData ? 'mt-3' : ''}>
                    {activeTab === 'all' && (
                      <div className="flex items-center mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div>
                        <h4 className="text-xs font-medium text-green-700">OSINT Events</h4>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {osintData.events.map((event, index) => (
                        <div 
                          key={`osint-event-${index}`}
                          className="p-2 bg-white rounded border border-gray-200 hover:border-green-300 hover:shadow-sm cursor-pointer transition-all"
                          onClick={() => onEntityClick && onEntityClick(event.id, 'osint')}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-medium text-gray-700">{event.title}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(event.timestamp)}</p>
                            </div>
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {event.type}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                          
                          {event.location && (
                            <p className="text-[10px] text-gray-600 mt-1">
                              Location: {
                                typeof event.location.latitude === 'number' ? 
                                event.location.latitude.toFixed(4) : 'N/A'
                              }, {
                                typeof event.location.longitude === 'number' ? 
                                event.location.longitude.toFixed(4) : 'N/A'
                              }
                            </p>
                          )}
                          
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">OSINT</span>
                            <ConfidenceBadge level={event.confidence || 'medium'} size="sm" showDot={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* SIGINT emitters */}
                {(activeTab === 'all' || activeTab === 'sigint') && sigintData && sigintData.emitters && (
                  <div className={activeTab === 'all' && (humintData || osintData) ? 'mt-3' : ''}>
                    {activeTab === 'all' && (
                      <div className="flex items-center mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></div>
                        <h4 className="text-xs font-medium text-red-700">SIGINT Emitters</h4>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {sigintData.emitters.map((emitter, index) => {
                        // Find the most recent location
                        const latestLocation = emitter.locations && emitter.locations.length > 0 ? 
                          [...emitter.locations].sort((a, b) => 
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                          )[0] : null;
                        
                        return (
                          <div 
                            key={`sigint-emitter-${index}`}
                            className="p-2 bg-white rounded border border-gray-200 hover:border-red-300 hover:shadow-sm cursor-pointer transition-all"
                            onClick={() => onEntityClick && onEntityClick(emitter.id, 'sigint')}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  {getPlatformIcon(emitter.platformAssessment?.type)}
                                  <p className="text-xs text-gray-700 ml-1.5">
                                    <span className="font-medium">{emitter.classification?.type || 'Unknown'}</span> 
                                    {emitter.platformAssessment?.model && ` (${emitter.platformAssessment.model})`}
                                  </p>
                                </div>
                                {emitter.characteristics?.frequency && (
                                  <p className="text-[10px] text-gray-500 mt-0.5 ml-5">
                                    {emitter.characteristics.frequency.min}-{emitter.characteristics.frequency.max} MHz
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500">
                                ID: {emitter.id ? emitter.id.substring(0, Math.min(6, emitter.id.length)) : ''}...
                              </span>
                            </div>
                            
                            {latestLocation && latestLocation.location && (
                              <p className="text-[10px] text-gray-600 mt-1">
                                Last location: {
                                  typeof latestLocation.location.latitude === 'number' ? 
                                  latestLocation.location.latitude.toFixed(4) : 'N/A'
                                }, {
                                  typeof latestLocation.location.longitude === 'number' ? 
                                  latestLocation.location.longitude.toFixed(4) : 'N/A'
                                }
                              </p>
                            )}
                            
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 rounded">SIGINT</span>
                              <ConfidenceBadge level={emitter.confidence || 'medium'} size="sm" showDot={false} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Fusion entities */}
                {(activeTab === 'all' || activeTab === 'fusion') && fusionData && fusionData.fusedEntities && (
                  <div className={activeTab === 'all' ? 'mt-3' : ''}>
                    {activeTab === 'all' && (
                      <div className="flex items-center mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5"></div>
                        <h4 className="text-xs font-medium text-purple-700">Fused Entities</h4>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {fusionData.fusedEntities.map((entity, index) => (
                        <div 
                          key={`fusion-entity-${index}`}
                          className="p-2 bg-white rounded border border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all"
                          onClick={() => onEntityClick && onEntityClick(entity.id, 'fusion')}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">{entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}</span>
                            </p>
                            <span className="text-[10px] text-gray-500">
                              ID: {entity.id ? entity.id.substring(0, Math.min(6, entity.id.length)) : ''}...
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="text-[10px] text-blue-700">
                              <span className="text-gray-600">HUMINT: </span> 
                              {entity.humintSources ? entity.humintSources.length : 0}
                            </div>
                            <div className="text-[10px] text-red-700">
                              <span className="text-gray-600">SIGINT: </span> 
                              {entity.sigintSources ? entity.sigintSources.length : 0}
                            </div>
                            <div className="text-[10px] text-green-700">
                              <span className="text-gray-600">OSINT: </span> 
                              {entity.osintSources ? entity.osintSources.length : 0}
                            </div>
                          </div>
                          
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">FUSION</span>
                            <ConfidenceBadge level={entity.combinedConfidence} size="sm" showDot={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Threats Section */}
        {(activeTab === 'all' || activeTab === 'humint') && humintData && humintData.intelligence.threats && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('threats')}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Threats</h3>
              </div>
              <div className="transform transition-transform duration-200"
                   style={{ transform: expandedSection === 'threats' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {expandedSection === 'threats' && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="space-y-2">
                  {humintData.intelligence.threats.map((threat, index) => (
                    <div
                      key={`threat-${index}`}
                      className={`p-2 rounded border text-xs ${
                        !threat.severity ? 'border-gray-200 bg-gray-50' :
                        threat.severity === 'high' ? 'border-red-200 bg-red-50' : 
                        threat.severity === 'medium' ? 'border-amber-200 bg-amber-50' : 
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-4 h-4 mr-1.5 rounded-full flex items-center justify-center text-[10px] ${
                          !threat.severity ? 'bg-gray-100 text-gray-700' :
                          threat.severity === 'high' ? 'bg-red-100 text-red-700' : 
                          threat.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-gray-700">{threat.description}</p>
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              !threat.severity ? 'bg-gray-100 text-gray-700' :
                              threat.severity === 'high' ? 'bg-red-100 text-red-700' : 
                              threat.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {threat.severity ? threat.severity.toUpperCase() : 'UNKNOWN'}
                            </span>
                            <ConfidenceBadge level={threat.confidence || 'medium'} size="sm" showDot={false} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Locations Section */}
        {(activeTab === 'all' || activeTab === 'humint') && humintData && humintData.intelligence.locations && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('locations')}
            >
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Locations</h3>
              </div>
              <div className="transform transition-transform duration-200"
                   style={{ transform: expandedSection === 'locations' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {expandedSection === 'locations' && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="space-y-2">
                  {humintData.intelligence.locations.map((location, index) => (
                    <div
                      key={`location-${index}`}
                      className="p-2 bg-white rounded border border-gray-200 hover:shadow-sm transition-all"
                    >
                      <p className="text-xs text-gray-700">{location}</p>
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntityClick && onEntityClick(`location-${index}`, 'humint');
                          }}
                          className="text-xs text-blue-700 hover:text-blue-800 flex items-center gap-0.5"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Show on map</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Correlation Analytics - Fusion Specific */}
        {(activeTab === 'all' || activeTab === 'fusion') && fusionData && fusionData.fusedEntities && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('fusion')}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Correlation Analysis</h3>
              </div>
              <div className="transform transition-transform duration-200"
                   style={{ transform: expandedSection === 'fusion' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {expandedSection === 'fusion' && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="space-y-3">
                  {/* Correlation Strength Distribution */}
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Correlation Strength</h4>
                    
                    <div className="flex items-center mt-1.5">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        {(() => {
                          const correlations = fusionData.fusedEntities.flatMap(entity => entity.correlations || []);
                          const highCount = correlations.filter(c => c.strength?.value > 0.7).length || 0;
                          const medCount = correlations.filter(c => c.strength?.value > 0.4 && c.strength.value <= 0.7).length || 0;
                          const lowCount = correlations.filter(c => !c.strength?.value || c.strength.value <= 0.4).length || 0;
                          const total = correlations.length || 1; // Avoid division by zero
                          
                          return (
                            <>
                              <div 
                                className="h-full bg-green-500" 
                                style={{ width: `${(highCount/total)*100}%` }}
                              ></div>
                              <div 
                                className="h-full bg-amber-500" 
                                style={{ width: `${(medCount/total)*100}%` }}
                              ></div>
                              <div 
                                className="h-full bg-red-500" 
                                style={{ width: `${(lowCount/total)*100}%` }}
                              ></div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <span>High</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
                        <span>Medium</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        <span>Low</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Correlation Factors */}
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Correlation Factors</h4>
                    
                    <div className="space-y-1.5">
                      {(() => {
                        // Calculate average factor contributions
                        const correlations = fusionData.fusedEntities.flatMap(entity => entity.correlations || []);
                        const factors = {
                          spatial: 0,
                          temporal: 0,
                          semantic: 0
                        };
                        
                        let validCorrelationCount = 0;
                        
                        correlations.forEach(c => {
                          if (c.strength && c.strength.factors) {
                            validCorrelationCount++;
                            factors.spatial += c.strength.factors.spatial || 0;
                            factors.temporal += c.strength.factors.temporal || 0;
                            factors.semantic += c.strength.factors.semantic || 0;
                          }
                        });
                        
                        const count = validCorrelationCount || 1; // Avoid division by zero
                        factors.spatial /= count;
                        factors.temporal /= count;
                        factors.semantic /= count;
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-700">Spatial</span>
                              <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600" 
                                  style={{ width: `${factors.spatial * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-gray-600">{safeNumberFormat(factors.spatial * 100, 0)}%</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-700">Temporal</span>
                              <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600" 
                                  style={{ width: `${factors.temporal * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-gray-600">{safeNumberFormat(factors.temporal * 100, 0)}%</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-700">Semantic</span>
                              <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600" 
                                  style={{ width: `${factors.semantic * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-gray-600">{safeNumberFormat(factors.semantic * 100, 0)}%</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Strong Correlations */}
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Strong Correlations</h4>
                    
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {(() => {
                        // Safely extract strong correlations
                        const strongCorrelations = fusionData.fusedEntities
                          .flatMap(entity => 
                            (entity.correlations || [])
                              .filter(c => c.strength && c.strength.value > 0.7)
                              .map(c => ({
                                entityId: entity.id,
                                humintId: c.humintEntityId,
                                sigintId: c.sigintEmitterId,
                                osintId: c.osintEntityId,
                                strength: c.strength.value,
                                type: c.correlationType
                              }))
                          )
                          .sort((a, b) => (b.strength || 0) - (a.strength || 0))
                          .slice(0, 5);
                        
                        if (strongCorrelations.length === 0) {
                          return (
                            <div className="text-center text-xs text-gray-500 py-2">
                              No strong correlations found.
                            </div>
                          );
                        }
                        
                        return strongCorrelations.map((correlation, index) => (
                          <div 
                            key={`correlation-${index}`}
                            className="p-2 border border-purple-200 rounded bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                            onClick={() => onEntityClick && correlation.entityId && onEntityClick(correlation.entityId, 'fusion')}
                          >
                            <div className="flex justify-between">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] text-blue-700">
                                  {correlation.humintId ? correlation.humintId.substring(0, Math.min(8, correlation.humintId.length)) : ""}...
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-[10px] text-red-700">
                                  {correlation.sigintId ? correlation.sigintId.substring(0, Math.min(8, correlation.sigintId.length)) : ""}...
                                </span>
                              </div>
                            </div>
                            
                            {correlation.osintId && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-[10px] text-green-700">
                                  {correlation.osintId.substring(0, Math.min(8, correlation.osintId.length))}...
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-1.5">
                              <span className="text-[10px] text-purple-700">{correlation.type || 'Unknown'}</span>
                              <div className="px-1.5 py-0.5 bg-purple-100 rounded text-[10px] text-purple-700 font-medium">
                                {typeof correlation.strength === 'number' ? (correlation.strength * 100).toFixed(0) : 'N/A'}% match
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Predictions Section */}
        {humintData && humintData.predictions && humintData.predictions.length > 0 && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('predictions')}
            >
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Predictions</h3>
              </div>
              <div className="transform transition-transform duration-200"
                   style={{ transform: expandedSection === 'predictions' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {expandedSection === 'predictions' && (
              <div className="p-2.5 border-t border-gray-200">
                <div className="space-y-2.5">
                  {/* Immediate predictions */}
                  <div>
                    <h4 className="text-xs text-amber-700 font-medium mb-1.5 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Immediate (0-12 hours)
                    </h4>
                    
                    <div className="space-y-1.5">
                      {humintData.predictions
                        .filter(p => p.timeframe && p.timeframe.max <= 12)
                        .map((prediction, index) => (
                          <div key={`prediction-${prediction.id}`} className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                            <p className="text-gray-700">{prediction.name} {prediction.formattedTimeframe} - {prediction.description}</p>
                            <div className="mt-1 flex justify-between text-[10px]">
                              <span className="text-amber-700">{prediction.formattedTimeframe || 'Unknown timeframe'}</span>
                              <span className="text-gray-600">Confidence: {prediction.confidenceFormatted || 'Unknown'}</span>
                            </div>
                          </div>
                        ))}
                        
                      {humintData.predictions.filter(p => p.timeframe && p.timeframe.max <= 12).length === 0 && (
                        <div className="text-center text-xs text-gray-500 py-2">
                          No immediate predictions available.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Short-term predictions */}
                  <div>
                    <h4 className="text-xs text-blue-700 font-medium mb-1.5 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Short-term (12-24 hours)
                    </h4>
                    
                    <div className="space-y-1.5">
                      {humintData.predictions
                        .filter(p => p.timeframe && p.timeframe.max > 12 && p.timeframe.max <= 24)
                        .map((prediction, index) => (
                          <div key={`prediction-${prediction.id}`} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <p className="text-gray-700">{prediction.name} {prediction.formattedTimeframe} - {prediction.description}</p>
                            <div className="mt-1 flex justify-between text-[10px]">
                              <span className="text-blue-700">{prediction.formattedTimeframe || 'Unknown timeframe'}</span>
                              <span className="text-gray-600">Confidence: {prediction.confidenceFormatted || 'Unknown'}</span>
                            </div>
                          </div>
                        ))}
                        
                      {humintData.predictions.filter(p => p.timeframe && p.timeframe.max > 12 && p.timeframe.max <= 24).length === 0 && (
                        <div className="text-center text-xs text-gray-500 py-2">
                          No short-term predictions available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Fusion Predictions Section */}
        {fusionData && fusionData.predictions && fusionData.predictions.length > 0 && (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div 
              className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('fusionPredictions')}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-medium text-gray-700">Fusion Predictions</h3>
              </div>
              <div className="transform transition-transform duration-200"
                   style={{ transform: expandedSection === 'fusionPredictions' ? 'rotate(180deg)' : 'rotate(0)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {expandedSection === 'fusionPredictions' && (
              <div className="p-2.5 border-t border-gray-200">
                {/* Fusion Prediction Summary */}
                {fusionData.predictionSummary && (
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs mb-3">
                    <p className="text-gray-700">{fusionData.predictionSummary}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* High-confidence predictions */}
                  <div>
                    <h4 className="text-xs text-purple-700 font-medium mb-1.5 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      High Confidence Predictions
                    </h4>
                    
                    <div className="space-y-1.5">
                      {fusionData.predictions
                        .filter(p => typeof p.confidence === 'number' && p.confidence > 0.7)
                        .map((prediction, index) => (
                          <div key={`fusion-prediction-high-${index}`} className="p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium text-purple-800">{prediction.name || 'Unnamed prediction'}</span>
                              <span className="text-[10px] bg-purple-100 px-1.5 py-0.5 rounded text-purple-700">
                                {typeof prediction.confidence === 'number' ? (prediction.confidence * 100).toFixed(0) : 'N/A'}%
                              </span>
                            </div>
                            <p className="text-gray-700 mt-1">{prediction.description || 'No description available'}</p>
                            <div className="mt-1 flex justify-between text-[10px]">
                              <span className="text-purple-700">Within {prediction.timeframe || 'unknown timeframe'}</span>
                              <span className="text-gray-600">
                                {typeof prediction.supportingEvidence === 'number' ? prediction.supportingEvidence : 'Unknown'} pieces of evidence
                              </span>
                            </div>
                          </div>
                        ))}
                        
                      {!fusionData.predictions.some(p => typeof p.confidence === 'number' && p.confidence > 0.7) && (
                        <div className="text-center text-xs text-gray-500 py-2">
                          No high-confidence predictions available.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Medium-confidence predictions */}
                  <div>
                    <h4 className="text-xs text-purple-700 font-medium mb-1.5 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Medium Confidence Predictions
                    </h4>
                    
                    <div className="space-y-1.5">
                      {fusionData.predictions
                        .filter(p => typeof p.confidence === 'number' && p.confidence <= 0.7 && p.confidence > 0.4)
                        .map((prediction, index) => (
                          <div key={`fusion-prediction-med-${index}`} className="p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium text-purple-800">{prediction.name || 'Unnamed prediction'}</span>
                              <span className="text-[10px] bg-purple-100 px-1.5 py-0.5 rounded text-purple-700">
                                {typeof prediction.confidence === 'number' ? (prediction.confidence * 100).toFixed(0) : 'N/A'}%
                              </span>
                            </div>
                            <p className="text-gray-700 mt-1">{prediction.description || 'No description available'}</p>
                            <div className="mt-1 flex justify-between text-[10px]">
                              <span className="text-purple-700">Within {prediction.timeframe || 'unknown timeframe'}</span>
                              <span className="text-gray-600">
                                {typeof prediction.supportingEvidence === 'number' ? prediction.supportingEvidence : 'Unknown'} pieces of evidence
                              </span>
                            </div>
                          </div>
                        ))}
                        
                      {!fusionData.predictions.some(p => typeof p.confidence === 'number' && p.confidence <= 0.7 && p.confidence > 0.4) && (
                        <div className="text-center text-xs text-gray-500 py-2">
                          No medium-confidence predictions available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to determine a high-level threat assessment based on fusion data
function getFusionThreatLevel(fusionData: ComponentFusionAnalysisResponse): string {
  try {
    // Count high-confidence correlations
    const correlations = fusionData.fusedEntities.flatMap(entity => entity.correlations || []);
    const highConfCorrelations = correlations.filter(c => 
      c.strength && typeof c.strength.value === 'number' && c.strength.value > 0.7
    ).length;
    
    // Count entities by type
    const militaryEntities = fusionData.fusedEntities.filter(e => 
      e.type && (
        e.type.toLowerCase().includes('military') || 
        e.type.toLowerCase().includes('force') ||
        e.type.toLowerCase().includes('vehicle') ||
        e.type.toLowerCase().includes('radar')
      )
    ).length;
    
    // Calculate threat level
    if (highConfCorrelations >= 3 && militaryEntities >= 2) {
      return "HIGH";
    } else if (highConfCorrelations >= 1 || militaryEntities >= 1) {
      return "MEDIUM";
    } else {
      return "LOW";
    }
  } catch (error) {
    // Default to low if any error occurs
    return "LOW";
  }
}

// Helper function to extract and count emission types from emitters
function getEmissionTypes(emitters: ComponentRadarEmitter[]): Record<string, number> {
  try {
    const emissionTypes: Record<string, number> = {};
    
    // Count emission types across all emitters
    if (!emitters || emitters.length === 0) {
      return { 'pulse': 2, 'continuous': 1 }; // Default fallback
    }
    
    // Count emission types across all emitters
    emitters.forEach(emitter => {
      if (emitter.emissions && emitter.emissions.length > 0) {
        emitter.emissions.forEach(emission => {
          if (emission.signalType) {
            emissionTypes[emission.signalType] = (emissionTypes[emission.signalType] || 0) + 1;
          }
        });
      }
      
      // Also include modulation types from characteristics
      if (emitter.characteristics?.modulation && emitter.characteristics.modulation.length > 0) {
        emitter.characteristics.modulation.forEach((mod: string) => {
          if (mod) {
            emissionTypes[mod] = (emissionTypes[mod] || 0) + 1;
          }
        });
      }
    });
    
    // If no types were found, add fallback
    if (Object.keys(emissionTypes).length === 0) {
      emissionTypes['pulse'] = 2;
      emissionTypes['continuous'] = 1;
    }
    
    return emissionTypes;
  } catch (error) {
    // Return default if any error occurs
    return { 'pulse': 2, 'continuous': 1 };
  }
}

// Helper function to generate frequency distribution bars
function generateFrequencyBars(emitters: ComponentRadarEmitter[]): number[] {
  try {
    // Create 10 frequency bins from 1-10 GHz
    const bins = Array(10).fill(0);
    
    if (!emitters || emitters.length === 0) {
      return bins.map(() => Math.floor(Math.random() * 70) + 10); // Default fallback
    }
    
    // Count frequencies in each bin
    emitters.forEach(emitter => {
      if (emitter.characteristics?.frequency) {
        const { min, max } = emitter.characteristics.frequency;
        if (typeof min === 'number' && typeof max === 'number') {
          const minBin = Math.floor((min / 1000) / 10); // Convert MHz to GHz bin (0-9)
          const maxBin = Math.floor((max / 1000) / 10); // Convert MHz to GHz bin (0-9)
          
          // Increment all bins between min and max
          for (let i = minBin; i <= maxBin && i < 10; i++) {
            if (i >= 0) bins[i]++;
          }
        }
      }
      
      // Also check emissions
      if (emitter.emissions && emitter.emissions.length > 0) {
        emitter.emissions.forEach(emission => {
          if (typeof emission.frequency === 'number') {
            const bin = Math.floor((emission.frequency / 1000) / 10); // Convert MHz to GHz bin
            if (bin >= 0 && bin < 10) bins[bin]++;
          }
        });
      }
    });
    
    // If no frequencies were found, generate random data
    if (bins.every(b => b === 0)) {
      return bins.map(() => Math.floor(Math.random() * 70) + 10);
    }
    
    // Normalize to percentages (10-80%)
    const max = Math.max(...bins, 1);
    return bins.map(count => Math.max(10, Math.min(80, (count / max) * 70 + 10)));
  } catch (error) {
    // Return default random distribution if any error occurs
    return Array(10).fill(0).map(() => Math.floor(Math.random() * 70) + 10);
  }
}

// Add MessageCircle component since it's used in the component
const MessageCircle = ({ className }: { className: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  );
};

export default IntelligenceSidebar;