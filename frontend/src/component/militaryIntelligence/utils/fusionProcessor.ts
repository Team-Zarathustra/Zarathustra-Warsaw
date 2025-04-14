import { AdaptedAnalysisResponse, QualityScore, Location, Coordinates } from '../../../type/intelligence';
import { 
  SigintAnalysisResponse, 
  FusionAnalysisResponse, 
  RadarEmitter, 
  ElectronicOrderOfBattle,
  AirDefenseSystem,
  GroundForceUnit,
  NavalVessel,
  AircraftUnit
} from '../../../type/sigintTypes';

/**
 * Process HUMINT and SIGINT data to enhance the fusion visualization
 * @param humintData The HUMINT analysis data
 * @param sigintData The SIGINT analysis data
 * @param fusionData The fusion analysis data
 * @returns Enhanced fusion data for visualization
 */
export const processFusionData = (
  humintData: AdaptedAnalysisResponse | null | undefined,
  sigintData: SigintAnalysisResponse | null | undefined,
  fusionData: FusionAnalysisResponse | null | undefined
) => {
  // If we don't have both HUMINT and SIGINT data, return null
  if (!humintData || !sigintData) {
    return null;
  }
  
  // Initialize fusion results
  const results = {
    entities: [] as any[],
    correlations: [] as any[],
    predictedEvents: [] as any[],
    threatAreas: [] as any[],
    overview: {
      threatLevel: 'LOW',
      confidenceLevel: 'medium',
      correlationStrength: 0,
      timestamp: new Date().toISOString()
    }
  };
  
  // Process HUMINT entities
  const humintEntities = processHumintEntities(humintData);
  
  // Process SIGINT entities
  const sigintEntities = processSigintEntities(sigintData);
  
  // Extended version of FusionAnalysisResponse that includes predictions
  interface ExtendedFusionAnalysisResponse extends FusionAnalysisResponse {
    predictions?: any[];
  }
  
  // If we have fusion data, use it directly
  if (fusionData && fusionData.fusedEntities) {
    // Cast to extended type
    const extendedFusionData = fusionData as ExtendedFusionAnalysisResponse;
    
    // Process fusion entities
    results.entities = processFusionEntities(fusionData, humintEntities, sigintEntities);
    
    // Process correlations between entities
    results.correlations = processFusionCorrelations(fusionData);
    
    // Process predicted events from fusion data
    if (extendedFusionData.predictions) {
      results.predictedEvents = processFusionPredictions(extendedFusionData.predictions);
    }
    
    // Calculate overall threat level based on fusion data
    results.overview.threatLevel = calculateThreatLevel(fusionData);
    results.overview.timestamp = fusionData.timestamp;
    
    // Calculate average correlation strength
    const allCorrelations = fusionData.fusedEntities.flatMap(e => e.correlations || []);
    if (allCorrelations.length > 0) {
      const avgStrength = allCorrelations.reduce((sum, corr) => sum + corr.strength.value, 0) / allCorrelations.length;
      results.overview.correlationStrength = avgStrength;
    }
    
    // Generate threat areas based on correlation clusters
    results.threatAreas = generateThreatAreas(fusionData, humintData, sigintData);
  } else {
    // If no fusion data, we still want to display HUMINT and SIGINT entities
    results.entities = [...humintEntities, ...sigintEntities];
    
    // Generate simple correlations based on proximity
    results.correlations = generateSimpleCorrelations(humintEntities, sigintEntities);
    
    // Use HUMINT predictions if available
    if (humintData.predictions) {
      results.predictedEvents = humintData.predictions.map((p) => ({
        id: p.id,
        type: 'event',
        name: p.name,
        description: p.description,
        timeframe: p.timeframe,
        formattedTimeframe: p.formattedTimeframe,
        confidence: p.confidence,
        confidenceLevel: getConfidenceLevel(p.confidence),
        location: null, // HUMINT predictions might not have locations
        evidenceEvents: p.evidenceEvents || []
      }));
    }
  }
  
  return results;
};

/**
 * Process HUMINT entities from analysis data
 * @param humintData The HUMINT analysis data
 * @returns Processed HUMINT entities
 */
function processHumintEntities(humintData: AdaptedAnalysisResponse): any[] {
  const entities: any[] = [];
  
  // Process enemy forces
  if (humintData.intelligence.enemyForces) {
    humintData.intelligence.enemyForces.forEach((force, index) => {
      entities.push({
        id: `humint-force-${index}`,
        type: 'force',
        sourceType: 'humint',
        name: force,
        description: force,
        location: null, // This would need coordinate extraction from the text
        confidence: 'medium',
        timestamp: humintData.timestamp
      });
    });
  }
  
  // Process tactical observations
  if (humintData.intelligence.tacticalObservations) {
    humintData.intelligence.tacticalObservations.forEach((obs, index) => {
      entities.push({
        id: `humint-obs-${index}`,
        type: 'observation',
        sourceType: 'humint',
        name: `Observation ${index + 1}`,
        description: obs.text,
        location: obs.location,
        category: obs.category,
        entities: obs.entities,
        confidence: obs.confidence || 'medium',
        timestamp: humintData.timestamp
      });
    });
  }
  
  // Process threat assessments
  if (humintData.intelligence.threats) {
    humintData.intelligence.threats.forEach((threat, index) => {
      // Handle location which could be a string or a Location object
      let locationObj = null;
      if (threat.location) {
        if (typeof threat.location === 'string') {
          locationObj = { name: threat.location };
        } else {
          locationObj = threat.location;
        }
      }
      
      entities.push({
        id: `humint-threat-${index}`,
        type: 'threat',
        sourceType: 'humint',
        name: `Threat ${index + 1}`,
        description: threat.description,
        severity: threat.severity,
        category: threat.category,
        immediacy: threat.immediacy,
        location: locationObj,
        confidence: threat.confidence || 'medium',
        timestamp: humintData.timestamp
      });
    });
  }
  
  // Process locations
  if (humintData.intelligence.locations) {
    humintData.intelligence.locations.forEach((loc, index) => {
      entities.push({
        id: `humint-location-${index}`,
        type: 'location',
        sourceType: 'humint',
        name: loc,
        description: loc,
        // Note: we'd need to extract coordinates from the location text
        location: null,
        confidence: 'medium',
        timestamp: humintData.timestamp
      });
    });
  }
  
  return entities;
}

/**
 * Process SIGINT entities from analysis data
 * @param sigintData The SIGINT analysis data
 * @returns Processed SIGINT entities
 */
function processSigintEntities(sigintData: SigintAnalysisResponse): any[] {
  const entities: any[] = [];
  
  // Process radar emitters
  if (sigintData.emitters) {
    sigintData.emitters.forEach((emitter) => {
      // Find the most recent location
      const latestLocation = emitter.locations && emitter.locations.length > 0 ? 
        [...emitter.locations].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0] : null;
      
      entities.push({
        id: emitter.id,
        type: 'emitter',
        sourceType: 'sigint',
        name: emitter.classification.type || 'Unknown Radar',
        description: `${emitter.classification.type || 'Unknown'} ${emitter.classification.model || ''}`,
        classification: emitter.classification.type,
        platformType: emitter.classification.type,
        platformModel: emitter.classification.model,
        characteristics: emitter.classification.capabilities,
        location: latestLocation ? {
          coordinates: latestLocation.coordinates,
          accuracy: latestLocation.accuracy
        } : null,
        confidence: emitter.confidence || 'medium',
        firstDetected: emitter.firstDetected,
        lastDetected: emitter.lastDetected,
        timestamp: sigintData.timestamp
      });
    });
  }
  
  // Add type definition for Electronic Order of Battle if it exists on SigintAnalysisResponse
  interface ExtendedSigintAnalysisResponse extends SigintAnalysisResponse {
    electronicOrderOfBattle?: ElectronicOrderOfBattle;
  }
  
  // Process Electronic Order of Battle elements
  const extendedData = sigintData as ExtendedSigintAnalysisResponse;
  if (extendedData.electronicOrderOfBattle) {
    const eob = extendedData.electronicOrderOfBattle;
    
    // Air Defense elements
    if (eob.airDefense) {
      eob.airDefense.forEach((element: AirDefenseSystem, index: number) => {
        entities.push({
          id: `sigint-ad-${index}`,
          type: 'air-defense',
          sourceType: 'sigint',
          name: element.name || 'Unknown Air Defense',
          description: `${element.name || 'Unknown'} - ${element.type || 'SAM'}`,
          systemType: element.type,
          location: element.coordinates ? {
            coordinates: {
              latitude: element.coordinates.lat,
              longitude: element.coordinates.lng
            },
            accuracy: 100 // Default accuracy
          } : null,
          range: element.range,
          confidence: 'medium', // Default confidence
          timestamp: sigintData.timestamp
        });
      });
    }
    
    // Ground Force elements
    if (eob.groundForces) {
      eob.groundForces.forEach((element: GroundForceUnit, index: number) => {
        entities.push({
          id: `sigint-gf-${index}`,
          type: 'ground-force',
          sourceType: 'sigint',
          name: element.name || 'Unknown Ground Unit',
          description: `${element.name || 'Unknown'} - ${element.echelon || ''} ${element.equipment || ''}`,
          unitType: element.type,
          echelon: element.echelon,
          equipment: element.equipment,
          location: element.coordinates ? {
            coordinates: {
              latitude: element.coordinates.lat,
              longitude: element.coordinates.lng
            },
            accuracy: 200 // Default accuracy
          } : null,
          confidence: 'medium', // Default confidence
          timestamp: sigintData.timestamp
        });
      });
    }
    
    // Naval elements
    if (eob.navalForces) {
      eob.navalForces.forEach((element: NavalVessel, index: number) => {
        entities.push({
          id: `sigint-naval-${index}`,
          type: 'naval',
          sourceType: 'sigint',
          name: element.name || 'Unknown Naval Vessel',
          description: `${element.name || 'Unknown'} - ${element.class || 'vessel'}`,
          vesselClass: element.class,
          vesselType: element.type,
          location: element.coordinates ? {
            coordinates: {
              latitude: element.coordinates.lat,
              longitude: element.coordinates.lng
            },
            accuracy: 500 // Default accuracy for naval
          } : null,
          confidence: 'medium', // Default confidence
          timestamp: sigintData.timestamp
        });
      });
    }
    
    // Air elements
    if (eob.airForces) {
      eob.airForces.forEach((element: AircraftUnit, index: number) => {
        entities.push({
          id: `sigint-air-${index}`,
          type: 'air',
          sourceType: 'sigint',
          name: element.platform || 'Unknown Aircraft',
          description: `${element.platform || 'Unknown'} - ${element.mission || 'mission'}`,
          aircraftType: element.type,
          mission: element.mission,
          location: element.coordinates ? {
            coordinates: {
              latitude: element.coordinates.lat,
              longitude: element.coordinates.lng
            },
            accuracy: 1000 // Lower accuracy for air assets
          } : null,
          confidence: 'medium', // Default confidence
          timestamp: sigintData.timestamp
        });
      });
    }
  }
  
  return entities;
}

/**
 * Process fusion entities from analysis data
 * @param fusionData The fusion analysis data
 * @param humintEntities The processed HUMINT entities
 * @param sigintEntities The processed SIGINT entities
 * @returns Processed fusion entities
 */
function processFusionEntities(
  fusionData: FusionAnalysisResponse,
  humintEntities: any[],
  sigintEntities: any[]
): any[] {
  const entities: any[] = [];
  
  // Process fused entities
  if (fusionData.fusedEntities) {
    fusionData.fusedEntities.forEach((entity) => {
      // Find all HUMINT sources
      const humintSources = entity.humintSources.map(id => 
        humintEntities.find(h => h.id === id)
      ).filter(Boolean);
      
      // Find all SIGINT sources
      const sigintSources = entity.sigintSources.map(id => 
        sigintEntities.find(s => s.id === id)
      ).filter(Boolean);
      
      // Find a good location estimate - prefer SIGINT then HUMINT
      let location = null;
      
      // First try SIGINT as it's usually more precise
      for (const source of sigintSources) {
        if (source.location) {
          location = source.location;
          break;
        }
      }
      
      // If no SIGINT location, try HUMINT
      if (!location) {
        for (const source of humintSources) {
          if (source.location) {
            location = source.location;
            break;
          }
        }
      }
      
      // Extract a meaningful description from HUMINT sources
      let description = '';
      if (humintSources.length > 0) {
        description = humintSources[0].description || '';
      }
      
      // Add detail from SIGINT if available
      if (sigintSources.length > 0) {
        const sigintInfo = sigintSources[0];
        const sigintDesc = sigintInfo.description || sigintInfo.classification || '';
        
        if (description) {
          description += ` (${sigintDesc})`;
        } else {
          description = sigintDesc;
        }
      }
      
      entities.push({
        id: entity.id,
        type: entity.type,
        sourceType: 'fusion',
        name: `${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}`,
        description,
        humintSources: entity.humintSources,
        sigintSources: entity.sigintSources,
        location,
        correlations: entity.correlations,
        confidence: entity.combinedConfidence,
        timestamp: entity.lastUpdated || fusionData.timestamp
      });
    });
  }
  
  return entities;
}

/**
 * Process fusion correlations
 * @param fusionData The fusion analysis data
 * @returns Processed correlations
 */
function processFusionCorrelations(fusionData: FusionAnalysisResponse): any[] {
  const correlations: any[] = [];
  
  // Process correlations from fused entities
  if (fusionData.fusedEntities) {
    fusionData.fusedEntities.forEach((entity) => {
      if (entity.correlations) {
        entity.correlations.forEach((correlation) => {
          correlations.push({
            id: `${correlation.humintEntityId}-${correlation.sigintEmitterId}`,
            entityId: entity.id,
            humintEntityId: correlation.humintEntityId,
            sigintEmitterId: correlation.sigintEmitterId,
            type: correlation.correlationType,
            strength: correlation.strength.value,
            factors: correlation.strength.factors
          });
        });
      }
    });
  }
  
  return correlations;
}

/**
 * Process fusion predictions
 * @param predictions The fusion predictions
 * @returns Processed predictions
 */
function processFusionPredictions(predictions: any[]): any[] {
  if (!predictions) return [];
  
  return predictions.map((prediction) => ({
    id: prediction.id,
    type: prediction.type || 'event',
    name: prediction.name,
    description: prediction.description,
    timeframe: prediction.timeframe,
    formattedTimeframe: prediction.formattedTimeframe,
    confidence: prediction.confidence,
    confidenceLevel: getConfidenceLevel(prediction.confidence),
    location: prediction.location,
    evidenceEvents: prediction.evidenceEvents || [],
    supportingEvidence: prediction.supportingEvidence || 0
  }));
}

/**
 * Calculate threat level based on fusion data
 * @param fusionData The fusion analysis data
 * @returns Threat level assessment
 */
function calculateThreatLevel(fusionData: FusionAnalysisResponse): string {
  // Default to LOW
  let threatLevel = 'LOW';
  
  // Count high-confidence correlations
  const correlations = fusionData.fusedEntities.flatMap(entity => entity.correlations || []);
  const highConfCorrelations = correlations.filter(c => c.strength.value > 0.7).length;
  
  // Count entities by type
  const militaryEntities = fusionData.fusedEntities.filter(e => 
    e.type.toLowerCase().includes('military') || 
    e.type.toLowerCase().includes('force') ||
    e.type.toLowerCase().includes('vehicle') ||
    e.type.toLowerCase().includes('radar')
  ).length;
  
  // Calculate threat level based on correlation quality and entity types
  if (highConfCorrelations >= 3 && militaryEntities >= 2) {
    threatLevel = 'HIGH';
  } else if (highConfCorrelations >= 1 || militaryEntities >= 1) {
    threatLevel = 'MEDIUM';
  }
  
  return threatLevel;
}

/**
 * Generate simple correlations based on proximity between HUMINT and SIGINT entities
 * @param humintEntities The processed HUMINT entities
 * @param sigintEntities The processed SIGINT entities
 * @returns Simple correlations based on proximity
 */
function generateSimpleCorrelations(humintEntities: any[], sigintEntities: any[]): any[] {
  const correlations: any[] = [];
  
  // For each HUMINT entity with a location
  humintEntities.forEach((humint) => {
    if (!humint.location || !humint.location.coordinates) return;
    
    // For each SIGINT entity with a location
    sigintEntities.forEach((sigint) => {
      if (!sigint.location || !sigint.location.coordinates) return;
      
      // Get coordinates, handling different possible structures
      const humintLat = humint.location.coordinates.latitude || 
                        humint.location.coordinates.lat || 
                        (Array.isArray(humint.location.coordinates) ? humint.location.coordinates[0] : null);
      const humintLng = humint.location.coordinates.longitude || 
                        humint.location.coordinates.lng || 
                        (Array.isArray(humint.location.coordinates) ? humint.location.coordinates[1] : null);
      
      const sigintLat = sigint.location.coordinates.latitude || 
                        sigint.location.coordinates.lat || 
                        (Array.isArray(sigint.location.coordinates) ? sigint.location.coordinates[0] : null);
      const sigintLng = sigint.location.coordinates.longitude || 
                        sigint.location.coordinates.lng || 
                        (Array.isArray(sigint.location.coordinates) ? sigint.location.coordinates[1] : null);
      
      // Skip if we couldn't get valid coordinates
      if (humintLat === null || humintLng === null || sigintLat === null || sigintLng === null) return;
      
      // Calculate distance between points
      const distance = calculateDistance(
        humintLat,
        humintLng,
        sigintLat,
        sigintLng
      );
      
      // If within 10 km (0.1 degrees is approximately 10 km)
      if (distance < 0.1) {
        // Calculate correlation strength based on distance
        const strength = Math.max(0.1, 1 - (distance / 0.1));
        
        correlations.push({
          id: `${humint.id}-${sigint.id}`,
          humintEntityId: humint.id,
          sigintEmitterId: sigint.id,
          type: 'proximity',
          strength,
          factors: {
            spatial: strength,
            temporal: 0.5, // Default temporal correlation
            semantic: 0.3  // Default semantic correlation
          }
        });
      }
    });
  });
  
  return correlations;
}

/**
 * Generate threat areas based on correlation clusters
 * @param fusionData The fusion analysis data
 * @param humintData The HUMINT analysis data
 * @param sigintData The SIGINT analysis data
 * @returns Threat areas
 */
function generateThreatAreas(
  fusionData: FusionAnalysisResponse,
  humintData: AdaptedAnalysisResponse,
  sigintData: SigintAnalysisResponse
): any[] {
  // Default threat areas
  const threatAreas: any[] = [];
  
  // Get all entity coordinates from fusion data
  const entityCoordinates: {lat: number, lng: number, strength: number}[] = [];
  
  // For each fused entity
  fusionData.fusedEntities.forEach((entity) => {
    // For each correlation in the entity
    entity.correlations.forEach((correlation) => {
      // Find related HUMINT entity
      const humintEntity = findHumintEntityById(humintData, correlation.humintEntityId);
      
      // Find related SIGINT entity (emitter)
      const sigintEntity = findSigintEntityById(sigintData, correlation.sigintEmitterId);
      
      // Try to get coordinates from HUMINT entity
      if (humintEntity && 
          humintEntity.location && 
          humintEntity.location.coordinates) {
        const coords = humintEntity.location.coordinates;
        
        // Handle different possible coordinate formats
        const lat = typeof coords.latitude !== 'undefined' ? coords.latitude : 
                    typeof coords.lat !== 'undefined' ? coords.lat : 
                    Array.isArray(coords) ? coords[0] : null;
                    
        const lng = typeof coords.longitude !== 'undefined' ? coords.longitude : 
                    typeof coords.lng !== 'undefined' ? coords.lng : 
                    Array.isArray(coords) ? coords[1] : null;
        
        if (lat !== null && lng !== null) {
          entityCoordinates.push({
            lat,
            lng,
            strength: correlation.strength.value
          });
        }
      }
      
      // Try to get coordinates from SIGINT emitter
      if (sigintEntity && sigintEntity.locations && sigintEntity.locations.length > 0) {
        // Get latest location
        const latestLocation = [...sigintEntity.locations].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        if (latestLocation && latestLocation.coordinates) {
          entityCoordinates.push({
            lat: latestLocation.coordinates.latitude,
            lng: latestLocation.coordinates.longitude,
            strength: correlation.strength.value
          });
        }
      }
    });
  });
  
  // If we have enough coordinates, generate threat areas
  if (entityCoordinates.length >= 3) {
    // Calculate the centroid of all coordinates
    const sumLat = entityCoordinates.reduce((sum, coord) => sum + coord.lat, 0);
    const sumLng = entityCoordinates.reduce((sum, coord) => sum + coord.lng, 0);
    const avgLat = sumLat / entityCoordinates.length;
    const avgLng = sumLng / entityCoordinates.length;
    
    // Calculate the average distance from centroid
    const distances = entityCoordinates.map(coord => 
      calculateDistance(avgLat, avgLng, coord.lat, coord.lng)
    );
    const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
    
    // Create a threat area centered on the centroid
    threatAreas.push({
      id: 'primary-threat-area',
      type: 'threat-area',
      center: [avgLat, avgLng],
      radius: Math.max(avgDistance * 111000, 5000), // Convert to meters, minimum 5km
      name: 'Primary Area of Interest',
      description: 'Significant activity detected in this area',
      threatLevel: calculateThreatLevel(fusionData),
      confidence: 'medium',
      timestamp: fusionData.timestamp
    });
  }
  
  return threatAreas;
}

// Helper functions

/**
 * Calculate distance between two coordinates in degrees
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in degrees
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Simple Euclidean distance in degrees (approximate for small distances)
  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
}

/**
 * Find a HUMINT entity by ID
 * @param humintData The HUMINT analysis data
 * @param id The entity ID to find
 * @returns The found entity or null
 */
function findHumintEntityById(humintData: AdaptedAnalysisResponse, id: string): any {
  // For HUMINT data, we need to search across different arrays in the intelligence object
  
  // Check tactical observations
  if (humintData.intelligence.tacticalObservations) {
    const foundObs = humintData.intelligence.tacticalObservations.find(obs => 
      `humint-obs-${humintData.intelligence.tacticalObservations.indexOf(obs)}` === id || 
      (obs as any).id === id
    );
    if (foundObs) return foundObs;
  }
  
  // Check threats
  if (humintData.intelligence.threats) {
    for (let i = 0; i < humintData.intelligence.threats.length; i++) {
      if (`humint-threat-${i}` === id) {
        return humintData.intelligence.threats[i];
      }
    }
  }
  
  // Check enemy forces
  if (humintData.intelligence.enemyForces) {
    for (let i = 0; i < humintData.intelligence.enemyForces.length; i++) {
      if (`humint-force-${i}` === id) {
        return { description: humintData.intelligence.enemyForces[i] };
      }
    }
  }
  
  // Check locations
  if (humintData.intelligence.locations) {
    for (let i = 0; i < humintData.intelligence.locations.length; i++) {
      if (`humint-location-${i}` === id) {
        return { name: humintData.intelligence.locations[i] };
      }
    }
  }
  
  return null;
}

/**
 * Find a SIGINT entity by ID
 * @param sigintData The SIGINT analysis data
 * @param id The entity ID to find
 * @returns The found entity or null
 */
function findSigintEntityById(sigintData: SigintAnalysisResponse, id: string): RadarEmitter | null {
  // Check emitters
  if (sigintData.emitters) {
    const foundEmitter = sigintData.emitters.find(e => e.id === id);
    if (foundEmitter) return foundEmitter;
  }
  
  // If not found in emitters, check EOB (we'll assume it's not in EOB since type doesn't match RadarEmitter)
  // This part would need to be updated with appropriate types if EOB entities can be correlated
  
  return null;
}

/**
 * Convert a numeric confidence value to a confidence level string
 * @param confidence The numeric confidence value (0-1)
 * @returns Confidence level string
 */
function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}