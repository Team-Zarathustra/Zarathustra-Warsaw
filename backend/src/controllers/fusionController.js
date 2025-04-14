import { logger } from '../api/logger/logger.js';
import fusionService from '../services/fusionService/index.js';

export const generateFusedIntelligence = async (req, res, next) => {
  try {
    const { humintAnalysisId, sigintAnalysisId, options = {} } = req.body;
    
    if (!humintAnalysisId || !sigintAnalysisId) {
      return res.status(400).json({
        error: 'Missing required analysis IDs',
        details: 'Both HUMINT and SIGINT analysis IDs are required'
      });
    }
    
    logger.info('Intelligence fusion requested', { 
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      humintAnalysisId,
      sigintAnalysisId,
      options: JSON.stringify(options)
    });
    
    // Parse options if provided as string
    let parsedOptions = options;
    if (typeof options === 'string') {
      try {
        parsedOptions = JSON.parse(options);
      } catch (e) {
        logger.warn('Invalid options JSON, using defaults', { options });
        parsedOptions = {};
      }
    }
    
    // Call the fusion service with all parameters including the sigintAnalysisId
    const fusionResults = await fusionService.generateFusedIntelligence({
      reportId: humintAnalysisId,
      sigintAnalysisId: sigintAnalysisId, // Pass the SIGINT analysis ID for proper retrieval
      timeWindow: parsedOptions.timeWindow || 24,
      area: parsedOptions.area,
      includePredictions: parsedOptions.includePredictions !== false,
      correlationThreshold: parsedOptions.correlationThreshold || 0.65
    });
    
    // Construct the full response
    const response = {
      success: true,
      fusionId: `fusion-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fusion: {
        fusedEntities: fusionResults.fusedEntities.length,
        correlations: fusionResults.correlations.length,
        predictions: fusionResults.predictions?.length || 0
      },
      summary: {
        humintEntityCount: fusionResults.stats?.humintEntityCount || 0,
        sigintEntityCount: fusionResults.stats?.sigintEntityCount || 0,
        correlationsFound: fusionResults.stats?.correlationCount || 0,
        predictionsGenerated: fusionResults.stats?.predictionCount || 0,
        confidenceLevel: calculateOverallConfidence(fusionResults)
      },
      fusedEntities: fusionResults.fusedEntities,
      correlations: fusionResults.correlations,
      predictions: fusionResults.predictions || []
    };
    
    logger.info('Intelligence fusion completed', {
      fusedEntities: fusionResults.fusedEntities.length,
      correlations: fusionResults.correlations.length,
      predictions: fusionResults.predictions?.length || 0
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Intelligence fusion failed', { 
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: 'Intelligence fusion failed',
      message: error.message
    });
  }
};

// Helper function to calculate overall confidence based on fusion results
function calculateOverallConfidence(fusionResults) {
  if (!fusionResults.fusedEntities || fusionResults.fusedEntities.length === 0) {
    return 'low';
  }
  
  // Count confidence levels
  const confidenceCounts = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  // Count each entity by confidence
  fusionResults.fusedEntities.forEach(entity => {
    if (entity.confidence === 'high') confidenceCounts.high++;
    else if (entity.confidence === 'medium') confidenceCounts.medium++;
    else confidenceCounts.low++;
  });
  
  // Calculate total
  const total = fusionResults.fusedEntities.length;
  
  // Determine overall confidence
  if (confidenceCounts.high > total * 0.6) return 'high';
  if (confidenceCounts.low > total * 0.6) return 'low';
  return 'medium';
}

export const getEntityDetails = async (req, res, next) => {
  try {
    const { entityId } = req.params;
    
    if (!entityId) {
      return res.status(400).json({
        error: 'Missing entity ID',
        details: 'Please provide a valid entity ID'
      });
    }
    
    const entityDetails = await fusionService.getEntityDetails(entityId);
    
    if (!entityDetails) {
      return res.status(404).json({
        error: 'Entity not found',
        details: `No entity found with ID: ${entityId}`
      });
    }
    
    return res.status(200).json(entityDetails);
  } catch (error) {
    logger.error('Failed to get entity details', { 
      error: error.message,
      stack: error.stack,
      entityId: req.params.entityId
    });
    
    next(error);
  }
};

export const getCorrelationDetails = async (req, res, next) => {
  try {
    const { correlationId } = req.params;
    
    // PLACEHOLDER
    
    const correlation = {
      id: correlationId,
      humintEntity: {
        id: 'humint-123',
        type: 'radar_system',
        location: {
          name: 'Hilltop',
          coordinates: [47.8345, 35.1645]
        },
        confidence: 'high',
        source: 'field_report_123'
      },
      sigintEntity: {
        id: 'sigint-456',
        type: 'radar_emitter',
        frequency: 5320,
        location: {
          coordinates: [47.8347, 35.1642]
        },
        confidence: 'medium'
      },
      score: 0.87,
      spatialCorrelation: {
        score: 0.92,
        reason: 'Very close proximity (25 meters)',
        distance: 25
      },
      temporalCorrelation: {
        score: 0.85,
        reason: 'Close temporal proximity (15 minutes apart)',
        timeDifference: 15
      },
      semanticCorrelation: {
        score: 0.78,
        reason: 'Characteristics match radar system',
        commonTerms: ['radar', 'air defense']
      }
    };
    
    return res.status(200).json(correlation);
  } catch (error) {
    logger.error('Failed to get correlation details', { 
      error: error.message,
      stack: error.stack,
      correlationId: req.params.correlationId
    });
    
    next(error);
  }
};