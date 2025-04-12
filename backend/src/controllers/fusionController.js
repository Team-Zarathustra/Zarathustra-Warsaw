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
    
    const fusionResults = await fusionService.generateFusedIntelligence({
      reportId: humintAnalysisId,
      sigintId: sigintAnalysisId,
      timeWindow: options.timeWindow || 24,
      area: options.area,
      includePredictions: options.includePredictions !== false
    });
    
    logger.info('Intelligence fusion completed', {
      fusedEntities: fusionResults.fusedEntities.length,
      correlations: fusionResults.correlations.length,
      predictions: fusionResults.predictions?.length || 0
    });
    
    return res.status(200).json(fusionResults);
  } catch (error) {
    logger.error('Intelligence fusion failed', { 
      error: error.message,
      stack: error.stack
    });
    
    next(error);
  }
};

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