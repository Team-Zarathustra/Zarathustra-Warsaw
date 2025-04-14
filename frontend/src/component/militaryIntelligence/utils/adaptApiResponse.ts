// components/military-intelligence/utils/adaptApiResponse.ts
import { 
  AnalysisResponse as ApiAnalysisResponse,
  IntelligenceData,
  TacticalObservation,
  ThreatAssessment,
  ResourceStatus,
  QualityScore 
} from '../../../type/intelligence';

import { 
    SigintAnalysisResponse, 
    FusionAnalysisResponse,
    RadarEmitter
  } from '../../../type/sigintTypes';

import { 
  AdaptedAnalysisResponse, 
  AdaptedIntelligence
} from '../../../type/intelligence';

export const adaptApiResponseToComponentModel = (apiResponse: ApiAnalysisResponse): AdaptedAnalysisResponse => {
  const { 
    intelligence, 
    reportId, 
    timestamp, 
    language, 
    qualityScores, 
    analysisId,
    predictions,
    groupedPredictions,
    predictionSummary 
  } = apiResponse;
  
  // Create a compatible AdaptedIntelligence object from IntelligenceData
  const adaptedIntelligence: AdaptedIntelligence = {
    reportId: reportId,
    analysisId: analysisId || `analysis-${Date.now()}`,
    summary: intelligence.summary || '',
    urgentIntelligence: intelligence.keyIntelligence?.[0]?.item || '',
    
    // Transform tactical observations to match expected format
    tacticalObservations: (intelligence.enemyForces || []).map(force => ({
      text: `${force.type || 'Unknown force'}: ${force.activity || 'Unknown activity'}`,
      // Use a valid category value - "position" is a safe default
      category: "position" as const,
      // Add entities with proper force type
      entities: {
        force: "enemy" as const,
        size: force.size,
        equipment: force.type,
        status: "active" as const
      },
      location: force.location ? {
        name: force.location,
        coordinates: force.coordinates ? {
          latitude: force.coordinates[0],
          longitude: force.coordinates[1]
        } : undefined,
        accuracy: "approximate" as const
      } : undefined,
      time: force.time || undefined,
      confidence: (force.confidence || 'medium') as QualityScore
    })),
    
    // Transform threats
    threats: (intelligence.threats || []).map(threat => ({
      description: threat.description || '',
      severity: threat.severity || 'medium', // Use the correct severity type without casting
      category: threat.category || 'kinetic',
      immediacy: threat.immediacy || 'near-term',
      location: threat.location || '',
      confidence: (threat.confidence || 'medium') as QualityScore
    })),
    
    // Extract enemy forces information
    enemyForces: (intelligence.enemyForces || []).map(force => 
      `${force.type || 'Unknown'}: ${force.activity || 'Unknown activity'} at ${force.location || 'unknown location'}`
    ),
    
    // Transform friendly forces
    friendlyForces: (intelligence.friendlyForces || []).map(force => ({
      type: force.type || 'Unknown',
      category: 'equipment' as const,
      status: 'operational' as const,
      description: force.activity || 'No details available',
      confidence: (force.confidence || 'medium') as QualityScore
    })),
    
    // Extract location information
    locations: (intelligence.locations || []).map(loc => 
      `${loc.name || 'Unknown location'}: ${loc.description || 'No details'}`
    ),
    
    // Extract resource information with better handling of nested structure
    resourceStatus: intelligence.resourceStatus?.equipment?.map(equipment => 
      `${equipment.type}: ${equipment.status} (${equipment.quantity || 'Unknown quantity'})`
    ) || [],
    
    // Handle personnel resources if available
    personnelStatus: intelligence.resourceStatus?.personnel ? {
      status: intelligence.resourceStatus.personnel.status || 'Unknown',
      casualties: intelligence.resourceStatus.personnel.casualties || undefined,
      confidence: (intelligence.resourceStatus.personnel.confidence || 'medium') as QualityScore
    } : null,
    
    // Handle supplies if available
    suppliesStatus: intelligence.resourceStatus?.supplies ? {
      status: intelligence.resourceStatus.supplies.status || 'Unknown',
      shortages: intelligence.resourceStatus.supplies.shortages || [],
      confidence: (intelligence.resourceStatus.supplies.confidence || 'medium') as QualityScore
    } : null,
    
    // Extract communications status if available
    communicationsStatus: (intelligence.communicationsElectronic?.incidents || []).map(incident => 
      `${incident.type || 'Unknown'}: ${incident.description || 'No details'}`
    ),
    
    // Handle electronic warfare data if available - safely handle the "jamming" field that might not exist
    electronicWarfare: (intelligence.communicationsElectronic?.incidents || [])
      .filter(incident => incident.type === 'jamming')
      .map(item => ({
        type: item.type || 'Unknown',
        description: item.description || 'No details',
        location: item.suspectedSource || 'Unknown location',
        confidence: (item.confidence || 'medium') as QualityScore
      })),
    
    // Handle civilian situation with proper structure - safely provide default empty arrays
    civilianSituation: intelligence.civilianSituation ? {
      populations: intelligence.civilianSituation.civilianInfrastructure || [],
      infrastructure: intelligence.civilianSituation.civilianInfrastructure || [],
      sentiment: intelligence.civilianSituation.populationStatus || null,
      confidence: (intelligence.civilianSituation.confidence || 'medium') as QualityScore
    } : null,
    
    // Extract control zones if available
    controlZones: (intelligence.controlZones || []).map(zone => ({
      name: zone.name || 'Unknown zone',
      controlledBy: zone.controllingForce || 'Unknown',
      description: '',  // Not available in original data
      boundaryPoints: [], // Not available in original data
      confidence: (zone.confidence || 'medium') as QualityScore
    })),
    
    // Weather information - safely handle missing fields
    weather: {
      current: 'Unknown',
      forecast: 'Unknown',
      impact: 'Unknown',
      confidence: 'medium' as QualityScore
    },
    
    // Terrain information - safely handle missing fields
    terrain: {
      description: 'Unknown',
      impact: 'Unknown',
      confidence: 'medium' as QualityScore
    },
    
    // Extract reliability information with more details
    reliability: {
      confidence: intelligence.reliabilityAssessment?.overallReliability || 'medium',
      assessment: '',  // Provide default empty string for missing field
      factors: intelligence.reliabilityAssessment?.factors || {},
      firsthandObservations: intelligence.reliabilityAssessment?.firsthandObservations || [],
      secondhandInformation: intelligence.reliabilityAssessment?.secondhandInformation || [],
      uncertainInformation: intelligence.reliabilityAssessment?.uncertainInformation || []
    }
  };
  
  return {
    reportId,
    analysisId: analysisId || adaptedIntelligence.analysisId,
    intelligence: adaptedIntelligence,
    timestamp,
    language,
    qualityScores: qualityScores || {},
    predictions: predictions || [],
    groupedPredictions: groupedPredictions || {
      immediate: [],
      short: [],
      medium: [],
      long: []
    },
    predictionSummary: predictionSummary || ''
  };
};

/**
 * Adapts SIGINT API response to a consistent component model
 */
export const adaptSigintResponseToComponentModel = (sigintResponse: SigintAnalysisResponse): SigintAnalysisResponse => {
    // If the response is null or undefined, return an empty structure
    if (!sigintResponse) {
      return {
        analysisId: '',
        timestamp: new Date().toISOString(),
        emitters: [],
        coverage: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          region: {
            northEast: { latitude: 0, longitude: 0 },
            southWest: { latitude: 0, longitude: 0 }
          }
        }
      };
    }
    
    // Process emitters to ensure they have the expected structure
    const adaptedEmitters: RadarEmitter[] = (sigintResponse.emitters || []).map(emitter => {
      return {
        ...emitter,
        id: emitter.id || `emitter-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        firstDetected: emitter.firstDetected || sigintResponse.timestamp,
        lastDetected: emitter.lastDetected || sigintResponse.timestamp,
        classification: emitter.classification || {
          type: 'unknown',
          confidence: 'medium'
        },
        emissions: emitter.emissions || [],
        locations: emitter.locations || [],
        movements: emitter.movements || [],
        confidence: emitter.confidence || 'medium'
      };
    });
    
    return {
      ...sigintResponse,
      analysisId: sigintResponse.analysisId || `sigint-${Date.now()}`,
      emitters: adaptedEmitters,
      coverage: sigintResponse.coverage || {
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString(),
        region: {
          northEast: { latitude: 0, longitude: 0 },
          southWest: { latitude: 0, longitude: 0 }
        }
      }
    };
  };
  
  /**
   * Adapts Fusion API response to a consistent component model
   */
  export const adaptFusionResponseToComponentModel = (fusionResponse: FusionAnalysisResponse): FusionAnalysisResponse => {
    // If the response is null or undefined, return an empty structure
    if (!fusionResponse) {
      return {
        fusionId: '',
        timestamp: new Date().toISOString(),
        humintAnalysisId: '',
        sigintAnalysisId: '',
        fusedEntities: []
      };
    }
    
    // Process fused entities to ensure they have the expected structure
    const adaptedEntities = (fusionResponse.fusedEntities || []).map(entity => {
      return {
        ...entity,
        id: entity.id || `fusion-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: entity.type || 'other',
        humintSources: entity.humintSources || [],
        sigintSources: entity.sigintSources || [],
        combinedConfidence: entity.combinedConfidence || 'medium',
        lastUpdated: entity.lastUpdated || fusionResponse.timestamp,
        correlations: (entity.correlations || []).map(correlation => ({
          ...correlation,
          humintEntityId: correlation.humintEntityId || '',
          sigintEmitterId: correlation.sigintEmitterId || '',
          strength: correlation.strength || {
            value: 0.5,
            factors: {
              spatial: 0.5,
              temporal: 0.5,
              semantic: 0.5
            }
          },
          correlationType: correlation.correlationType || 'possible'
        }))
      };
    });
    
    return {
      ...fusionResponse,
      fusionId: fusionResponse.fusionId || `fusion-${Date.now()}`,
      fusedEntities: adaptedEntities
    };
  };

// Filter functions for generic items
export const filterGenericItems = (items: string[]): string[] => {
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

export const filterGenericObservations = (observations: TacticalObservation[] | undefined): TacticalObservation[] => {
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

export const filterGenericResources = (resources: ResourceStatus[]): ResourceStatus[] => {
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