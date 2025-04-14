// services/fusionService/correlators/temporalCorrelator.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Correlate entities based on temporal proximity
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @returns {Object} - Temporal correlation result
 */
export function correlateByTime(entity1, entity2) {
  try {
    // Check if both entities have timestamp data
    if (!entity1.timestamp || !entity2.timestamp) {
      return {
        score: 0.5, // Neutral score when time data is missing
        reason: 'Missing timestamp data',
        timeDifference: null
      };
    }
    
    // Parse timestamps
    const time1 = new Date(entity1.timestamp).getTime();
    const time2 = new Date(entity2.timestamp).getTime();
    
    if (isNaN(time1) || isNaN(time2)) {
      return {
        score: 0.5,
        reason: 'Invalid timestamp format',
        timeDifference: null
      };
    }
    
    // Calculate time difference in minutes
    const diffMs = Math.abs(time1 - time2);
    const diffMinutes = diffMs / (1000 * 60);
    
    // Determine correlation score based on time difference
    let score;
    let reason;
    
    // Different thresholds depending on entity types
    const isRadarRelated = 
      entity1.type?.includes('radar') || entity1.subtype?.includes('radar') ||
      entity2.type?.includes('radar') || entity2.subtype?.includes('radar') ||
      entity1.type === 'electronic_emitter' || entity2.type === 'electronic_emitter';
    
    if (isRadarRelated) {
      // Electronic entities might be detected with some delay after visual observation
      if (diffMinutes < 10) {
        score = 0.95;
        reason = 'Nearly simultaneous detection';
      } else if (diffMinutes < 30) {
        score = 0.9;
        reason = 'Very close temporal proximity';
      } else if (diffMinutes < 60) {
        score = 0.8;
        reason = 'Close temporal proximity';
      } else if (diffMinutes < 120) {
        score = 0.7;
        reason = 'Reasonable temporal proximity';
      } else if (diffMinutes < 240) {
        score = 0.5;
        reason = 'Moderate temporal proximity';
      } else if (diffMinutes < 480) {
        score = 0.3;
        reason = 'Significant time gap';
      } else {
        score = 0.1;
        reason = 'Large time gap, unlikely to be the same event';
      }
    } else {
      // Standard entities require closer temporal proximity
      if (diffMinutes < 5) {
        score = 0.95;
        reason = 'Nearly simultaneous observation';
      } else if (diffMinutes < 15) {
        score = 0.9;
        reason = 'Very close temporal proximity';
      } else if (diffMinutes < 30) {
        score = 0.8;
        reason = 'Close temporal proximity';
      } else if (diffMinutes < 60) {
        score = 0.6;
        reason = 'Moderate temporal proximity';
      } else if (diffMinutes < 120) {
        score = 0.4;
        reason = 'Significant time gap';
      } else {
        score = 0.2;
        reason = 'Large time gap, could be different events';
      }
    }
    
    // Special case: If one is HUMINT and one is SIGINT, and SIGINT is later
    // This is a common pattern - visual observation followed by electronic detection
    if (entity1.source === 'humint' && entity2.source === 'sigint' && time2 > time1) {
      if (diffMinutes < 60) {
        // Boost score slightly for this expected pattern
        score = Math.min(score + 0.1, 0.95);
        reason += ' (consistent with visual observation followed by electronic detection)';
      }
    } else if (entity1.source === 'sigint' && entity2.source === 'humint' && time2 > time1) {
      if (diffMinutes < 60) {
        // Boost score slightly for confirmation of electronic detection
        score = Math.min(score + 0.1, 0.95);
        reason += ' (consistent with electronic detection followed by visual confirmation)';
      }
    }
    
    return {
      score,
      reason,
      timeDifference: diffMinutes
    };
  } catch (error) {
    logger.error('Error in temporal correlation', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      score: 0.5,
      reason: 'Error in temporal correlation: ' + error.message,
      timeDifference: null
    };
  }
}

/**
 * Check if an entity was active during a specified time window
 * @param {Object} entity - Entity to check
 * @param {Date} startTime - Window start time
 * @param {Date} endTime - Window end time
 * @returns {boolean} - True if entity was active during window
 */
export function isEntityActiveInWindow(entity, startTime, endTime) {
  if (!entity.timestamp) return false;
  
  const entityTime = new Date(entity.timestamp);
  if (isNaN(entityTime.getTime())) return false;
  
  return entityTime >= startTime && entityTime <= endTime;
}

/**
 * Find the closest entity in time from a set of entities
 * @param {Object} targetEntity - The reference entity
 * @param {Array} candidateEntities - Array of potential matching entities
 * @returns {Object} - The closest entity and time difference
 */
export function findClosestInTime(targetEntity, candidateEntities) {
  if (!targetEntity.timestamp || candidateEntities.length === 0) {
    return { entity: null, difference: Infinity };
  }
  
  const targetTime = new Date(targetEntity.timestamp).getTime();
  if (isNaN(targetTime)) return { entity: null, difference: Infinity };
  
  let closestEntity = null;
  let smallestDifference = Infinity;
  
  for (const candidate of candidateEntities) {
    if (!candidate.timestamp) continue;
    
    const candidateTime = new Date(candidate.timestamp).getTime();
    if (isNaN(candidateTime)) continue;
    
    const difference = Math.abs(targetTime - candidateTime);
    
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestEntity = candidate;
    }
  }
  
  return {
    entity: closestEntity,
    difference: smallestDifference / (1000 * 60) // Convert to minutes
  };
}