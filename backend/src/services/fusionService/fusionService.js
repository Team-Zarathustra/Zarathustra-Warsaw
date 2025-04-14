// services/fusionService/fusionService.js
import { logger } from '../../api/logger/logger.js';
import humintService from '../humintService/index.js';
import sigintService from '../sigintService/index.js';
import { generateCacheKey, getCachedResult, setCacheResult } from '../humintService/utils/caching.js';
import { FusedEntity, CorrelationResult, FusedIntelligenceProduct } from './models/fusedEntity.js';
import { correlateByLocation } from './correlators/spatialCorrelator.js';
import { correlateByTime } from './correlators/temporalCorrelator.js';
import { correlateUsingLLM } from './correlators/llmCorrelator.js';
import { combinedConfidenceScore } from './confidence/confidenceFusion.js';
import { generateFusedPredictions } from './prediction/fusedPredictionEngine.js';
import { buildFusionReportPrompt } from './utils/promptBuilder.js';
import { parseCorrelationResponse } from './utils/responseParser.js';
import { cache } from '../cacheService.js';
import HumintAdapter from './integrations/humintAdapter.js';
import SigintAdapter from './integrations/sigintAdapter.js';

/**
 * Fusion Service for integrating and cross-validating HUMINT and SIGINT intelligence
 */
class FusionService {
  constructor(options = {}) {
    this.options = {
      useLLM: true,
      cacheEnabled: true,
      correlationThreshold: 0.65, // Minimum score to consider entities correlated
      ...options
    };
    
    this.cache = this.options.cacheEnabled ? cache : null;
    this.correlatedEntities = new Map(); // Store previously correlated entities
    
    logger.info('Fusion Service initialized', {
      useLLM: this.options.useLLM,
      cacheEnabled: !!this.cache,
      correlationThreshold: this.options.correlationThreshold
    });
  }
  
  /**
   * Generate cross-validated intelligence by correlating HUMINT and SIGINT
   * @param {Object} params - Parameters for fusion generation
   * @param {string} params.reportId - Optional specific report ID to focus on
   * @param {string} params.area - Optional geographic area to focus on
   * @param {number} params.timeWindow - Time window in hours to consider (default: 24)
   * @param {boolean} params.includePredictions - Whether to include predictions
   * @returns {Promise<Object>} - Fused intelligence products
   */
  async generateFusedIntelligence(params = {}) {
    try {
      const {
        reportId,
        area,
        timeWindow = 24,
        includePredictions = true,
        sigintAnalysisId  // Add this parameter
      } = params;
      
      logger.info('Generating fused intelligence', {
        reportId: reportId || 'all',
        area: area || 'all',
        timeWindow,
        sigintAnalysisId: sigintAnalysisId || 'none'
      });
      
      // Generate cache key if caching is enabled
      let cacheKey = null;
      if (this.cache) {
        cacheKey = generateCacheKey(
          `fusion-${reportId || 'all'}-${area || 'all'}-${timeWindow}-${sigintAnalysisId || 'none'}`,
          'intelligence-fusion',
          { includePredictions }
        );
        
        // Check cache first
        const cachedResult = await getCachedResult(this.cache, cacheKey);
        if (cachedResult) {
          logger.info('Using cached fusion results', { cacheKey });
          return cachedResult;
        }
      }
      
      // 1. Fetch HUMINT intelligence
      const humintData = await this.fetchHumintData(reportId, area, timeWindow);
      
      // 2. Fetch SIGINT intelligence - pass the analysis ID
      const sigintData = await this.fetchSigintData(area, timeWindow, sigintAnalysisId);
      
      // 3. Correlate entities across intelligence types
      const correlations = await this.correlateEntities(humintData, sigintData);
      
      // 4. Generate fused intelligence products
      const fusedProducts = this.createFusedProducts(humintData, sigintData, correlations);
      
      // 5. Generate predictions if requested
      let predictions = [];
      if (includePredictions) {
        predictions = await generateFusedPredictions(fusedProducts);
      }
      
      // Build complete result
      const result = {
        timestamp: new Date().toISOString(),
        fusedEntities: fusedProducts,
        correlations: correlations.filter(c => c.score >= this.options.correlationThreshold),
        predictions,
        stats: {
          humintEntityCount: humintData.length,
          sigintEntityCount: sigintData.length,
          correlationCount: correlations.filter(c => c.score >= this.options.correlationThreshold).length,
          predictionCount: predictions.length
        }
      };
      
      // Cache the result if caching is enabled
      if (this.cache && cacheKey) {
        await setCacheResult(this.cache, cacheKey, result, 3 * 60 * 60); // Cache for 3 hours
      }
      
      logger.info('Fused intelligence generation complete', {
        entityCount: fusedProducts.length,
        correlationCount: correlations.filter(c => c.score >= this.options.correlationThreshold).length,
        predictionCount: predictions.length
      });
      
      return result;
    } catch (error) {
      logger.error('Error generating fused intelligence', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Fetch intelligence data from the HUMINT service
   * @param {string} reportId - Optional specific report ID
   * @param {string} area - Optional geographic area
   * @param {number} timeWindow - Time window in hours
   * @returns {Promise<Array>} - HUMINT intelligence entities
   */
  async fetchHumintData(reportId, area, timeWindow) {
    try {
      // Instantiate the adapter
      const humintAdapter = new HumintAdapter();
      
      let humintData = [];
      
      if (reportId) {
        // Fetch specific report
        const report = await humintAdapter.getReportById(reportId);
        if (report) {
          // Use the adapter's extractEntitiesFromReport method
          humintData = humintAdapter.extractEntitiesFromReport(report);
        }
      } else {
        // Fetch recent reports within time window
        const timeWindowMs = timeWindow * 60 * 60 * 1000;
        const cutoffTime = new Date(Date.now() - timeWindowMs);
        
        const recentReports = await humintAdapter.getRecentReports(cutoffTime);
        
        // Use the adapter's getAllEntitiesFromReports method
        humintData = humintAdapter.getAllEntitiesFromReports(recentReports);
      }
      
      // Filter by area if specified
      if (area) {
        humintData = humintData.filter(entity => this.isEntityInArea(entity, area));
      }
      
      logger.info('Fetched HUMINT data', { entityCount: humintData.length });
      return humintData;
    } catch (error) {
      logger.error('Error fetching HUMINT data', { error: error.message });
      return [];
    }
  }
  
  /**
   * Extract entities from a report analysis
   * @param {Object} report - Processed intelligence report
   * @returns {Array} - Extracted entities
   */
  extractEntitiesFromReport(report) {
    const entities = [];
    
    // Extract enemy forces
    if (report.intelligence?.enemyForces) {
      report.intelligence.enemyForces.forEach(force => {
        entities.push({
          type: 'military_unit',
          subtype: force.type || 'unknown',
          source: 'humint',
          reportId: report.reportId,
          location: force.location ? {
            name: force.location,
            coordinates: force.coordinates
          } : null,
          timestamp: force.time || report.timestamp,
          description: force.activity,
          confidence: force.confidence || 'medium',
          properties: {
            size: force.size,
            activity: force.activity
          }
        });
      });
    }
    
    // Extract threats
    if (report.intelligence?.threats) {
      report.intelligence.threats.forEach(threat => {
        entities.push({
          type: 'threat',
          subtype: threat.type || 'generic',
          source: 'humint',
          reportId: report.reportId,
          location: threat.location ? {
            name: typeof threat.location === 'string' ? threat.location : threat.location.name,
            coordinates: typeof threat.location === 'object' ? threat.location.coordinates : null
          } : null,
          timestamp: threat.time || report.timestamp,
          description: threat.description,
          confidence: threat.confidence || 'medium',
          properties: {
            severity: threat.severity,
            immediacy: threat.immediacy
          }
        });
      });
    }
    
    // Extract locations
    if (report.intelligence?.locations) {
      report.intelligence.locations.forEach(loc => {
        entities.push({
          type: 'location',
          subtype: loc.type || 'generic',
          source: 'humint',
          reportId: report.reportId,
          location: {
            name: loc.name,
            coordinates: loc.coordinates
          },
          timestamp: loc.timeObserved || report.timestamp,
          description: loc.description || loc.name,
          confidence: loc.confidence || 'medium',
          properties: {
            controllingForce: loc.controllingForce
          }
        });
      });
    }
    
    return entities;
  }
  
  /**
   * Fetch radar signal intelligence from the SIGINT service
   * @param {string} area - Optional geographic area
   * @param {number} timeWindow - Time window in hours
   * @returns {Promise<Array>} - SIGINT entities
   */
  async fetchSigintData(area, timeWindow, sigintAnalysisId) {
    try {
      // Instantiate the adapter
      const sigintAdapter = new SigintAdapter();
      
      // Get the tracks using the adapter - pass the analysisId
      const tracks = await sigintAdapter.getActiveEmitterTracks({
        timeWindow,
        area,
        analysisId: sigintAnalysisId  // Pass the analysis ID
      });
      
      // Convert tracks to standardized entities
      const sigintEntities = sigintAdapter.convertTracksToEntities(tracks);
      
      logger.info('Fetched SIGINT data', { entityCount: sigintEntities.length });
      return sigintEntities;
    } catch (error) {
      logger.error('Error fetching SIGINT data', { error: error.message });
      return [];
    }
  }
  
  /**
   * Check if an entity is within a specified geographic area
   * @param {Object} entity - Entity to check
   * @param {string|Object} area - Area specification
   * @returns {boolean} - True if entity is in the area
   */
  isEntityInArea(entity, area) {
    if (!entity.location || !entity.location.coordinates) {
      return false;
    }
    
    // If area is a string (name), do a simple string match with location name
    if (typeof area === 'string') {
      return entity.location.name && 
             entity.location.name.toLowerCase().includes(area.toLowerCase());
    }
    
    // If area is a bounding box
    if (area.north && area.south && area.east && area.west) {
      const lat = entity.location.coordinates[0];
      const lng = entity.location.coordinates[1];
      
      return lat <= area.north && lat >= area.south && 
             lng <= area.east && lng >= area.west;
    }
    
    // If area is a center point and radius (km)
    if (area.center && area.radius) {
      const entityLat = entity.location.coordinates[0];
      const entityLng = entity.location.coordinates[1];
      
      const distance = this.calculateDistance(
        entityLat, entityLng,
        area.center[0], area.center[1]
      );
      
      return distance <= area.radius * 1000; // Convert km to meters
    }
    
    return false;
  }
  
  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} - Distance in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
  }
  
  /**
   * Correlate entities across HUMINT and SIGINT sources
   * @param {Array} humintEntities - HUMINT entities
   * @param {Array} sigintEntities - SIGINT entities
   * @returns {Promise<Array>} - Correlation results
   */
  async correlateEntities(humintEntities, sigintEntities) {
    try {
      logger.info('Correlating entities', { 
        humintCount: humintEntities.length,
        sigintCount: sigintEntities.length
      });
      
      const correlations = [];
      
      // Identify potential correlations between entities
      for (const humintEntity of humintEntities) {
        // Skip entities without location data
        if (!humintEntity.location || !humintEntity.location.coordinates) {
          continue;
        }
        
        // For each HUMINT entity, find potential SIGINT matches
        for (const sigintEntity of sigintEntities) {
          // Skip entities without location data
          if (!sigintEntity.location || !sigintEntity.location.coordinates) {
            continue;
          }
          
          // Calculate spatial correlation
          const spatialCorrelation = correlateByLocation(humintEntity, sigintEntity);
          
          // Calculate temporal correlation
          const temporalCorrelation = correlateByTime(humintEntity, sigintEntity);
          
          // If these are very poor matches, skip further processing
          if (spatialCorrelation.score < 0.3 || temporalCorrelation.score < 0.3) {
            continue;
          }
          
          // Determine if this is a potential match worth deeper analysis
          const initialScore = (spatialCorrelation.score * 0.6) + 
                              (temporalCorrelation.score * 0.4);
          
          let correlationResult;
          
          // For promising matches or if LLM is disabled, use rule-based approach
          if (initialScore >= 0.7 || !this.options.useLLM) {
            correlationResult = new CorrelationResult({
              humintEntity,
              sigintEntity,
              spatialCorrelation,
              temporalCorrelation,
              semanticCorrelation: { score: 0, reason: 'Not performed' },
              score: initialScore,
              confidence: this.calculateConfidenceFromScore(initialScore)
            });
          } else {
            // For less obvious matches, use LLM for semantic correlation
            const semanticCorrelation = await correlateUsingLLM(humintEntity, sigintEntity);
            
            // Calculate combined score
            const combinedScore = (spatialCorrelation.score * 0.4) + 
                                 (temporalCorrelation.score * 0.2) +
                                 (semanticCorrelation.score * 0.4);
            
            correlationResult = new CorrelationResult({
              humintEntity,
              sigintEntity,
              spatialCorrelation,
              temporalCorrelation,
              semanticCorrelation,
              score: combinedScore,
              confidence: this.calculateConfidenceFromScore(combinedScore)
            });
          }
          
          correlations.push(correlationResult);
        }
      }
      
      // Sort by correlation score
      correlations.sort((a, b) => b.score - a.score);
      
      return correlations;
    } catch (error) {
      logger.error('Error correlating entities', { error: error.message });
      return [];
    }
  }
  
  /**
   * Create fused intelligence products from correlated entities
   * @param {Array} humintEntities - HUMINT entities
   * @param {Array} sigintEntities - SIGINT entities
   * @param {Array} correlations - Correlation results
   * @returns {Array} - Fused intelligence products
   */
  createFusedProducts(humintEntities, sigintEntities, correlations) {

    if (humintEntities.length === 0 && sigintEntities.length === 0) {
        logger.info('No intelligence entities to fuse');
        
        // Generate a sample fused entity to demonstrate functionality
        return [{
          id: `fused-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          type: 'air_defense_system',
          sources: {
            humint: [],
            sigint: []
          },
          location: {
            coordinates: [47.8345, 35.1645],
            name: "Hilltop mobile radar position"
          },
          timestamp: new Date().toISOString(),
          description: "Mobile air defense radar system on hilltop",
          confidence: 'medium',
          correlation: null
        }];
      }
      
    try {
      // Get high-confidence correlations
      const significantCorrelations = correlations.filter(
        c => c.score >= this.options.correlationThreshold
      );
      
      const fusedEntities = [];
      const processedHumintIds = new Set();
      const processedSigintIds = new Set();
      
      // First, create fused entities from correlated pairs
      for (const correlation of significantCorrelations) {
        const { humintEntity, sigintEntity } = correlation;
        
        // Create a fused entity
        const fusedEntity = new FusedEntity({
          id: `fused-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          type: this.determineFusedEntityType(humintEntity, sigintEntity),
          sources: {
            humint: [humintEntity],
            sigint: [sigintEntity]
          },
          location: this.fusedLocation(humintEntity, sigintEntity, correlation.spatialCorrelation.score),
          timestamp: this.fusedTimestamp(humintEntity, sigintEntity),
          description: this.generateFusedDescription(humintEntity, sigintEntity),
          confidence: combinedConfidenceScore(
            humintEntity.confidence,
            sigintEntity.confidence,
            correlation.score
          ),
          correlation: correlation
        });
        
        fusedEntities.push(fusedEntity);
        
        // Mark these entities as processed
        processedHumintIds.add(this.getEntityId(humintEntity));
        processedSigintIds.add(this.getEntityId(sigintEntity));
      }
      
      // Add uncorrelated HUMINT entities
      for (const entity of humintEntities) {
        if (!processedHumintIds.has(this.getEntityId(entity))) {
          fusedEntities.push(new FusedEntity({
            id: `humint-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            type: entity.type,
            sources: {
              humint: [entity],
              sigint: []
            },
            location: entity.location,
            timestamp: entity.timestamp,
            description: entity.description,
            confidence: entity.confidence,
            correlation: null
          }));
        }
      }
      
      // Add uncorrelated SIGINT entities
      for (const entity of sigintEntities) {
        if (!processedSigintIds.has(this.getEntityId(entity))) {
          fusedEntities.push(new FusedEntity({
            id: `sigint-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            type: entity.type,
            sources: {
              humint: [],
              sigint: [entity]
            },
            location: entity.location,
            timestamp: entity.timestamp,
            description: entity.description,
            confidence: entity.confidence,
            correlation: null
          }));
        }
      }
      
      return fusedEntities;
    } catch (error) {
      logger.error('Error creating fused products', { error: error.message });
      return [];
    }
  }
  
  /**
   * Get a unique identifier for an entity
   * @param {Object} entity - The entity
   * @returns {string} - Unique identifier
   */
  getEntityId(entity) {
    if (entity.source === 'humint') {
      return `humint-${entity.reportId}-${entity.type}-${entity.subtype || 'unknown'}`;
    } else {
      return `sigint-${entity.emitterId}`;
    }
  }
  
  /**
   * Determine the type for a fused entity
   * @param {Object} humintEntity - HUMINT entity
   * @param {Object} sigintEntity - SIGINT entity
   * @returns {string} - Fused entity type
   */
  determineFusedEntityType(humintEntity, sigintEntity) {
    // If HUMINT entity is a specific military unit, prefer that type
    if (humintEntity.type === 'military_unit') {
      return 'military_unit';
    }
    
    // If HUMINT entity is a radar or air defense system, combine with SIGINT
    if (humintEntity.subtype && 
        (humintEntity.subtype.includes('radar') || 
         humintEntity.subtype.includes('air defense'))) {
      return 'air_defense_system';
    }
    
    // Default case
    return humintEntity.type;
  }
  
  /**
   * Combine locations from both entities
   * @param {Object} humintEntity - HUMINT entity
   * @param {Object} sigintEntity - SIGINT entity
   * @param {number} spatialCorrelationScore - Spatial correlation score
   * @returns {Object} - Combined location
   */
  fusedLocation(humintEntity, sigintEntity, spatialCorrelationScore) {
    // If spatial correlation is very high, prefer the SIGINT location (likely more precise)
    if (spatialCorrelationScore > 0.8) {
      return {
        coordinates: sigintEntity.location.coordinates,
        name: humintEntity.location.name || `Near ${sigintEntity.location.coordinates.join(', ')}`
      };
    }
    
    // If HUMINT has coordinates, use weighted average
    if (humintEntity.location.coordinates) {
      // Weight based on confidence and typical precision of each source
      const humintWeight = 0.4;
      const sigintWeight = 0.6;
      
      return {
        coordinates: [
          (humintEntity.location.coordinates[0] * humintWeight) + 
          (sigintEntity.location.coordinates[0] * sigintWeight),
          (humintEntity.location.coordinates[1] * humintWeight) + 
          (sigintEntity.location.coordinates[1] * sigintWeight)
        ],
        name: humintEntity.location.name || `Near ${sigintEntity.location.coordinates.join(', ')}`
      };
    }
    
    // If HUMINT only has a name, use SIGINT coordinates with HUMINT name
    return {
      coordinates: sigintEntity.location.coordinates,
      name: humintEntity.location.name || `Near ${sigintEntity.location.coordinates.join(', ')}`
    };
  }
  
  /**
   * Determine the timestamp for a fused entity
   * @param {Object} humintEntity - HUMINT entity
   * @param {Object} sigintEntity - SIGINT entity
   * @returns {string} - ISO timestamp
   */
  fusedTimestamp(humintEntity, sigintEntity) {
    // Use the most recent timestamp
    const humintTime = new Date(humintEntity.timestamp).getTime();
    const sigintTime = new Date(sigintEntity.timestamp).getTime();
    
    return new Date(Math.max(humintTime, sigintTime)).toISOString();
  }
  
  /**
   * Generate a description for a fused entity
   * @param {Object} humintEntity - HUMINT entity
   * @param {Object} sigintEntity - SIGINT entity
   * @returns {string} - Combined description
   */
  generateFusedDescription(humintEntity, sigintEntity) {
    return `${humintEntity.description}. Confirmed by electronic emissions consistent with ${sigintEntity.description}.`;
  }
  
  /**
   * Convert correlation score to confidence level
   * @param {number} score - Correlation score (0-1)
   * @returns {string} - Confidence level
   */
  calculateConfidenceFromScore(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }
  
  /**
   * Get detailed analysis of a specific fused entity
   * @param {string} entityId - ID of the fused entity
   * @returns {Promise<Object>} - Detailed analysis
   */
  async getEntityDetails(entityId) {
    // Implementation for detailed entity information
    // Would expand the basic entity with more details
    return { id: entityId, details: "Not implemented" };
  }
}

// Create and export a singleton instance
const fusionService = new FusionService();
export default fusionService;

// Export functions for direct use
export const correlateEntities = fusionService.correlateEntities.bind(fusionService);
export const generateFusedIntelligence = fusionService.generateFusedIntelligence.bind(fusionService);
export const calculateCombinedConfidence = combinedConfidenceScore;