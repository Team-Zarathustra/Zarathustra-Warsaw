// services/fusionService/utils/promptBuilder.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Build a prompt for correlating HUMINT and SIGINT entities
 * @param {Object} humintEntity - HUMINT entity
 * @param {Object} sigintEntity - SIGINT entity
 * @returns {string} - Formatted prompt for LLM
 */
export function buildCorrelationPrompt(humintEntity, sigintEntity) {
  try {
    // Format the location information
    const humintLocation = formatLocation(humintEntity.location);
    const sigintLocation = formatLocation(sigintEntity.location);
    
    // Format timestamps
    const humintTime = formatTime(humintEntity.timestamp);
    const sigintTime = formatTime(sigintEntity.timestamp);
    
    // Calculate spatial and temporal proximity
    const locationProximity = calculateProximity(humintEntity.location, sigintEntity.location);
    const timeProximity = calculateTimeProximity(humintEntity.timestamp, sigintEntity.timestamp);
    
    // Build the prompt
    return `You are an expert military intelligence analyst specializing in correlating information from different sources. Your task is to determine if the following two intelligence reports likely refer to the same real-world entity.

HUMAN INTELLIGENCE (HUMINT) REPORT:
Type: ${humintEntity.type}${humintEntity.subtype ? ', Subtype: ' + humintEntity.subtype : ''}
Location: ${humintLocation}
Time: ${humintTime}
Description: ${humintEntity.description}
${humintEntity.properties ? 'Additional details: ' + JSON.stringify(humintEntity.properties) : ''}

SIGNAL INTELLIGENCE (SIGINT) REPORT:
Type: ${sigintEntity.type}${sigintEntity.subtype ? ', Subtype: ' + sigintEntity.subtype : ''}
Location: ${sigintLocation}
Time: ${sigintTime}
Description: ${sigintEntity.description}
${sigintEntity.properties ? 'Additional details: ' + JSON.stringify(sigintEntity.properties) : ''}

PROXIMITY ANALYSIS:
Location proximity: ${locationProximity}
Time proximity: ${timeProximity}

Based on your expert knowledge of military operations and intelligence analysis, determine if these reports likely refer to the same entity or related entities. Consider:
1. The military or tactical relationship between these entities
2. Whether the electronic emissions detected in SIGINT would be expected from the entity described in HUMINT
3. Whether the timing and location are consistent with it being the same entity
4. Any technical characteristics in the SIGINT data that confirm or contradict the HUMINT report

INSTRUCTIONS:
Output your analysis in JSON format with the following fields:
- score: A correlation score from 0.0 to 1.0, where 0.0 means definitely unrelated and 1.0 means definitely the same entity
- reason: An explanation of your reasoning
- entityRelationship: One of these: "same_entity", "related_entity", "part_of_same_unit", "supporting_entity", "unrelated"

RESPONSE:`;
  } catch (error) {
    logger.error('Error building correlation prompt', {
      error: error.message,
      stack: error.stack
    });
    
    // Return a simplified prompt if there was an error
    return `Analyze these two intelligence reports and determine if they refer to the same entity.
HUMINT: ${JSON.stringify(humintEntity)}
SIGINT: ${JSON.stringify(sigintEntity)}
Return a correlation score (0-1) and explanation in JSON format.`;
  }
}

/**
 * Format location information for the prompt
 * @param {Object} location - Location object
 * @returns {string} - Formatted location string
 */
function formatLocation(location) {
  if (!location) return 'Unknown';
  
  if (location.name && location.coordinates) {
    return `${location.name} (${location.coordinates.join(', ')})`;
  } else if (location.name) {
    return location.name;
  } else if (location.coordinates) {
    return location.coordinates.join(', ');
  }
  
  return 'Unspecified';
}

/**
 * Format timestamp for the prompt
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted time string
 */
function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    return timestamp;
  }
}

/**
 * Calculate and describe proximity between two locations
 * @param {Object} loc1 - First location
 * @param {Object} loc2 - Second location
 * @returns {string} - Description of proximity
 */
function calculateProximity(loc1, loc2) {
  if (!loc1 || !loc2 || !loc1.coordinates || !loc2.coordinates) {
    return 'Cannot be determined due to missing coordinate data';
  }
  
  // Calculate haversine distance
  const R = 6371e3; // Earth radius in meters
  const φ1 = loc1.coordinates[0] * Math.PI/180;
  const φ2 = loc2.coordinates[0] * Math.PI/180;
  const Δφ = (loc2.coordinates[0] - loc1.coordinates[0]) * Math.PI/180;
  const Δλ = (loc2.coordinates[1] - loc1.coordinates[1]) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // in meters
  
  // Format description based on distance
  if (distance < 100) {
    return `Very close proximity (${Math.round(distance)} meters)`;
  } else if (distance < 1000) {
    return `Close proximity (${Math.round(distance)} meters)`;
  } else if (distance < 5000) {
    return `Moderate proximity (${(distance / 1000).toFixed(1)} km)`;
  } else if (distance < 20000) {
    return `Significant distance (${(distance / 1000).toFixed(1)} km)`;
  } else {
    return `Far apart (${(distance / 1000).toFixed(1)} km)`;
  }
}

/**
 * Calculate and describe temporal proximity
 * @param {string} time1 - First timestamp
 * @param {string} time2 - Second timestamp
 * @returns {string} - Description of temporal proximity
 */
function calculateTimeProximity(time1, time2) {
  if (!time1 || !time2) {
    return 'Cannot be determined due to missing timestamp data';
  }
  
  try {
    const t1 = new Date(time1).getTime();
    const t2 = new Date(time2).getTime();
    const diffMs = Math.abs(t1 - t2);
    const diffMins = Math.round(diffMs / (60 * 1000));
    const diffHours = diffMins / 60;
    
    if (diffMins < 10) {
      return `Very close in time (${diffMins} minutes apart)`;
    } else if (diffMins < 60) {
      return `Close in time (${diffMins} minutes apart)`;
    } else if (diffHours < 6) {
      return `Moderately close in time (${diffHours.toFixed(1)} hours apart)`;
    } else if (diffHours < 24) {
      return `Same day (${diffHours.toFixed(1)} hours apart)`;
    } else {
      const diffDays = diffHours / 24;
      return `Separated in time (${diffDays.toFixed(1)} days apart)`;
    }
  } catch (error) {
    return 'Cannot be determined due to timestamp error';
  }
}

/**
 * Build a prompt for generating a fused intelligence report
 * @param {Object} fusedEntity - The fused entity
 * @returns {string} - Formatted prompt
 */
export function buildFusionReportPrompt(fusedEntity) {
  // This would generate a prompt for creating a comprehensive intelligence report
  // based on a fused entity, incorporating both HUMINT and SIGINT elements
  
  return `You are a military intelligence analyst. Generate a comprehensive intelligence report based on the following fused intelligence:
Entity: ${JSON.stringify(fusedEntity, null, 2)}

Your report should:
1. Summarize the key intelligence
2. Assess confidence based on multiple source corroboration
3. Provide tactical implications
4. Suggest follow-up intelligence requirements

Format the report in NATO standard format.
`;
}