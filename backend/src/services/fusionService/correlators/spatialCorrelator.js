// services/fusionService/correlators/spatialCorrelator.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Correlate entities based on spatial proximity
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @returns {Object} - Spatial correlation result
 */
export function correlateByLocation(entity1, entity2) {
  try {
    // Check if both entities have location data
    if (!entity1.location || !entity2.location) {
      return {
        score: 0,
        reason: 'Missing location data',
        distance: null
      };
    }
    
    // Check if both have coordinates
    if (!entity1.location.coordinates || !entity2.location.coordinates) {
      // If one has coordinates but the other only has a name, check name similarity
      if ((entity1.location.coordinates && entity2.location.name) ||
          (entity1.location.name && entity2.location.coordinates)) {
        return correlateByLocationName(entity1, entity2);
      }
      
      return {
        score: 0,
        reason: 'Missing coordinate data',
        distance: null
      };
    }
    
    // Calculate distance between coordinates
    const distance = calculateDistance(
      entity1.location.coordinates[0], entity1.location.coordinates[1],
      entity2.location.coordinates[0], entity2.location.coordinates[1]
    );
    
    // Determine correlation score based on distance
    let score;
    let reason;
    
    // Different thresholds depending on entity types
    // Radar systems can be detected from farther away
    const isRadarRelated = 
      entity1.type?.includes('radar') || entity1.subtype?.includes('radar') ||
      entity2.type?.includes('radar') || entity2.subtype?.includes('radar') ||
      entity1.type === 'electronic_emitter' || entity2.type === 'electronic_emitter';
    
    if (isRadarRelated) {
      // Radar-related entities can be correlated from further distances
      if (distance < 500) {
        score = 0.95;
        reason = 'Extremely close proximity for radar system';
      } else if (distance < 2000) {
        score = 0.85;
        reason = 'Very close proximity for radar system';
      } else if (distance < 5000) {
        score = 0.7;
        reason = 'Close proximity for radar system';
      } else if (distance < 10000) {
        score = 0.5;
        reason = 'Moderate proximity for radar system';
      } else if (distance < 20000) {
        score = 0.3;
        reason = 'Possible proximity for radar system';
      } else {
        score = 0.1;
        reason = 'Distant locations, unlikely to be the same radar system';
      }
    } else {
      // Standard entities require closer proximity
      if (distance < 200) {
        score = 0.95;
        reason = 'Extremely close proximity';
      } else if (distance < 1000) {
        score = 0.85;
        reason = 'Very close proximity';
      } else if (distance < 3000) {
        score = 0.7;
        reason = 'Close proximity';
      } else if (distance < 5000) {
        score = 0.5;
        reason = 'Moderate proximity';
      } else if (distance < 10000) {
        score = 0.3;
        reason = 'Significant distance';
      } else {
        score = 0.1;
        reason = 'Distant locations, unlikely to be the same entity';
      }
    }
    
    return {
      score,
      reason,
      distance
    };
  } catch (error) {
    logger.error('Error in spatial correlation', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      score: 0,
      reason: 'Error in spatial correlation: ' + error.message,
      distance: null
    };
  }
}

/**
 * Correlate entities based on location names
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @returns {Object} - Name-based correlation result
 */
function correlateByLocationName(entity1, entity2) {
  // Check if both have location names
  if (entity1.location?.name && entity2.location?.name) {
    const name1 = entity1.location.name.toLowerCase();
    const name2 = entity2.location.name.toLowerCase();
    
    // Check for exact match
    if (name1 === name2) {
      return {
        score: 0.9,
        reason: 'Exact location name match',
        distance: null
      };
    }
    
    // Check if one name contains the other
    if (name1.includes(name2) || name2.includes(name1)) {
      return {
        score: 0.7,
        reason: 'Location name overlap',
        distance: null
      };
    }
    
    // Check for word overlap
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    if (commonWords.length > 0) {
      const overlap = commonWords.length / Math.max(words1.length, words2.length);
      
      return {
        score: 0.5 * overlap,
        reason: `Partial location name match (${commonWords.join(', ')})`,
        distance: null
      };
    }
  }
  
  // If one has coordinates and the other has a name, we could implement
  // gazetteer lookup here, but that's beyond the scope of this example
  
  return {
    score: 0.1,
    reason: 'No location name match',
    distance: null
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
}