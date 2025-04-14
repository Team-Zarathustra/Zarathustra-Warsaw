// components/military-intelligence/ui/IntelligencePopup.tsx
import React from 'react';
import { Eye, Target, Radio, Shield, Map, Zap, AlertTriangle, Globe } from 'lucide-react';
import ConfidenceBadge from '../ui/confidenceBadge';
import { QualityScore } from '../../../type/intelligence';

interface IntelligencePopupProps {
  entityType: 'humint' | 'sigint' | 'osint' | 'fusion' | 'threat' | 'location' | 'prediction';
  entityData: any;
  onClose?: () => void;
}

export const IntelligencePopup: React.FC<IntelligencePopupProps> = ({
  entityType,
  entityData,
  onClose
}) => {
  // Format date function
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Determine icon based on entity type
  const getEntityIcon = () => {
    switch (entityType) {
      case 'humint':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'sigint':
        return <Radio className="h-5 w-5 text-red-500" />;
      case 'osint':
        return <Globe className="h-5 w-5 text-green-500" />;
      case 'fusion':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'threat':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'location':
        return <Map className="h-5 w-5 text-green-500" />;
      case 'prediction':
        return <Target className="h-5 w-5 text-purple-500" />;
      default:
        return <Eye className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get the popup background class based on entity type
  const getPopupClass = (): string => {
    switch (entityType) {
      case 'humint':
        return 'bg-blue-50 border-blue-200';
      case 'sigint':
        return 'bg-red-50 border-red-200';
      case 'osint':
        return 'bg-green-50 border-green-200';
      case 'fusion':
        return 'bg-purple-50 border-purple-200';
      case 'threat':
        return 'bg-amber-50 border-amber-200';
      case 'location':
        return 'bg-green-50 border-green-200';
      case 'prediction':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Get title color class based on entity type
  const getTitleClass = (): string => {
    switch (entityType) {
      case 'humint': return 'text-blue-700';
      case 'sigint': return 'text-red-700';
      case 'osint': return 'text-green-700';
      case 'fusion': return 'text-purple-700';
      case 'threat': return 'text-amber-700';
      case 'location': return 'text-green-700';
      case 'prediction': return 'text-purple-700';
      default: return 'text-gray-700';
    }
  };
  
  // Render different content based on entity type
  const renderEntityContent = () => {
    switch (entityType) {
      case 'sigint':
        return renderSigintContent();
      case 'humint':
        return renderHumintContent();
      case 'osint':
        return renderOsintContent();
      case 'fusion':
        return renderFusionContent();
      case 'threat':
        return renderThreatContent();
      case 'location':
        return renderLocationContent();
      case 'prediction':
        return renderPredictionContent();
      default:
        return <p className="text-sm text-gray-600">No details available</p>;
    }
  };
  
  // Render OSINT content
  const renderOsintContent = () => {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-700">{entityData?.title || entityData?.description || 'OSINT Data'}</p>
        
        {entityData?.type && (
          <div className="border-t border-green-100 pt-2 mt-2">
            <span className="text-gray-500 text-xs">Type:</span>
            <p className="text-sm font-medium">{entityData.type}</p>
          </div>
        )}
        
        {entityData?.timestamp && (
          <div className="border-t border-green-100 pt-2">
            <span className="text-gray-500 text-xs">Time:</span>
            <p className="text-sm">{formatDate(entityData.timestamp)}</p>
          </div>
        )}
        
        {entityData?.location && (
          <div className="border-t border-green-100 pt-2">
            <span className="text-gray-500 text-xs">Location:</span>
            <p className="text-sm font-mono">
              {typeof entityData.location.latitude === 'number' 
                ? entityData.location.latitude.toFixed(5) 
                : 'N/A'}°N, 
              {typeof entityData.location.longitude === 'number' 
                ? entityData.location.longitude.toFixed(5) 
                : 'N/A'}°E
            </p>
          </div>
        )}
        
        {entityData?.source && (
          <div className="border-t border-green-100 pt-2">
            <span className="text-gray-500 text-xs">Source:</span>
            <p className="text-sm">{entityData.source}</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render SIGINT content (radar emitter details)
  const renderSigintContent = () => {
    if (!entityData) {
      return <p className="text-sm text-gray-600">No SIGINT data available</p>;
    }
    
    return (
      <div className="space-y-2">
        {/* Classification and platform */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
          <div>
            <span className="text-gray-500 text-xs">Classification:</span>
            <p className="font-medium">{entityData.classification?.type || entityData.classification || 'Unknown'}</p>
          </div>
          
          {entityData.platformAssessment && (
            <div>
              <span className="text-gray-500 text-xs">Platform:</span>
              <p className="font-medium capitalize">
                {entityData.platformAssessment.model || entityData.platformAssessment.type || 'Unknown'}
              </p>
            </div>
          )}
        </div>
        
        {/* Frequency and detection data */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
          {entityData.characteristics?.frequency && (
            <div className="col-span-2">
              <span className="text-gray-500 text-xs">Frequency:</span>
              <p className="font-mono">
                {entityData.characteristics.frequency.min || 'Unknown'}-
                {entityData.characteristics.frequency.max || 'Unknown'} MHz
              </p>
            </div>
          )}
          
          <div>
            <span className="text-gray-500 text-xs">First detected:</span>
            <p className="text-xs">{formatDate(entityData.firstDetected)}</p>
          </div>
          
          <div>
            <span className="text-gray-500 text-xs">Last detected:</span>
            <p className="text-xs">{formatDate(entityData.lastDetected)}</p>
          </div>
        </div>
        
        {/* Latest location data - fixed the potential undefined issue */}
        {entityData.locations && entityData.locations.length > 0 && entityData.locations[0].location && (
          <div className="border-t border-red-100 pt-2 mt-2">
            <span className="text-gray-500 text-xs">Latest location:</span>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs font-mono">
                {typeof entityData.locations[0].location.latitude === 'number' 
                  ? entityData.locations[0].location.latitude.toFixed(5) 
                  : 'N/A'}°N, 
                {typeof entityData.locations[0].location.longitude === 'number' 
                  ? entityData.locations[0].location.longitude.toFixed(5) 
                  : 'N/A'}°E
              </p>
              <ConfidenceBadge 
                level={entityData.locations[0].confidenceLevel || 'medium'} 
                size="sm" 
                showDot={false} 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Accuracy: ±{entityData.locations[0].accuracy || 'unknown'}m
            </p>
          </div>
        )}
        
        {/* Modulation type */}
        {entityData.characteristics?.modulation && Array.isArray(entityData.characteristics.modulation) && (
          <div className="border-t border-red-100 pt-2">
            <span className="text-gray-500 text-xs">Signal modulation:</span>
            <p className="text-sm">{entityData.characteristics.modulation.join(', ')}</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render HUMINT content
  const renderHumintContent = () => {
    if (!entityData) {
      return <p className="text-sm text-gray-600">No HUMINT data available</p>;
    }
    
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-700">{entityData.description || entityData.text || entityData}</p>
        
        {entityData.location && (
          <div className="border-t border-blue-100 pt-2 mt-2">
            <span className="text-gray-500 text-xs">Location:</span>
            <p className="text-sm font-medium">{entityData.location}</p>
          </div>
        )}
        
        {entityData.time && (
          <div className="border-t border-blue-100 pt-2">
            <span className="text-gray-500 text-xs">Time observed:</span>
            <p className="text-sm">{entityData.time}</p>
          </div>
        )}
        
        {(entityData.equipment || entityData.type) && (
          <div className="border-t border-blue-100 pt-2">
            <span className="text-gray-500 text-xs">Type:</span>
            <p className="text-sm">{entityData.equipment || entityData.type}</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render Fusion content
  const renderFusionContent = () => {
    if (!entityData) {
      return <p className="text-sm text-gray-600">No fusion data available</p>;
    }
    
    return (
      <div className="space-y-2">
        <div className="text-sm text-gray-700">
          <span className="text-gray-500 text-xs">Entity Type:</span>
          <p className="font-medium">{
            entityData.type?.charAt(0).toUpperCase() + entityData.type?.slice(1) || 'Unknown'
          }</p>
        </div>
        
        {/* Sources count */}
        <div className="grid grid-cols-2 gap-1 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-gray-500 text-xs">HUMINT:</span>
            <span className="ml-1 text-blue-700">{entityData.humintSources?.length || 0}</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
            <span className="text-gray-500 text-xs">SIGINT:</span>
            <span className="ml-1 text-red-700">{entityData.sigintSources?.length || 0}</span>
          </div>
        </div>
        
        {/* Correlations section */}
        {entityData.correlations && entityData.correlations.length > 0 && (
          <div className="border-t border-purple-100 pt-2 mt-2">
            <span className="text-gray-500 text-xs mb-1 block">Top correlations:</span>
            <div className="space-y-1.5">
              {entityData.correlations
                .filter((corr: any) => corr && corr.strength && typeof corr.strength.value === 'number')
                .sort((a: any, b: any) => b.strength.value - a.strength.value)
                .slice(0, 2)
                .map((correlation: any, index: number) => (
                  <div key={`corr-${index}`} 
                    className="text-xs p-1.5 bg-purple-100/50 rounded border border-purple-100">
                    <div className="flex justify-between">
                      <span className="text-purple-800">{correlation.correlationType || 'Unknown'}</span>
                      <span className="font-medium">{(correlation.strength.value * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>Spatial: {typeof correlation.strength.factors.spatial === 'number' ? (correlation.strength.factors.spatial * 100).toFixed(0) : 'N/A'}%</span>
                      <span>Temporal: {typeof correlation.strength.factors.temporal === 'number' ? (correlation.strength.factors.temporal * 100).toFixed(0) : 'N/A'}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Last updated timestamp */}
        <div className="text-xs text-gray-500 mt-2">
          Last updated: {formatDate(entityData.lastUpdated)}
        </div>
      </div>
    );
  };
  
  // Render Threat content
  const renderThreatContent = () => {
    if (!entityData) {
      return <p className="text-sm text-gray-600">No threat data available</p>;
    }
    
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-700">{entityData.description || 'No description available'}</p>
        
        <div className="grid grid-cols-2 gap-1 text-sm">
          <div>
            <span className="text-gray-500 text-xs">Severity:</span>
            <p className="font-medium uppercase text-xs">
              {entityData.severity || 'Unknown'}
            </p>
          </div>
          
          <div>
            <span className="text-gray-500 text-xs">Immediacy:</span>
            <p className="font-medium text-xs capitalize">
              {entityData.immediacy || 'Unknown'}
            </p>
          </div>
        </div>
        
        {entityData.location && (
          <div className="border-t border-amber-100 pt-2">
            <span className="text-gray-500 text-xs">Location:</span>
            <p className="text-sm">{entityData.location}</p>
          </div>
        )}
        
        {entityData.category && (
          <div className="border-t border-amber-100 pt-2">
            <span className="text-gray-500 text-xs">Category:</span>
            <p className="text-sm capitalize">{entityData.category}</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render Location content
  const renderLocationContent = () => {
    if (!entityData) {
      return <p className="text-sm text-gray-600">No location data available</p>;
    }
    
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-700">{entityData.name || entityData}</p>
        
        {entityData.description && (
          <div className="border-t border-green-100 pt-2 mt-2">
            <span className="text-gray-500 text-xs">Description:</span>
            <p className="text-sm">{entityData.description}</p>
          </div>
        )}
        
        {entityData.coordinates && (
          <div className="border-t border-green-100 pt-2">
            <span className="text-gray-500 text-xs">Coordinates:</span>
            <p className="text-sm font-mono">
              {(entityData.coordinates.latitude !== undefined) 
                ? typeof entityData.coordinates.latitude === 'number' 
                  ? entityData.coordinates.latitude.toFixed(5) 
                  : entityData.coordinates.latitude
                : (entityData.coordinates.lat !== undefined) 
                  ? typeof entityData.coordinates.lat === 'number'
                    ? entityData.coordinates.lat.toFixed(5)
                    : entityData.coordinates.lat
                  : 'N/A'}°N, 
              {(entityData.coordinates.longitude !== undefined)
                ? typeof entityData.coordinates.longitude === 'number'
                  ? entityData.coordinates.longitude.toFixed(5)
                  : entityData.coordinates.longitude
                : (entityData.coordinates.lng !== undefined)
                  ? typeof entityData.coordinates.lng === 'number'
                    ? entityData.coordinates.lng.toFixed(5)
                    : entityData.coordinates.lng
                  : 'N/A'}°E
            </p>
          </div>
        )}
        
        {entityData.controllingForce && (
          <div className="border-t border-green-100 pt-2">
            <span className="text-gray-500 text-xs">Controlling force:</span>
            <p className="text-sm">{entityData.controllingForce}</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render Prediction content
  const renderPredictionContent = () => {
    if (!entityData) {
      return <p className="text-sm text-gray-600">No prediction data available</p>;
    }
    
    return (
      <div className="space-y-2">
        <div>
          <span className="text-gray-500 text-xs">Prediction:</span>
          <p className="text-sm font-medium text-gray-700">{entityData.name || 'Unknown prediction'}</p>
        </div>
        
        <p className="text-sm text-gray-700">{entityData.description || 'No description available'}</p>
        
        <div className="grid grid-cols-2 gap-1 text-sm">
          <div>
            <span className="text-gray-500 text-xs">Timeframe:</span>
            <p className="text-xs">{entityData.formattedTimeframe || entityData.timeframe || 'Unknown'}</p>
          </div>
          
          <div>
            <span className="text-gray-500 text-xs">Confidence:</span>
            <p className="text-xs">
              {entityData.confidenceFormatted || 
               (typeof entityData.confidence === 'number' ? `${(entityData.confidence * 100).toFixed(0)}%` : 'Unknown')}
            </p>
          </div>
        </div>
        
        {entityData.evidenceEvents && entityData.evidenceEvents.length > 0 && (
          <div className="border-t border-purple-100 pt-2">
            <span className="text-gray-500 text-xs">Evidence:</span>
            <ul className="text-xs list-disc pl-4 mt-1 text-gray-700">
              {entityData.evidenceEvents.slice(0, 2).map((evidence: any, index: number) => (
                <li key={`evidence-${index}`}>{evidence.description || 'No description'}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // Get entity title
  const getEntityTitle = (): string => {
    if (!entityData) return 'Entity Details';
    
    switch (entityType) {
      case 'humint': {
        if (typeof entityData === 'string') return 'HUMINT Report';
        return entityData.name || entityData.type || 'HUMINT Entity';
      }
      case 'sigint':
        return entityData.classification?.type || entityData.classification || 'Radar Emitter';
      case 'osint':
        return entityData.title || 'OSINT Data';
      case 'fusion':
        return `Fused Entity: ${entityData.type?.charAt(0).toUpperCase() + entityData.type?.slice(1) || 'Unknown'}`;
      case 'threat':
        return 'Threat Assessment';
      case 'location':
        return entityData.name || 'Geographic Location';
      case 'prediction':
        return 'Intelligence Prediction';
      default:
        return 'Entity Details';
    }
  };
  
  return (
    <div className={`rounded-lg shadow-lg border p-4 max-w-md ${getPopupClass()}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {getEntityIcon()}
          <h3 className={`text-base font-medium ${getTitleClass()}`}>
            {getEntityTitle()}
          </h3>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="pb-2">
        {renderEntityContent()}
      </div>
      
      {/* Footer */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs capitalize px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
          {entityType} data
        </div>
        
        <ConfidenceBadge 
          level={
            (entityData?.confidence as QualityScore) || 
            (entityData?.combinedConfidence as QualityScore) || 
            'medium'
          } 
          size="sm" 
          showDot={false}
        />
      </div>
    </div>
  );
};