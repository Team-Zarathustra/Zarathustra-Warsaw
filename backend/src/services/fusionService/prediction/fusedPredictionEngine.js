// services/fusionService/prediction/fusedPredictionEngine.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Generate predictions based on fused intelligence data
 * @param {Array} fusedEntities - Array of fused intelligence entities
 * @param {Object} options - Additional options for predictions
 * @returns {Promise<Array>} - Array of predictions
 */
export async function generateFusedPredictions(fusedEntities, options = {}) {
  try {
    logger.info('Generating fused intelligence predictions', { 
      entityCount: fusedEntities.length,
      options: JSON.stringify(options)
    });
    
    // Placeholder predictions based on fused entities
    const predictions = [];
    
    // Process each fused entity to generate potential predictions
    for (const entity of fusedEntities) {
      // Only generate predictions for high confidence multi-source entities
      if (entity.confidence === 'high' && entity.sources.humint.length > 0 && entity.sources.sigint.length > 0) {
        
        // Generate predictions based on entity type
        if (entity.type === 'military_unit' || entity.type === 'air_defense_system') {
          predictions.push(generateMilitaryUnitPrediction(entity));
        }
        
        if (entity.type === 'threat') {
          predictions.push(generateThreatPrediction(entity));
        }
        
        // For other entity types with strong correlations
        if (entity.correlation && entity.correlation.score > 0.8) {
          predictions.push(generateCorrelationPrediction(entity));
        }
      }
    }
    
    logger.info('Generated fused predictions', { 
      predictionCount: predictions.length 
    });
    
    return predictions;
  } catch (error) {
    logger.error('Error generating fused predictions', { 
      error: error.message,
      stack: error.stack 
    });
    return [];
  }
}

/**
 * Generate a prediction for a military unit
 * @param {Object} entity - Fused military unit entity
 * @returns {Object} - Prediction object
 */
function generateMilitaryUnitPrediction(entity) {
  // Extract HUMINT and SIGINT insights
  const humintLocations = entity.sources.humint
    .filter(e => e.location && e.location.coordinates)
    .map(e => e.location);
    
  const sigintActivities = entity.sources.sigint
    .map(e => e.properties?.characteristics || {});
  
  // Determine prediction timeframe based on entity properties
  const timeframe = determineTimeframe(entity);
  
  // Create the prediction
  return {
    id: `pred-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    entityId: entity.id,
    type: 'tactical',
    name: `${entity.type} Activity Prediction`,
    description: `Based on correlated HUMINT observations and SIGINT detections, the ${entity.type} at ${entity.location?.name || 'this location'} is likely preparing for operations.`,
    timeframe,
    confidence: normalizeConfidenceScore(entity.correlation?.score || 0.7),
    factors: [
      'Multi-source confirmation',
      'High spatial correlation',
      'Electronic emissions match observed equipment'
    ],
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate a prediction based on a threat entity
 * @param {Object} entity - Fused threat entity
 * @returns {Object} - Prediction object
 */
function generateThreatPrediction(entity) {
  return {
    id: `pred-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    entityId: entity.id,
    type: 'threat',
    name: 'Threat Assessment',
    description: `Correlated HUMINT and SIGINT indicates a confirmed ${entity.description || 'threat'} at ${entity.location?.name || 'this location'}.`,
    timeframe: {
      min: 1,
      max: 12,
      unit: 'hours'
    },
    confidence: normalizeConfidenceScore(entity.correlation?.score || 0.7),
    factors: [
      'Threat identified in field reports',
      'Electronic signature confirms presence',
      'Pattern matches known threat tactics'
    ],
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate a prediction based on a strong correlation
 * @param {Object} entity - Fused entity with strong correlation
 * @returns {Object} - Prediction object
 */
function generateCorrelationPrediction(entity) {
  return {
    id: `pred-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    entityId: entity.id,
    type: 'correlation',
    name: 'Intelligence Correlation',
    description: `High-confidence intelligence correlation for ${entity.type} at ${entity.location?.name || 'this location'} suggests continued presence for the next 24 hours.`,
    timeframe: {
      min: 6,
      max: 24,
      unit: 'hours'
    },
    confidence: normalizeConfidenceScore(entity.correlation?.score || 0.8),
    factors: [
      'Strong multi-source correlation',
      'Consistent observations over time',
      'Typical deployment duration patterns'
    ],
    timestamp: new Date().toISOString()
  };
}

/**
 * Determine a timeframe for predictions based on entity properties
 * @param {Object} entity - Fused entity
 * @returns {Object} - Timeframe object
 */
function determineTimeframe(entity) {
  // Default timeframe
  const timeframe = {
    min: 6,
    max: 24,
    unit: 'hours'
  };

  // Adjust timeframe based on entity type
  if (entity.type.includes('radar') || entity.type.includes('air_defense')) {
    // Radar and air defense systems tend to have shorter deployment timeframes
    timeframe.min = 1;
    timeframe.max = 12;
  } else if (entity.type.includes('artillery')) {
    // Artillery typically indicates imminent action
    timeframe.min = 1;
    timeframe.max = 6;
  } else if (entity.type.includes('command') || entity.type.includes('headquarters')) {
    // Command elements suggest longer-term operations
    timeframe.min = 12;
    timeframe.max = 48;
  }

  // Further adjust based on correlation confidence
  if (entity.correlation && entity.correlation.score > 0.9) {
    // High confidence correlations allow for more precise predictions
    timeframe.max = Math.floor(timeframe.max * 0.8);
  }

  return timeframe;
}

/**
 * Normalize a correlation score to a confidence value between 0-1
 * @param {number} correlationScore - Raw correlation score
 * @returns {number} - Normalized confidence value
 */
function normalizeConfidenceScore(correlationScore) {
  // Simple linear normalization with a minimum threshold
  return Math.max(0.3, Math.min(0.95, correlationScore));
}