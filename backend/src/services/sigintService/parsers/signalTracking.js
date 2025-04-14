import { logger } from '../../../api/logger/logger.js';

/**
 * Calculate tracking information for emitters based on location history
 * @param {Array<EmitterTrack>} tracks - Array of emitter track objects
 * @returns {Promise<Array>} - Updated tracks with velocity information
 */
export async function trackEmitters(tracks) {
  try {
    logger.info('Processing emitter tracks', { trackCount: tracks.length });
    
    const results = [];
    
    for (const track of tracks) {
      if (track.locations.length < 3) {
        // Not enough points for velocity calculation
        results.push(track);
        continue;
      }
      
      // Calculate velocity and direction
      const velocityVector = calculateVelocityVector(track);
      
      // Store velocity information on the track
      track.velocityInfo = velocityVector;
      
      results.push(track);
    }
    
    return results;
  } catch (error) {
    logger.error('Error tracking emitters', { error: error.message });
    return tracks; // Return original tracks on error
  }
}

/**
 * Calculate velocity vector based on recent positions
 * @param {EmitterTrack} track - Emitter track with location history
 * @returns {Object} - Velocity vector with speed and direction
 */
function calculateVelocityVector(track) {
  // Get the most recent locations (last 5 or fewer)
  const recentLocations = track.locations
    .slice(-5)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  if (recentLocations.length < 2) {
    return { speed: 0, direction: 0, reliability: 'low' };
  }
  
  // Calculate vectors between consecutive points
  const vectors = [];
  
  for (let i = 1; i < recentLocations.length; i++) {
    const loc1 = recentLocations[i-1];
    const loc2 = recentLocations[i];
    
    // Calculate time difference in seconds
    const time1 = new Date(loc1.timestamp).getTime();
    const time2 = new Date(loc2.timestamp).getTime();
    const timeDiff = (time2 - time1) / 1000;
    
    if (timeDiff <= 0) continue;
    
    // Calculate distance and bearing
    const { distance, bearing } = calculateDistanceAndBearing(
      loc1.location.lat, loc1.location.lng,
      loc2.location.lat, loc2.location.lng
    );
    
    // Calculate speed in meters per second
    const speed = distance / timeDiff;
    
    vectors.push({
      speed,
      bearing,
      timeDiff,
      weight: 1 / (1 + loc1.accuracy + loc2.accuracy) // Higher weight for more accurate locations
    });
  }
  
  if (vectors.length === 0) {
    return { speed: 0, direction: 0, reliability: 'low' };
  }
  
  // Calculate weighted average speed and direction
  let totalWeight = 0;
  let weightedSpeed = 0;
  let sinSum = 0;
  let cosSum = 0;
  
  for (const vector of vectors) {
    weightedSpeed += vector.speed * vector.weight;
    sinSum += Math.sin(vector.bearing * Math.PI/180) * vector.weight;
    cosSum += Math.cos(vector.bearing * Math.PI/180) * vector.weight;
    totalWeight += vector.weight;
  }
  
  const avgSpeed = weightedSpeed / totalWeight;
  const avgDirection = Math.atan2(sinSum, cosSum) * 180/Math.PI;
  
  // Calculate reliability based on consistency of vectors
  let speedVariance = 0;
  let directionVariance = 0;
  
  for (const vector of vectors) {
    speedVariance += Math.pow(vector.speed - avgSpeed, 2) * vector.weight;
    
    // For direction, we need to handle the circular nature of angles
    const dirDiff = Math.min(
      Math.abs(vector.bearing - avgDirection),
      360 - Math.abs(vector.bearing - avgDirection)
    );
    directionVariance += Math.pow(dirDiff, 2) * vector.weight;
  }
  
  speedVariance /= totalWeight;
  directionVariance /= totalWeight;
  
  // Determine reliability based on variances
  let reliability = 'medium';
  if (speedVariance < 5 && directionVariance < 100) {
    reliability = 'high';
  } else if (speedVariance > 20 || directionVariance > 900) {
    reliability = 'low';
  }
  
  // Calculate emitter mobility assessment
  const mobilityType = assessMobilityType(avgSpeed, speedVariance);
  
  return {
    speed: avgSpeed,
    speedKmh: avgSpeed * 3.6, // Convert m/s to km/h
    direction: avgDirection,
    reliability,
    speedVariance,
    directionVariance,
    mobilityType
  };
}

/**
 * Assess the mobility type of an emitter based on its speed pattern
 * @param {number} speed - Speed in m/s
 * @param {number} speedVariance - Variance in speed
 * @returns {string} - Mobility type assessment
 */
function assessMobilityType(speed, speedVariance) {
  if (speed < 0.1) {
    return 'stationary';
  } else if (speed < 1) {
    return 'quasi-stationary';
  } else if (speed < 5) {
    return speedVariance < 2 ? 'slow-moving' : 'stop-and-go';
  } else if (speed < 15) {
    return 'mobile';
  } else {
    return 'highly-mobile';
  }
}

/**
 * Calculate distance and bearing between two points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {Object} - Distance in meters and bearing in degrees
 */
function calculateDistanceAndBearing(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  // Haversine formula for distance
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  // Calculate bearing
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = (θ * 180/Math.PI + 360) % 360; // in degrees

  return { distance, bearing };
}