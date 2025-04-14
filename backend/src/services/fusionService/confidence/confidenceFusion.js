// services/fusionService/confidence/confidenceFusion.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Calculate combined confidence score from multiple sources
 * @param {string} humintConfidence - HUMINT confidence level (high, medium, low)
 * @param {string} sigintConfidence - SIGINT confidence level (high, medium, low)
 * @param {number} correlationScore - Score of correlation between sources (0-1)
 * @returns {string} - Combined confidence level (high, medium, low)
 */
export function combinedConfidenceScore(humintConfidence, sigintConfidence, correlationScore) {
  try {
    // Convert confidence levels to numeric values
    const confidenceValues = {
      high: 0.9,
      medium: 0.6,
      low: 0.3,
      fallback: 0.1
    };
    
    // Get numeric values, defaulting to medium if invalid
    const humintValue = confidenceValues[humintConfidence?.toLowerCase()] || confidenceValues.medium;
    const sigintValue = confidenceValues[sigintConfidence?.toLowerCase()] || confidenceValues.medium;
    
    // Ensure correlation score is valid
    const correlation = isNaN(correlationScore) ? 0.5 : Math.max(0, Math.min(1, correlationScore));
    
    // Different combining functions based on correlation strength
    let combinedValue;
    
    if (correlation > 0.8) {
      // High correlation - sources strongly reinforce each other
      // Use a function that boosts confidence
      combinedValue = Math.min(0.95, Math.sqrt((humintValue * sigintValue) * (1 + correlation * 0.5)));
      
      // Additional boost for high confidence in both sources
      if (humintValue > 0.8 && sigintValue > 0.8) {
        combinedValue = Math.min(0.98, combinedValue + 0.05);
      }
    } else if (correlation > 0.5) {
      // Moderate correlation - sources partially reinforce each other
      // Use weighted average with correlation-based boost
      combinedValue = ((humintValue + sigintValue) / 2) * (1 + (correlation - 0.5) * 0.4);
    } else {
      // Low correlation - sources might be referring to different entities
      // Use a more conservative combination
      combinedValue = (humintValue * sigintValue) + ((humintValue + sigintValue) / 2) * correlation;
    }
    
    // Convert numeric value back to confidence level
    if (combinedValue >= 0.85) return 'high';
    if (combinedValue >= 0.5) return 'medium';
    return 'low';
  } catch (error) {
    logger.error('Error calculating combined confidence', {
      error: error.message,
      stack: error.stack
    });
    
    // Default to medium confidence if there's an error
    return 'medium';
  }
}

/**
 * Assess reliability of a fused intelligence product
 * @param {Object} fusedEntity - The fused entity
 * @returns {Object} - Reliability assessment
 */
export function assessReliability(fusedEntity) {
  // Check for multi-source confirmation
  const hasHumint = fusedEntity.sources.humint.length > 0;
  const hasSigint = fusedEntity.sources.sigint.length > 0;
  
  // Multiple independent sources increase reliability
  const multiSourceConfirmation = hasHumint && hasSigint;
  
  // Calculate overall reliability
  let reliabilityScore = 0.5; // Start with medium reliability
  
  if (multiSourceConfirmation) {
    // Boost for multi-source confirmation
    reliabilityScore += 0.25;
    
    // Additional boost for high correlation
    if (fusedEntity.correlation && fusedEntity.correlation.score > 0.8) {
      reliabilityScore += 0.15;
    }
  }
  
  // Adjust based on confidence
  if (fusedEntity.confidence === 'high') {
    reliabilityScore += 0.1;
  } else if (fusedEntity.confidence === 'low') {
    reliabilityScore -= 0.1;
  }
  
  // Determine reliability level
  let reliabilityLevel;
  if (reliabilityScore >= 0.8) {
    reliabilityLevel = 'high';
  } else if (reliabilityScore >= 0.5) {
    reliabilityLevel = 'medium';
  } else {
    reliabilityLevel = 'low';
  }
  
  return {
    level: reliabilityLevel,
    score: reliabilityScore,
    factors: {
      multiSourceConfirmation,
      hasHumint,
      hasSigint,
      confidenceLevel: fusedEntity.confidence,
      correlationScore: fusedEntity.correlation ? fusedEntity.correlation.score : null
    }
  };
}