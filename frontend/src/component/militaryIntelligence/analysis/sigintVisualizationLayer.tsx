// components/military-intelligence/analysis/SigintVisualizationLayer.tsx
import React, { useEffect, useState } from 'react';
import { 
  SigintAnalysisResponse, 
  ProcessedRadarEmitter, 
  CoverageArea, 
  TransmissionPath,
  AirDefenseSystem,
  GroundForceUnit,
  NavalVessel,
  AircraftUnit
} from '../../../type/sigintTypes';
import { processRadarEmitters, processElectronicOrderOfBattle } from '../utils/radarUtils';

interface SigintVisualizationLayerProps {
  sigintData: SigintAnalysisResponse;
  map: any; // Leaflet map instance
  layerGroup: any; // Leaflet layer group
  visibleLayers: string[];
  onMarkerClick?: (entityId: string, type: 'sigint') => void;
  theme?: 'light' | 'dark';
}

/**
 * Type guard to check if coordinates are valid
 * @param coordinates The coordinates to check
 * @returns Boolean indicating if coordinates are valid
 */
function isValidLatLng(coordinates: any): boolean {
  if (!coordinates || typeof coordinates !== 'object') return false;
  
  let lat = coordinates.lat;
  let lng = coordinates.lng;
  
  // Fix truncated coordinates (Ukraine is around 47-50°N)
  if (lat < 10 && lng > 30 && lng < 41) {
    lat = 40 + lat;
    coordinates.lat = lat; // Update the original object too
  }
  
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

/**
 * Type guard to check if array coordinates are valid
 * @param coordinates The coordinates array to check [lat, lng]
 * @returns Boolean indicating if coordinates are valid
 */
function isValidLatLngArray(coordinates: any): boolean {
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number' &&
    !isNaN(coordinates[0]) &&
    !isNaN(coordinates[1])
  );
}

const SigintVisualizationLayer: React.FC<SigintVisualizationLayerProps> = ({
  sigintData,
  map,
  layerGroup,
  visibleLayers,
  onMarkerClick,
  theme = 'dark'
}) => {
  const [markers, setMarkers] = useState<any[]>([]);
  const [radarCoverage, setRadarCoverage] = useState<any[]>([]);
  const [radarMovements, setRadarMovements] = useState<any[]>([]);
  const [predictionLines, setPredictionLines] = useState<any[]>([]);
  
  // Process SIGINT data when it changes or when visibility changes
  useEffect(() => {
    if (!map || !layerGroup || !sigintData) return;
    
    // Clear existing layers
    layerGroup.clearLayers();
    
    // If SIGINT layer is not visible, return early
    if (!visibleLayers.includes('sigint')) return;
    
    // Improved isValidLatLng function to handle and fix truncated coordinates
    const fixAndValidateLatLng = (coordinates: any): boolean => {
      if (!coordinates || typeof coordinates !== 'object') return false;
      
      // Fix truncated coordinates (Ukraine is around 47-50°N)
      if (typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number' &&
          coordinates.lat < 10 && coordinates.lng > 30 && coordinates.lng < 41) {
        // This is likely a truncated coordinate - fix by adding leading "4"
        coordinates.lat = 40 + coordinates.lat;
        console.log(`[DEBUG] Fixed truncated latitude: ${coordinates.lat}, ${coordinates.lng}`);
      }
      
      return (
        coordinates.lat !== undefined && coordinates.lng !== undefined &&
        typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number' &&
        !isNaN(coordinates.lat) && !isNaN(coordinates.lng)
      );
    };
    
    // Process the radar emitter data
    const processedData = processRadarEmitters(sigintData);
    
    // Process the electronic order of battle
    const processedEOB = processElectronicOrderOfBattle(sigintData);
    
    // Create radar emitter markers
    const emitterMarkers = processedData.emitters.map((emitter: ProcessedRadarEmitter) => {
      // Skip if coordinates are missing or invalid
      if (!emitter) return null;
      
      // Attempt to fix or recover coordinates
      if (!emitter.coordinates || !fixAndValidateLatLng(emitter.coordinates)) {
        // Try to recover coordinates from original data if possible
        if (sigintData.emitters) {
          const originalEmitter = sigintData.emitters.find(e => e.id === emitter.id);
          if (originalEmitter && originalEmitter.locations && originalEmitter.locations.length > 0) {
            const latestLocation = [...originalEmitter.locations].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];
            
            if (latestLocation && latestLocation.coordinates) {
              const lat = latestLocation.coordinates.latitude;
              const lng = latestLocation.coordinates.longitude;
              
              // Create new coordinates object
              emitter.coordinates = { lat, lng };
              
              // Fix truncated coordinates if needed
              fixAndValidateLatLng(emitter.coordinates);
              
              console.log(`[DEBUG] Recovered coordinates for emitter ${emitter.id}: ${emitter.coordinates.lat}, ${emitter.coordinates.lng}`);
            } else {
              console.warn('Skipping emitter due to invalid coordinates:', emitter?.id || 'unknown');
              return null;
            }
          } else {
            console.warn('Skipping emitter due to invalid coordinates:', emitter?.id || 'unknown');
            return null;
          }
        } else {
          console.warn('Skipping emitter due to invalid coordinates:', emitter?.id || 'unknown');
          return null;
        }
      }
      
      // Create marker icon based on emitter type
      const icon = createEmitterIcon(emitter.type || '', emitter.platformType);
      
      // Create marker with valid coordinates
      const marker = window.L.marker([emitter.coordinates.lat, emitter.coordinates.lng], {
        icon,
        zIndexOffset: 1000
      }).addTo(layerGroup);
      
      // Add accuracy circle around emitter
      if (emitter.accuracy && typeof emitter.accuracy === 'number' && !isNaN(emitter.accuracy)) {
        const accuracyCircle = window.L.circle(
          [emitter.coordinates.lat, emitter.coordinates.lng], 
          {
            radius: emitter.accuracy,
            color: getEmitterColor(emitter.type || '', emitter.platformType, 0.6),
            fillColor: getEmitterColor(emitter.type || '', emitter.platformType, 0.2),
            fillOpacity: 0.4,
            weight: 1,
            dashArray: '5,5'
          }
        ).addTo(layerGroup);
      }
      
      // Add pulse effect
      const pulseCircle = window.L.circle(
        [emitter.coordinates.lat, emitter.coordinates.lng], 
        {
          radius: 100,
          color: getEmitterColor(emitter.type || '', emitter.platformType, 0.8),
          fillColor: getEmitterColor(emitter.type || '', emitter.platformType, 0.4),
          fillOpacity: 0.6,
          weight: 2,
          className: 'pulse-circle'
        }
      ).addTo(layerGroup);
      
      // Add popup with emitter information
      const popupContent = `
        <div class="p-3">
          <h3 class="font-bold text-sm text-red-700 mb-1 border-b border-gray-200 pb-1">
            ${emitter.classification || 'Unknown Radar'} 
            ${emitter.platformModel ? `(${emitter.platformModel})` : ''}
          </h3>
          
          <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div>
              <span class="text-gray-500">First seen:</span>
              <div class="text-gray-700">${formatDateTime(emitter.firstDetected)}</div>
            </div>
            <div>
              <span class="text-gray-500">Last seen:</span>
              <div class="text-gray-700">${formatDateTime(emitter.lastDetected)}</div>
            </div>
          </div>
          
          ${emitter.frequency ? `
            <div class="mt-1 text-xs">
              <span class="text-gray-500">Frequency:</span>
              <div class="text-gray-700 font-mono">${emitter.frequency}</div>
            </div>
          ` : ''}
          
          ${emitter.modulation ? `
            <div class="mt-1 text-xs">
              <span class="text-gray-500">Modulation:</span>
              <div class="text-gray-700">${emitter.modulation}</div>
            </div>
          ` : ''}
          
          <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
            <div class="text-xs text-gray-700">
              ID: ${emitter.id ? emitter.id.substring(0, 8) + '...' : 'Unknown'}
            </div>
            <div class="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">SIGINT</div>
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
      if (onMarkerClick && emitter.id) {
        marker.on('click', () => onMarkerClick(emitter.id, 'sigint'));
      }
      
      // Add historical track if available
      if (emitter.historicalPath && Array.isArray(emitter.historicalPath) && emitter.historicalPath.length > 1) {
        // Validate each point in the path
        const validPath = emitter.historicalPath.filter(point => 
          Array.isArray(point) && point.length === 2 && 
          typeof point[0] === 'number' && typeof point[1] === 'number' &&
          !isNaN(point[0]) && !isNaN(point[1])
        );
        
        if (validPath.length > 1) {
          const path = window.L.polyline(
            validPath,
            {
              color: getEmitterColor(emitter.type || '', emitter.platformType, 0.7),
              weight: 2,
              opacity: 0.7,
              dashArray: '5,5'
            }
          ).addTo(layerGroup);
        }
      }
      
      // Add prediction tracks if available
      if (emitter.predictedLocations && Array.isArray(emitter.predictedLocations) && emitter.predictedLocations.length > 0) {
        // Filter out predictions with invalid coordinates
        const validPredictions = emitter.predictedLocations.filter(pred => {
          // Fix truncated coordinates if needed
          if (pred && pred.coordinates) {
            fixAndValidateLatLng(pred.coordinates);
          }
          return pred && pred.coordinates && isValidLatLng(pred.coordinates) && pred.timestamp;
        });
        
        if (validPredictions.length > 0) {
          // Sort by timestamp
          const sortedPredictions = [...validPredictions].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return isNaN(timeA) || isNaN(timeB) ? 0 : timeA - timeB;
          });
          
          // Start path from the emitter's current position
          const predictionPath = [
            [emitter.coordinates.lat, emitter.coordinates.lng],
            ...sortedPredictions.map(p => [p.coordinates.lat, p.coordinates.lng])
          ];
          
          // Create the prediction path
          const predPath = window.L.polyline(
            predictionPath,
            {
              color: getEmitterColor(emitter.type || '', emitter.platformType, 0.7),
              weight: 2,
              opacity: 0.5,
              dashArray: '3,6'
            }
          ).addTo(layerGroup);
          
          // Add arrow to show direction
          if (window.L.Symbol && window.L.polylineDecorator) {
            try {
              const arrow = window.L.polylineDecorator(predPath, {
                patterns: [
                  {
                    offset: '100%',
                    repeat: 0,
                    symbol: window.L.Symbol.arrowHead({
                      pixelSize: 10,
                      polygon: false,
                      pathOptions: {
                        color: getEmitterColor(emitter.type || '', emitter.platformType, 1),
                        fillOpacity: 1,
                        weight: 2
                      }
                    })
                  }
                ]
              }).addTo(layerGroup);
            } catch (error) {
              console.warn('Failed to add polyline decorator:', error);
            }
          }
          
          // Add prediction markers
          sortedPredictions.forEach(pred => {
            // Create prediction marker
            const predMarker = window.L.circleMarker(
              [pred.coordinates.lat, pred.coordinates.lng],
              {
                radius: 5,
                color: 'white',
                weight: 1,
                fillColor: getEmitterColor(emitter.type || '', emitter.platformType, 0.8),
                fillOpacity: 0.8
              }
            ).addTo(layerGroup);
            
            // Add uncertainty circle
            if (
              pred.uncertaintyRadius && 
              typeof pred.uncertaintyRadius === 'number' && 
              !isNaN(pred.uncertaintyRadius)
            ) {
              const uncertaintyCircle = window.L.circle(
                [pred.coordinates.lat, pred.coordinates.lng],
                {
                  radius: pred.uncertaintyRadius,
                  color: getEmitterColor(emitter.type || '', emitter.platformType, 0.5),
                  fillColor: getEmitterColor(emitter.type || '', emitter.platformType, 0.2),
                  fillOpacity: 0.3,
                  weight: 1,
                  dashArray: '2,4'
                }
              ).addTo(layerGroup);
            }
            
            // Add tooltip with prediction time
            if (pred.timestamp) {
              predMarker.bindTooltip(
                `Predicted: ${formatDateTime(pred.timestamp)}`,
                { 
                  permanent: false, 
                  direction: 'top',
                  className: 'bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700'
                }
              );
            }
          });
        }
      }
      
      return marker;
    }).filter(Boolean);
    
    setMarkers(emitterMarkers);
    
    // Also modify isValidLatLngArray to fix truncated coordinates
    const isValidLatLngArrayFixed = (coordinates: any): boolean => {
      if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
      
      const [lat, lng] = coordinates;
      
      // Fix truncated coordinates if needed
      if (typeof lat === 'number' && typeof lng === 'number' &&
          lat < 10 && lng > 30 && lng < 41) {
        // This is likely a truncated coordinate - fix by adding leading "4"
        coordinates[0] = 40 + lat;
        console.log(`[DEBUG] Fixed truncated latitude in array: ${coordinates[0]}, ${coordinates[1]}`);
      }
      
      return (
        typeof coordinates[0] === 'number' && 
        typeof coordinates[1] === 'number' &&
        !isNaN(coordinates[0]) && 
        !isNaN(coordinates[1])
      );
    };
    
    // Add coverage areas
    const coverageAreas = processedData.coverageAreas.map((area: CoverageArea) => {
      if (!area) return null;
      
      if (area.bounds && Array.isArray(area.bounds) && area.bounds.length === 2) {
        // Fix truncated coordinates in bounds if needed
        if (area.bounds[0]) isValidLatLngArrayFixed(area.bounds[0]);
        if (area.bounds[1]) isValidLatLngArrayFixed(area.bounds[1]);
        
        if (isValidLatLngArray(area.bounds[0]) && isValidLatLngArray(area.bounds[1])) {
          // Rectangular coverage area
          const rectangle = window.L.rectangle(
            area.bounds,
            {
              color: 'rgba(220, 38, 38, 0.5)',
              fillColor: 'rgba(220, 38, 38, 0.1)',
              fillOpacity: 0.3,
              weight: 1,
              dashArray: '5,5'
            }
          ).addTo(layerGroup);
          
          return rectangle;
        }
      } else if (area.center && area.radius && typeof area.radius === 'number' && !isNaN(area.radius)) {
        // Fix truncated coordinates in center if needed
        isValidLatLngArrayFixed(area.center);
        
        if (isValidLatLngArray(area.center)) {
          // Circular coverage area with extra validation
          try {
            const circle = window.L.circle(
              area.center,
              {
                radius: area.radius,
                color: area.type === 'air-defense' ? 'rgba(220, 38, 38, 0.5)' : 'rgba(220, 38, 38, 0.5)',
                fillColor: area.type === 'air-defense' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                fillOpacity: 0.3,
                weight: 1,
                dashArray: '5,5'
              }
            ).addTo(layerGroup);
            
            // Add label for significant areas
            if (area.systemName && area.center) {
              const label = window.L.marker(area.center, {
                icon: window.L.divIcon({
                  html: `<div class="px-1 py-0.5 bg-red-900/80 text-white text-xs rounded">${area.systemName}</div>`,
                  className: '',
                  iconSize: [100, 20],
                  iconAnchor: [50, 10]
                })
              }).addTo(layerGroup);
            }
            
            return circle;
          } catch (error) {
            console.error('Failed to create circle for coverage area:', error, area);
            return null;
          }
        }
      }
      
      return null;
    }).filter(Boolean);
    
    setRadarCoverage(coverageAreas);
    
    // Add transmission paths
    const transmissions = processedData.transmissionPaths.map((path: TransmissionPath) => {
      if (!path || !path.source || !path.destination) return null;
      
      // Fix truncated coordinates if needed
      if (path.source) isValidLatLngArrayFixed(path.source);
      if (path.destination) isValidLatLngArrayFixed(path.destination);
      
      // Validate source and destination coordinates
      if (!isValidLatLngArray(path.source) || !isValidLatLngArray(path.destination)) {
        console.warn('Skipping transmission path due to invalid coordinates');
        return null;
      }
      
      // Create link line
      try {
        const line = window.L.polyline(
          [path.source, path.destination],
          {
            color: path.type === 'data-link' ? 'rgba(147, 51, 234, 0.7)' : 'rgba(220, 38, 38, 0.7)',
            weight: 2,
            opacity: 0.7,
            dashArray: path.encrypted ? '2,4' : null
          }
        ).addTo(layerGroup);
        
        // Add midpoint marker for the link type
        const mid1 = (path.source[0] + path.destination[0]) / 2;
        const mid2 = (path.source[1] + path.destination[1]) / 2;
        
        const label = window.L.marker([mid1, mid2], {
          icon: window.L.divIcon({
            html: `<div class="px-1 py-0.5 bg-purple-900/80 text-white text-[10px] rounded">${path.type || 'link'}</div>`,
            className: '',
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          })
        }).addTo(layerGroup);
        
        return line;
      } catch (error) {
        console.error('Failed to create transmission path:', error);
        return null;
      }
    }).filter(Boolean);
    
    // The rest of your original code for handling EOB elements
    // Add EOB elements
    if (processedEOB) {
      // Air Defense systems
      if (Array.isArray(processedEOB.airDefense)) {
        processedEOB.airDefense.forEach((system: AirDefenseSystem) => {
          if (!system || !system.coordinates) return;
          
          // Fix truncated coordinates if needed
          fixAndValidateLatLng(system.coordinates);
          
          if (!isValidLatLng(system.coordinates)) return;
          
          // Create marker for the system
          const icon = createEOBIcon('air-defense');
          
          try {
            const marker = window.L.marker([system.coordinates.lat, system.coordinates.lng], { 
              icon,
              zIndexOffset: 900
            }).addTo(layerGroup);
            
            // Add coverage circle
            if (system.range !== undefined && typeof system.range === 'number' && !isNaN(system.range)) {
              const rangeCircle = window.L.circle(
                [system.coordinates.lat, system.coordinates.lng],
                {
                  radius: system.range,
                  color: 'rgba(220, 38, 38, 0.6)',
                  fillColor: 'rgba(220, 38, 38, 0.1)',
                  fillOpacity: 0.3,
                  weight: 1,
                  dashArray: '3,6'
                }
              ).addTo(layerGroup);
            }
            
            // Add popup with system information
            const popupContent = `
              <div class="p-3">
                <h3 class="font-bold text-sm text-red-700 mb-1 border-b border-gray-200 pb-1">
                  ${system.name || 'Unknown System'} (${(system.type || 'UNKNOWN').toUpperCase()})
                </h3>
                
                <div class="mt-2 text-xs">
                  <span class="text-gray-500">Range:</span>
                  <div class="text-gray-700">${system.range !== undefined ? `${(system.range / 1000).toFixed(1)} km` : 'Unknown'}</div>
                </div>
                
                ${system.quantity ? `
                  <div class="mt-1 text-xs">
                    <span class="text-gray-500">Quantity:</span>
                    <div class="text-gray-700">${system.quantity}</div>
                  </div>
                ` : ''}
                
                <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
                  <div class="text-xs text-gray-700">
                    ID: ${system.id ? system.id.substring(0, 8) + '...' : 'Unknown'}
                  </div>
                  <div class="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">AD SYSTEM</div>
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
            if (onMarkerClick && system.id) {
              marker.on('click', () => onMarkerClick(system.id, 'sigint'));
            }
          } catch (error) {
            console.error('Failed to create air defense marker:', error);
          }
        });
      }
      
      // Continue with the rest of your code for ground forces, naval forces, and air forces
      // with the fixAndValidateLatLng function applied to each coordinates object
      
      // Ground forces
      if (Array.isArray(processedEOB.groundForces)) {
        processedEOB.groundForces.forEach((unit: GroundForceUnit) => {
          if (!unit || !unit.coordinates) return;
          
          // Fix truncated coordinates if needed
          fixAndValidateLatLng(unit.coordinates);
          
          if (!isValidLatLng(unit.coordinates)) return;
          
          // Rest of your ground forces code...
          const icon = createEOBIcon('ground-force', unit.type);
          
          try {
            const marker = window.L.marker([unit.coordinates.lat, unit.coordinates.lng], { 
              icon,
              zIndexOffset: 800
            }).addTo(layerGroup);
            
            // Add unit identification box
            const label = window.L.marker([unit.coordinates.lat, unit.coordinates.lng + 0.01], {
              icon: window.L.divIcon({
                html: `<div class="px-1 py-0.5 bg-red-900/80 text-white text-[10px] rounded">${unit.echelon || 'UNIT'}</div>`,
                className: '',
                iconSize: [60, 20],
                iconAnchor: [30, 10]
              })
            }).addTo(layerGroup);
            
            // Add popup with unit information
            const popupContent = `
              <div class="p-3">
                <h3 class="font-bold text-sm text-red-700 mb-1 border-b border-gray-200 pb-1">
                  ${unit.name || 'Unknown Unit'}
                </h3>
                
                <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <span class="text-gray-500">Type:</span>
                    <div class="text-gray-700">${unit.type || 'Unknown'}</div>
                  </div>
                  <div>
                    <span class="text-gray-500">Echelon:</span>
                    <div class="text-gray-700">${unit.echelon || 'Unknown'}</div>
                  </div>
                </div>
                
                ${unit.equipment ? `
                  <div class="mt-1 text-xs">
                    <span class="text-gray-500">Equipment:</span>
                    <div class="text-gray-700">${unit.equipment}</div>
                  </div>
                ` : ''}
                
                <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
                  <div class="text-xs text-gray-700">
                    ID: ${unit.id ? unit.id.substring(0, 8) + '...' : 'Unknown'}
                  </div>
                  <div class="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">GROUND UNIT</div>
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
            if (onMarkerClick && unit.id) {
              marker.on('click', () => onMarkerClick(unit.id, 'sigint'));
            }
          } catch (error) {
            console.error('Failed to create ground unit marker:', error);
          }
        });
      }
      
      // Naval forces
      if (Array.isArray(processedEOB.navalForces)) {
        processedEOB.navalForces.forEach((vessel: NavalVessel) => {
          if (!vessel || !vessel.coordinates) return;
          
          // Fix truncated coordinates if needed
          fixAndValidateLatLng(vessel.coordinates);
          
          if (!isValidLatLng(vessel.coordinates)) return;
          
          // Rest of your naval forces code...
          const icon = createEOBIcon('naval', vessel.type);
          
          try {
            const marker = window.L.marker([vessel.coordinates.lat, vessel.coordinates.lng], { 
              icon,
              zIndexOffset: 800
            }).addTo(layerGroup);
            
            // Add heading indicator if available
            if (vessel.heading !== undefined && typeof vessel.heading === 'number' && !isNaN(vessel.heading)) {
              // Create an arrow showing the heading
              const headingMarker = window.L.marker([vessel.coordinates.lat, vessel.coordinates.lng], {
                icon: window.L.divIcon({
                  html: `<div class="w-16 h-16 flex items-center justify-center">
                    <div class="w-0 h-0 border-t-8 border-t-blue-600 border-l-4 border-l-transparent border-r-4 border-r-transparent transform rotate-${Math.round(vessel.heading / 10) * 10}"></div>
                  </div>`,
                  className: '',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })
              }).addTo(layerGroup);
            }
            
            // Add popup with vessel information
            const popupContent = `
              <div class="p-3">
                <h3 class="font-bold text-sm text-red-700 mb-1 border-b border-gray-200 pb-1">
                  ${vessel.name || 'Unknown Vessel'}
                </h3>
                
                <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <span class="text-gray-500">Type:</span>
                    <div class="text-gray-700">${vessel.type || 'Unknown'}</div>
                  </div>
                  <div>
                    <span class="text-gray-500">Class:</span>
                    <div class="text-gray-700">${vessel.class || 'Unknown'}</div>
                  </div>
                </div>
                
                ${(vessel.heading !== undefined || vessel.speed !== undefined) ? `
                  <div class="grid grid-cols-2 gap-2 mt-1 text-xs">
                    ${vessel.heading !== undefined ? `
                      <div>
                        <span class="text-gray-500">Heading:</span>
                        <div class="text-gray-700">${vessel.heading}°</div>
                      </div>
                    ` : ''}
                    ${vessel.speed !== undefined ? `
                      <div>
                        <span class="text-gray-500">Speed:</span>
                        <div class="text-gray-700">${vessel.speed} knots</div>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
                
                <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
                  <div class="text-xs text-gray-700">
                    ID: ${vessel.id ? vessel.id.substring(0, 8) + '...' : 'Unknown'}
                  </div>
                  <div class="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">NAVAL</div>
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
            if (onMarkerClick && vessel.id) {
              marker.on('click', () => onMarkerClick(vessel.id, 'sigint'));
            }
          } catch (error) {
            console.error('Failed to create naval vessel marker:', error);
          }
        });
      }
      
      // Air forces
      if (Array.isArray(processedEOB.airForces)) {
        processedEOB.airForces.forEach((aircraft: AircraftUnit) => {
          if (!aircraft || !aircraft.coordinates) return;
          
          // Fix truncated coordinates if needed
          fixAndValidateLatLng(aircraft.coordinates);
          
          if (!isValidLatLng(aircraft.coordinates)) return;
          
          // Rest of your air forces code...
          const icon = createEOBIcon('air', aircraft.type);
          
          try {
            const marker = window.L.marker([aircraft.coordinates.lat, aircraft.coordinates.lng], { 
              icon,
              zIndexOffset: 800
            }).addTo(layerGroup);
            
            // Add altitude label if available
            if (aircraft.altitude !== undefined && (typeof aircraft.altitude === 'number' || typeof aircraft.altitude === 'string')) {
              const altLabel = window.L.marker([aircraft.coordinates.lat, aircraft.coordinates.lng + 0.01], {
                icon: window.L.divIcon({
                  html: `<div class="px-1 py-0.5 bg-amber-900/80 text-white text-[10px] rounded">${aircraft.altitude} ft</div>`,
                  className: '',
                  iconSize: [60, 20],
                  iconAnchor: [30, 10]
                })
              }).addTo(layerGroup);
            }
            
            // Add heading indicator if available
            if (aircraft.heading !== undefined && typeof aircraft.heading === 'number' && !isNaN(aircraft.heading)) {
              // Create an arrow showing the heading
              const headingMarker = window.L.marker([aircraft.coordinates.lat, aircraft.coordinates.lng], {
                icon: window.L.divIcon({
                  html: `<div class="w-16 h-16 flex items-center justify-center">
                    <div class="w-0 h-0 border-t-8 border-t-amber-600 border-l-4 border-l-transparent border-r-4 border-r-transparent transform rotate-${Math.round(aircraft.heading / 10) * 10}"></div>
                  </div>`,
                  className: '',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })
              }).addTo(layerGroup);
            }
            
            // Add popup with aircraft information
            const popupContent = `
              <div class="p-3">
                <h3 class="font-bold text-sm text-red-700 mb-1 border-b border-gray-200 pb-1">
                  ${aircraft.platform || 'Unknown Aircraft'}
                </h3>
                
                <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <span class="text-gray-500">Type:</span>
                    <div class="text-gray-700">${aircraft.type || 'Unknown'}</div>
                  </div>
                  <div>
                    <span class="text-gray-500">Mission:</span>
                    <div class="text-gray-700">${aircraft.mission || 'Unknown'}</div>
                  </div>
                </div>
                
                ${(aircraft.altitude !== undefined || aircraft.heading !== undefined || aircraft.speed !== undefined) ? `
                  <div class="grid grid-cols-2 gap-2 mt-1 text-xs">
                    ${aircraft.altitude !== undefined ? `
                      <div>
                        <span class="text-gray-500">Altitude:</span>
                        <div class="text-gray-700">${aircraft.altitude} ft</div>
                      </div>
                    ` : ''}
                    ${aircraft.heading !== undefined ? `
                      <div>
                        <span class="text-gray-500">Heading:</span>
                        <div class="text-gray-700">${aircraft.heading}°</div>
                      </div>
                    ` : ''}
                    ${aircraft.speed !== undefined ? `
                      <div>
                        <span class="text-gray-500">Speed:</span>
                        <div class="text-gray-700">${aircraft.speed} knots</div>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
                
                <div class="flex justify-between mt-2 pt-1 border-t border-gray-200">
                  <div class="text-xs text-gray-700">
                    ID: ${aircraft.id ? aircraft.id.substring(0, 8) + '...' : 'Unknown'}
                  </div>
                  <div class="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">AIR</div>
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
            if (onMarkerClick && aircraft.id) {
              marker.on('click', () => onMarkerClick(aircraft.id, 'sigint'));
            }
          } catch (error) {
            console.error('Failed to create aircraft marker:', error);
          }
        });
      }
    }
    
    // Add cleanup function
    return () => {
      layerGroup.clearLayers();
    };
  }, [map, layerGroup, sigintData, visibleLayers, onMarkerClick, theme]);
  
  // Empty render - all work is done in useEffect
  return null;
};

// Helper functions for SIGINT visualization

/**
 * Create an icon for a radar emitter
 * @param type The emitter type
 * @param platformType The platform type (if available)
 * @returns A Leaflet divIcon
 */
function createEmitterIcon(type: string, platformType?: string): any {
  if (!window.L) return null;
  
  // Determine icon based on emitter and platform type
  let iconHtml = '';
  
  // Default radar icon
  iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-red-900/90 backdrop-blur-sm border-2 border-red-700 shadow-lg">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-300">
      <path d="M2 12a10 10 0 1 1 20 0"/>
      <path d="M5 12a7 7 0 1 1 14 0"/>
      <path d="M8 12a4 4 0 1 1 8 0"/>
      <line x1="12" x2="12" y1="12" y2="12.01"/>
    </svg>
  </div>`;
  
  // Special cases based on platform type
  if (platformType) {
    const platform = platformType.toLowerCase();
    
    if (platform.includes('air') || platform.includes('aircraft')) {
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-amber-900/90 backdrop-blur-sm border-2 border-amber-700 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-300">
          <path d="M12 15H7l-1 3h10l-1-3h-3Z"/>
          <path d="M4.99 7 2 10l2 3h14l2-3-2-3Z"/>
          <path d="M18.309 17.5C19.937 19.35 19.937 21 19.5 22"/>
          <path d="M4.69 17.5C3.065 19.35 3.065 21 3.5 22"/>
        </svg>
      </div>`;
    } else if (platform.includes('ground') || platform.includes('vehicle') || platform.includes('mobile')) {
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-green-900/90 backdrop-blur-sm border-2 border-green-700 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-300">
          <path d="M6 13v4"/>
          <path d="M18 13v4"/>
          <path d="M8 6h8"/>
          <path d="M11 21h2"/>
          <rect width="16" height="7" x="4" y="13" rx="2"/>
          <path d="m4.5 13-2-5c-.17-.7-.29-1.29-.29-2a2.8 2.8 0 0 1 3-3h13.58a2.8 2.8 0 0 1 3 3c0 .71-.12 1.3-.29 2l-2 5"/>
        </svg>
      </div>`;
    } else if (platform.includes('naval') || platform.includes('ship')) {
      iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/90 backdrop-blur-sm border-2 border-blue-700 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-300">
          <path d="M18 16H2a4 4 0 0 0 4 4h10"/>
          <path d="M22 12v4a2 2 0 0 1-2 2h-1.1a1.1 1.1 0 0 1-1.03-.77"/>
          <path d="M16 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h7V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2h2"/>
          <path d="M20.97 8.5A.5.5 0 0 0 20.5 8h-3a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3Z"/>
        </svg>
      </div>`;
    }
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
 * Create an icon for an Electronic Order of Battle element
 * @param type The EOB element type
 * @param subtype Optional subtype for further differentiation
 * @returns A Leaflet divIcon
 */
function createEOBIcon(type: string, subtype?: string): any {
  if (!window.L) return null;
  
  // Determine icon based on EOB type
  let iconHtml = '';
  
  if (type === 'air-defense') {
    iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-red-900/90 backdrop-blur-sm border-2 border-red-700 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-300">
        <path d="M12 10v8"/>
        <path d="m15 13-3-3-3 3"/>
        <path d="M17 6a5 5 0 0 0-10 0"/>
        <rect width="16" height="8" x="4" y="16" rx="2"/>
      </svg>
    </div>`;
  } else if (type === 'ground-force') {
    iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-green-900/90 backdrop-blur-sm border-2 border-green-700 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-300">
        <path d="M7 11v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8a5 5 0 0 0-10 0z"/>
        <path d="M12 11V3"/>
      </svg>
    </div>`;
  } else if (type === 'naval') {
    iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/90 backdrop-blur-sm border-2 border-blue-700 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-300">
        <path d="M3 12h18"/>
        <path d="M3 6h18"/>
        <path d="M3 18h18"/>
      </svg>
    </div>`;
  } else if (type === 'air') {
    iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-amber-900/90 backdrop-blur-sm border-2 border-amber-700 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-300">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </svg>
    </div>`;
  } else {
    // Generic unknown icon
    iconHtml = `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900/90 backdrop-blur-sm border-2 border-gray-700 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v.01"/>
        <path d="M12 8a2 2 0 0 1 2 2v2a2 2 0 1 1-4 0v-2a2 2 0 0 1 2-2z"/>
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
 * Get a color for an emitter based on its type
 * @param type The emitter type
 * @param platformType Optional platform type
 * @param opacity The opacity value (0-1)
 * @returns A color string with opacity
 */
function getEmitterColor(type: string, platformType?: string, opacity: number = 1): string {
  let color = `rgba(220, 38, 38, ${opacity})`; // Default red for radar
  
  if (platformType) {
    const platform = platformType.toLowerCase();
    
    if (platform.includes('air') || platform.includes('aircraft')) {
      color = `rgba(217, 119, 6, ${opacity})`; // Amber for air
    } else if (platform.includes('ground') || platform.includes('vehicle') || platform.includes('mobile')) {
      color = `rgba(22, 163, 74, ${opacity})`; // Green for ground
    } else if (platform.includes('naval') || platform.includes('ship')) {
      color = `rgba(37, 99, 235, ${opacity})`; // Blue for naval
    }
  }
  
  return color;
}

/**
 * Format a date/time string for display
 * @param dateString The date string to format
 * @returns Formatted date string
 */
function formatDateTime(dateString: string): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

export default SigintVisualizationLayer;