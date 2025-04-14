// components/military-intelligence/analysis/FusionVisualizationLayer.tsx
import React, { useEffect, useState } from 'react';
import { AdaptedAnalysisResponse, TacticalObservation } from '../../../type/intelligence';
import { SigintAnalysisResponse, FusionAnalysisResponse, EmitterLocation } from '../../../type/sigintTypes';
import { processFusionData } from '../utils/fusionProcessor';

// Extended TacticalObservation to include id
interface ExtendedTacticalObservation extends TacticalObservation {
  id?: string;
}

// Extended EmitterLocation to include location
interface ExtendedEmitterLocation extends EmitterLocation {
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface FusionVisualizationLayerProps {
  humintData: AdaptedAnalysisResponse | null | undefined;
  sigintData: SigintAnalysisResponse | null | undefined;
  fusionData: FusionAnalysisResponse | null | undefined;
  map: any; // Leaflet map instance
  layerGroup: any; // Leaflet layer group
  visibleLayers: string[];
  onMarkerClick?: (entityId: string, type: 'fusion') => void;
  theme?: 'light' | 'dark';
}

const FusionVisualizationLayer: React.FC<FusionVisualizationLayerProps> = ({
  humintData,
  sigintData,
  fusionData,
  map,
  layerGroup,
  visibleLayers,
  onMarkerClick,
  theme = 'dark'
}) => {
  const [correlationLines, setCorrelationLines] = useState<any[]>([]);
  const [fusedEntities, setFusedEntities] = useState<any[]>([]);
  const [threatAreas, setThreatAreas] = useState<any[]>([]);
  
  // Process fusion data when it changes or when visibility changes
  useEffect(() => {
    if (!map || !layerGroup || !humintData || !sigintData) return;
    
    // Clear existing layers
    layerGroup.clearLayers();
    
    // If fusion layers are not visible, return early
    if (!visibleLayers.includes('fusion') && !visibleLayers.includes('correlation')) {
      return;
    }
    
    // Process the fusion data
    const processedData = processFusionData(humintData, sigintData, fusionData);
    
    if (!processedData) return;
    
    // Create fusion entities if "fusion" layer is visible
    if (visibleLayers.includes('fusion')) {
      const entityMarkers = processedData.entities
        .filter(entity => entity.sourceType === 'fusion')
        .map(entity => {
          if (!entity.location || !entity.location.coordinates) return null;
          
          // Get coordinates
          const lat = entity.location.coordinates.latitude || entity.location.coordinates.lat;
          const lng = entity.location.coordinates.longitude || entity.location.coordinates.lng;
          
          // Create marker icon
          const icon = createFusionIcon(entity.type);
          
          // Create marker
          const marker = window.L.marker([lat, lng], { 
            icon,
            zIndexOffset: 1500 // Keep fusion entities on top
          }).addTo(layerGroup);
          
          // Add pulse effect
          const pulseCircle = window.L.circle(
            [lat, lng], 
            {
              radius: 150,
              color: 'rgba(147, 51, 234, 0.6)',
              fillColor: 'rgba(147, 51, 234, 0.2)',
              fillOpacity: 0.6,
              weight: 2,
              className: 'pulse-circle'
            }
          ).addTo(layerGroup);
          
          // Create popup content
          const popupContent = `
            <div class="p-3">
              <h3 class="font-bold text-sm text-purple-700 mb-1 border-b border-gray-200 pb-1">
                ${entity.name} 
              </h3>
              
              <div class="mt-2 text-xs text-gray-700">
                ${entity.description}
              </div>
              
              <div class="grid grid-cols-2 gap-1 mt-2 text-xs">
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                  <span class="text-blue-700">HUMINT: ${entity.humintSources ? entity.humintSources.length : 0}</span>
                </div>
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                  <span class="text-red-700">SIGINT: ${entity.sigintSources ? entity.sigintSources.length : 0}</span>
                </div>
              </div>
              
              <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
                <div class="text-xs text-gray-700">
                  ID: ${entity.id.substring(0, 8)}...
                </div>
                <div class="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">FUSION</div>
              </div>
            </div>
          `;
          
          const popup = window.L.popup({
            className: 'military-popup',
            closeButton: false,
            maxWidth: 250
          }).setContent(popupContent);
          
          marker.bindPopup(popup);
          
          // Add click handler
          if (onMarkerClick) {
            marker.on('click', () => onMarkerClick(entity.id, 'fusion'));
          }
          
          return marker;
        }).filter(Boolean);
      
      setFusedEntities(entityMarkers);
      
      // Add threat areas
      const threatAreaMarkers = processedData.threatAreas.map(area => {
        if (!area.center || !area.radius) return null;
        
        // Create threat area circle
        const circle = window.L.circle(
          area.center,
          {
            radius: area.radius,
            color: getThreatLevelColor(area.threatLevel, 0.6),
            fillColor: getThreatLevelColor(area.threatLevel, 0.2),
            fillOpacity: 0.4,
            weight: 2,
            dashArray: '5,5'
          }
        ).addTo(layerGroup);
        
        // Add label for the threat area
        const label = window.L.marker(area.center, {
          icon: window.L.divIcon({
            html: `<div class="px-2 py-1 bg-purple-900/80 text-white text-xs rounded">${area.name}</div>`,
            className: '',
            iconSize: [120, 24],
            iconAnchor: [60, 12]
          })
        }).addTo(layerGroup);
        
        // Add popup with area information
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-sm text-purple-700 mb-1 border-b border-gray-200 pb-1">
              ${area.name}
            </h3>
            
            <div class="mt-2 text-xs text-gray-700">
              ${area.description}
            </div>
            
            <div class="mt-2 text-xs">
              <span class="text-gray-500">Threat Level:</span>
              <div class="font-medium text-${getThreatLevelClass(area.threatLevel)}-700">${area.threatLevel}</div>
            </div>
            
            <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
              <div class="text-xs text-gray-700">
                Radius: ${(area.radius / 1000).toFixed(1)} km
              </div>
              <div class="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">AREA</div>
            </div>
          </div>
        `;
        
        const popup = window.L.popup({
          className: 'military-popup',
          closeButton: false,
          maxWidth: 250
        }).setContent(popupContent);
        
        circle.bindPopup(popup);
        label.bindPopup(popup);
        
        return { circle, label };
      }).filter(Boolean);
      
      setThreatAreas(threatAreaMarkers);
      
      // Add predicted events
      if (processedData.predictedEvents) {
        processedData.predictedEvents.forEach(event => {
          if (!event.location || !event.location.coordinates) return;
          
          // Get coordinates
          const lat = event.location.coordinates.latitude || event.location.coordinates.lat;
          const lng = event.location.coordinates.longitude || event.location.coordinates.lng;
          
          // Create prediction marker
          const marker = window.L.marker([lat, lng], {
            icon: createPredictionIcon(event.confidenceLevel)
          }).addTo(layerGroup);
          
          // Add uncertainty circle
          const uncertaintyCircle = window.L.circle(
            [lat, lng],
            {
              radius: 300, // Default uncertainty radius
              color: 'rgba(147, 51, 234, 0.4)',
              fillColor: 'rgba(147, 51, 234, 0.1)',
              fillOpacity: 0.3,
              weight: 1,
              dashArray: '3,6'
            }
          ).addTo(layerGroup);
          
          // Create popup content
          const popupContent = `
            <div class="p-3">
              <h3 class="font-bold text-sm text-purple-700 mb-1 border-b border-gray-200 pb-1">
                Prediction: ${event.name}
              </h3>
              
              <div class="mt-2 text-xs text-gray-700">
                ${event.description}
              </div>
              
              <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>
                  <span class="text-gray-500">Timeframe:</span>
                  <div class="text-gray-700">${event.formattedTimeframe || event.timeframe}</div>
                </div>
                <div>
                  <span class="text-gray-500">Confidence:</span>
                  <div class="text-gray-700">${(event.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
              
              <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
                <div class="text-xs text-gray-700">
                  ID: ${event.id.substring(0, 8)}...
                </div>
                <div class="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">PREDICTION</div>
              </div>
            </div>
          `;
          
          const popup = window.L.popup({
            className: 'military-popup',
            closeButton: false,
            maxWidth: 250
          }).setContent(popupContent);
          
          marker.bindPopup(popup);
        });
      }
    }
    
    // Create correlation lines if "correlation" layer is visible
    if (visibleLayers.includes('correlation')) {
      // Function to find coordinates for a source
      const findSourceCoordinates = (sourceId: string, type: 'humint' | 'sigint'): [number, number] | null => {
        // First look in processed entities
        const entity = processedData.entities.find(e => e.id === sourceId && e.sourceType === type);
        if (entity && entity.location && entity.location.coordinates) {
          const coords = entity.location.coordinates;
          return [
            coords.latitude || coords.lat, 
            coords.longitude || coords.lng
          ];
        }
        
        // If not found in processed entities, let's try the original data
        if (type === 'humint' && humintData) {
          // For HUMINT, check tactical observations
          if (humintData.intelligence.tacticalObservations) {
            for (const obs of humintData.intelligence.tacticalObservations) {
              // Cast to ExtendedTacticalObservation to access id property
              const extendedObs = obs as ExtendedTacticalObservation;
              
              if ((extendedObs.id === sourceId || `humint-obs-${extendedObs.id}` === sourceId) && 
                  obs.location && obs.location.coordinates) {
                return [
                  obs.location.coordinates.latitude, 
                  obs.location.coordinates.longitude
                ];
              }
            }
          }
        } else if (type === 'sigint' && sigintData) {
          // For SIGINT, check emitters
          if (sigintData.emitters) {
            for (const emitter of sigintData.emitters) {
              if (emitter.id === sourceId && emitter.locations && emitter.locations.length > 0) {
                // Find most recent location
                const location = [...emitter.locations].sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )[0];
                
                if (location) {
                  // Cast to ExtendedEmitterLocation to access location property
                  const extendedLocation = location as ExtendedEmitterLocation;
                  
                  if (extendedLocation.location) {
                    return [
                      extendedLocation.location.latitude, 
                      extendedLocation.location.longitude
                    ];
                  } else if (location.coordinates) {
                    return [
                      location.coordinates.latitude, 
                      location.coordinates.longitude
                    ];
                  }
                }
              }
            }
          }
        }
        
        return null;
      };
      
      // Create correlation lines
      const lines = processedData.correlations.map(correlation => {
        // Find coordinates for both ends
        const humintCoords = findSourceCoordinates(correlation.humintEntityId, 'humint');
        const sigintCoords = findSourceCoordinates(correlation.sigintEmitterId, 'sigint');
        
        if (!humintCoords || !sigintCoords) return null;
        
        // Determine line style based on correlation strength
        let lineColor = 'rgba(147, 51, 234, 0.6)'; // Default purple
        let lineWeight = 2;
        let lineDash = '5,5';
        
        if (correlation.strength > 0.7) {
          lineColor = 'rgba(147, 51, 234, 0.8)'; // Strong purple
          lineWeight = 3;
          lineDash = 'none';
        } else if (correlation.strength > 0.4) {
          lineColor = 'rgba(167, 139, 250, 0.7)'; // Medium purple
          lineWeight = 2;
          lineDash = '5,5';
        } else {
          lineColor = 'rgba(196, 181, 253, 0.6)'; // Light purple
          lineWeight = 1;
          lineDash = '3,7';
        }
        
        // Create the correlation line
        const line = window.L.polyline(
          [humintCoords, sigintCoords],
          {
            color: lineColor,
            weight: lineWeight,
            opacity: 0.8,
            dashArray: lineDash
          }
        ).addTo(layerGroup);
        
        // Add midpoint marker showing correlation strength
        const midLat = (humintCoords[0] + sigintCoords[0]) / 2;
        const midLng = (humintCoords[1] + sigintCoords[1]) / 2;
        
        const strengthMarker = window.L.marker([midLat, midLng], {
          icon: window.L.divIcon({
            html: `<div class="flex items-center justify-center h-6 w-6 rounded-full bg-purple-900/80 border border-purple-700 text-white text-xs font-medium">
              ${Math.round(correlation.strength * 100)}%
            </div>`,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(layerGroup);
        
        // Add popup with correlation details
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-sm text-purple-700 mb-1 border-b border-gray-200 pb-1">
              Intelligence Correlation
            </h3>
            
            <div class="grid grid-cols-2 gap-1 mt-2 text-xs">
              <div>
                <span class="text-gray-500">HUMINT Source:</span>
                <div class="text-blue-700">${correlation.humintEntityId.substring(0, 8)}...</div>
              </div>
              <div>
                <span class="text-gray-500">SIGINT Source:</span>
                <div class="text-red-700">${correlation.sigintEmitterId.substring(0, 8)}...</div>
              </div>
            </div>
            
            <div class="mt-2 text-xs">
              <span class="text-gray-500">Correlation Type:</span>
              <div class="text-gray-700 capitalize">${correlation.type}</div>
            </div>
            
            <div class="grid grid-cols-3 gap-1 mt-2 text-xs text-gray-700">
              <div>
                <span class="text-gray-500">Spatial:</span>
                <div>${(correlation.factors?.spatial * 100 || 0).toFixed(0)}%</div>
              </div>
              <div>
                <span class="text-gray-500">Temporal:</span>
                <div>${(correlation.factors?.temporal * 100 || 0).toFixed(0)}%</div>
              </div>
              <div>
                <span class="text-gray-500">Semantic:</span>
                <div>${(correlation.factors?.semantic * 100 || 0).toFixed(0)}%</div>
              </div>
            </div>
            
            <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
              <div class="text-xs text-gray-700">
                Strength: ${(correlation.strength * 100).toFixed(0)}%
              </div>
              <div class="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">CORRELATION</div>
            </div>
          </div>
        `;
        
        const popup = window.L.popup({
          className: 'military-popup',
          closeButton: false,
          maxWidth: 250
        }).setContent(popupContent);
        
        line.bindPopup(popup);
        strengthMarker.bindPopup(popup);
        
        return { line, strengthMarker };
      }).filter(Boolean);
      
      setCorrelationLines(lines);
    }
    
    // Add cleanup function
    return () => {
      layerGroup.clearLayers();
    };
  }, [map, layerGroup, humintData, sigintData, fusionData, visibleLayers, onMarkerClick, theme]);
  
  // Empty render - all work is done in useEffect
  return null;
};

// Helper functions for Fusion visualization

/**
 * Create an icon for a fusion entity
 * @param type The entity type
 * @returns A Leaflet divIcon
 */
function createFusionIcon(type: string): any {
  if (!window.L) return null;
  
  // Create fusion icon based on entity type
  let iconHtml = '';
  
  switch (type.toLowerCase()) {
    case 'force':
    case 'military':
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-900/90 backdrop-blur-sm border-2 border-purple-700 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-300">
          <path d="M15 2H9v2H1v4h22V4h-8V2z"/>
          <path d="M12 14v8"/>
          <path d="M8 22h8"/>
          <path d="M4 13a8 8 0 0 1 16 0"/>
        </svg>
      </div>`;
      break;
    
    case 'vehicle':
    case 'transport':
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-900/90 backdrop-blur-sm border-2 border-purple-700 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-300">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10H3c-1.2 0-2 .8-2 2v3c0 1.2.8 2 2 2h1"/>
          <path d="M14 17H9"/>
          <circle cx="6" cy="17" r="2"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>`;
      break;
    
    case 'radar':
    case 'emitter':
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-900/90 backdrop-blur-sm border-2 border-purple-700 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-300">
          <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/>
          <path d="M4 6h.01"/>
          <path d="M2.29 9.62A10 10 0 1 0 21.98 12.01"/>
          <path d="M12 2v2"/>
          <path d="M2 12h2"/>
          <path d="M12 18a6 6 0 0 0 6-6"/>
          <path d="M16 6h.01"/>
          <path d="M12 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
        </svg>
      </div>`;
      break;
    
    case 'facility':
    case 'building':
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-900/90 backdrop-blur-sm border-2 border-purple-700 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-300">
          <path d="M1 22V7l9-4v18"/>
          <path d="M10 22V4l9-4v18"/>
          <path d="M15 22V9l5-2v15"/>
          <path d="M5 22v-4"/>
          <path d="M10 22v-4"/>
          <path d="M15 22v-4"/>
          <path d="M20 22v-4"/>
        </svg>
      </div>`;
      break;
    
    default:
      // Default fusion icon
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-900/90 backdrop-blur-sm border-2 border-purple-700 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-300">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>`;
  }
  
  return window.L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

/**
 * Create an icon for a prediction
 * @param confidence The confidence level
 * @returns A Leaflet divIcon
 */
function createPredictionIcon(confidence: string): any {
  if (!window.L) return null;
  
  // Determine color based on confidence
  let color = 'purple';
  
  if (confidence === 'high') {
    color = 'green';
  } else if (confidence === 'medium') {
    color = 'blue';
  } else if (confidence === 'low') {
    color = 'amber';
  }
  
  // Create prediction icon
  const iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-${color}-900/90 backdrop-blur-sm border-2 border-${color}-700 shadow-lg">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-${color}-300">
      <path d="M12 8V4"/>
      <path d="m4.93 10.93 1.41 1.41"/>
      <path d="M2 18h2"/>
      <path d="M20 18h2"/>
      <path d="m19.07 10.93-1.41 1.41"/>
      <path d="M22 22H2"/>
      <path d="m16 6-4 4-4-4"/>
      <path d="M16 18a4 4 0 0 0-8 0"/>
    </svg>
  </div>`;
  
  return window.L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

/**
 * Get a color for a threat level
 * @param threatLevel The threat level (HIGH, MEDIUM, LOW)
 * @param opacity The opacity value (0-1)
 * @returns A color string with opacity
 */
function getThreatLevelColor(threatLevel: string, opacity: number = 1): string {
  const level = threatLevel ? threatLevel.toUpperCase() : 'LOW';
  
  if (level === 'HIGH') {
    return `rgba(220, 38, 38, ${opacity})`; // Red for high threat
  } else if (level === 'MEDIUM') {
    return `rgba(217, 119, 6, ${opacity})`; // Amber for medium threat
  } else {
    return `rgba(37, 99, 235, ${opacity})`; // Blue for low threat
  }
}

/**
 * Get a Tailwind CSS class for a threat level
 * @param threatLevel The threat level (HIGH, MEDIUM, LOW)
 * @returns A Tailwind CSS color class
 */
function getThreatLevelClass(threatLevel: string): string {
  const level = threatLevel ? threatLevel.toUpperCase() : 'LOW';
  
  if (level === 'HIGH') {
    return 'red';
  } else if (level === 'MEDIUM') {
    return 'amber';
  } else {
    return 'blue';
  }
}

export default FusionVisualizationLayer;