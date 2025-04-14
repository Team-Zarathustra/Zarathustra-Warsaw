import { logger } from '../../../api/logger/logger.js';
import { EmitterLocation } from '../models/radarSignal.js';

/**
 * Calculate emitter location based on multiple signal receptions
 * @param {Array<RadarSignal>} signals - Array of radar signals from different receivers
 * @returns {Promise<EmitterLocation|null>} - Calculated emitter location or null if not enough data
 */
export async function geolocateEmitter(signals) {
  try {
    if (signals.length < 3) {
      logger.warn('Not enough signals for triangulation', { 
        signalCount: signals.length 
      });
      return null;
    }
    
    logger.info('Calculating emitter location', { 
      signalCount: signals.length 
    });
    
    // Filter signals that have angle of arrival data
    const validSignals = signals.filter(s => 
      s.angleOfArrival !== undefined && 
      s.receiverLocation && 
      s.receiverLocation.lat && 
      s.receiverLocation.lng
    );
    
    if (validSignals.length < 3) {
      logger.warn('Not enough valid signals with angle data', { 
        validCount: validSignals.length 
      });
      return null;
    }
    
    // Implementation of triangulation algorithm
    const location = await calculateLocationByTriangulation(validSignals);
    
    if (!location) {
      return null;
    }
    
    // Extract characteristics from the signals to help with classification
    const characteristics = extractEmitterCharacteristics(signals);
    
    // Create and return the emitter location
    return new EmitterLocation({
      timestamp: new Date().toISOString(),
      location: location.position,
      accuracy: location.accuracy,
      confidenceLevel: calculateConfidenceLevel(signals, location.accuracy),
      signalIds: signals.map(s => s.signalId),
      characteristics: characteristics
    });
  } catch (error) {
    logger.error('Error in emitter geolocation', { 
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Calculate emitter location using triangulation
 * @param {Array<RadarSignal>} signals - Array of signals with angle information
 * @returns {Promise<Object|null>} - Location data or null
 */
async function calculateLocationByTriangulation(signals) {
  try {
    // Convert all angles to radians and calculate direction vectors
    const receivers = signals.map(signal => {
      // Default angle if missing
      const angle = signal.angleOfArrival !== undefined ? signal.angleOfArrival : 0;
      const angleRad = angle * (Math.PI / 180);
      
      // Check for valid receiver location
      if (!signal.receiverLocation || 
          signal.receiverLocation.lat === undefined || 
          signal.receiverLocation.lng === undefined) {
        logger.warn('Signal has invalid receiver location', { signalId: signal.signalId });
        return null;
      }
      
      return {
        lat: signal.receiverLocation.lat,
        lng: signal.receiverLocation.lng,
        dirX: Math.sin(angleRad),
        dirY: Math.cos(angleRad)
      };
    }).filter(r => r !== null);
    
    if (receivers.length < 3) {
      logger.warn('Not enough valid receivers for triangulation', { 
        validCount: receivers.length,
        requiredCount: 3
      });
      
      // If we have at least one receiver, return its location as a fallback
      if (receivers.length > 0) {
        logger.info('Using receiver location as fallback');
        return {
          position: {
            lat: receivers[0].lat,
            lng: receivers[0].lng
          },
          accuracy: 500, // High uncertainty
          intersectionCount: 0
        };
      }
      
      return null;
    }
    
    // For each pair of receivers, find intersection point
    const intersections = [];
    
    for (let i = 0; i < receivers.length; i++) {
      for (let j = i + 1; j < receivers.length; j++) {
        const r1 = receivers[i];
        const r2 = receivers[j];
        
        // Calculate intersection of two lines
        // Line 1: r1.lat + t * r1.dirY, r1.lng + t * r1.dirX
        // Line 2: r2.lat + s * r2.dirY, r2.lng + s * r2.dirX
        
        // Handle parallel lines
        const det = r1.dirX * r2.dirY - r1.dirY * r2.dirX;
        if (Math.abs(det) < 1e-10) continue;
        
        const dx = r2.lat - r1.lat;
        const dy = r2.lng - r1.lng;
        
        const t = (dy * r2.dirX - dx * r2.dirY) / det;
        
        // Calculate intersection point
        const intersectionLat = r1.lat + t * r1.dirY;
        const intersectionLng = r1.lng + t * r1.dirX;
        
        // Simple validation to filter out unreasonable results
        // Check if point is within reasonable distance of receivers
        const dist1 = calculateDistance(r1.lat, r1.lng, intersectionLat, intersectionLng);
        const dist2 = calculateDistance(r2.lat, r2.lng, intersectionLat, intersectionLng);
        
        // Skip if distance is unreasonably large (e.g., > 100km)
        if (dist1 > 100000 || dist2 > 100000) {
          continue;
        }
        
        // Weight based on signal strength if available, or just use 1
        const signal1 = signals[i];
        const signal2 = signals[j];
        
        // Convert dBm to linear scale for weights if available
        const weight1 = signal1.signalStrength ? Math.pow(10, signal1.signalStrength / 10) : 1;
        const weight2 = signal2.signalStrength ? Math.pow(10, signal2.signalStrength / 10) : 1;
        const weight = (weight1 + weight2) / 2;
        
        intersections.push({
          lat: intersectionLat,
          lng: intersectionLng,
          weight: weight
        });
      }
    }
    
    if (intersections.length === 0) {
      logger.warn('No valid intersections found');
      // Fallback: return average of receiver positions
      const avgLat = receivers.reduce((sum, r) => sum + r.lat, 0) / receivers.length;
      const avgLng = receivers.reduce((sum, r) => sum + r.lng, 0) / receivers.length;
      
      return {
        position: {
          lat: avgLat,
          lng: avgLng
        },
        accuracy: 800, // Very high uncertainty
        intersectionCount: 0
      };
    }
    
    // Calculate weighted average of all intersections
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    
    for (const intersection of intersections) {
      weightedLat += intersection.lat * intersection.weight;
      weightedLng += intersection.lng * intersection.weight;
      totalWeight += intersection.weight;
    }
    
    // Calculate final position
    const position = {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight
    };
    
    // Calculate accuracy based on spread of intersections
    let sumSquaredDistance = 0;
    for (const intersection of intersections) {
      const distance = calculateDistance(
        position.lat, position.lng,
        intersection.lat, intersection.lng
      );
      sumSquaredDistance += distance * distance;
    }
    
    const accuracy = Math.sqrt(sumSquaredDistance / intersections.length);
    
    logger.info('Triangulation successful', {
      intersectionCount: intersections.length,
      accuracy: Math.round(accuracy)
    });
    
    return {
      position,
      accuracy,
      intersectionCount: intersections.length
    };
  } catch (error) {
    logger.error('Error in triangulation calculation', {
      error: error.message,
      stack: error.stack
    });
    
    // Return null on error
    return null;
  }
}

/**
 * Extract emitter characteristics from signal data
 * @param {Array<RadarSignal>} signals - Array of radar signals
 * @returns {Object} - Extracted characteristics
 */
function extractEmitterCharacteristics(signals) {
  // Extract frequency information
  const frequencies = signals.map(s => s.frequency).filter(f => f);
  const minFrequency = frequencies.length > 0 ? Math.min(...frequencies) : null;
  const maxFrequency = frequencies.length > 0 ? Math.max(...frequencies) : null;
  
  // Extract pulse characteristics
  const pulseWidths = signals
    .map(s => s.pulse?.width)
    .filter(p => p !== undefined && p !== null);
  
  const pulseReps = signals
    .map(s => s.pulse?.repetitionFrequency)
    .filter(p => p !== undefined && p !== null);
  
  // Determine signal patterns
  const patterns = new Set();
  signals.forEach(s => {
    if (s.pulse?.pattern) {
      patterns.add(s.pulse.pattern);
    }
  });
  
  // Determine modulation types
  const modulations = new Set();
  signals.forEach(s => {
    if (s.additionalParameters?.modulation) {
      modulations.add(s.additionalParameters.modulation);
    }
  });
  
  // Calculate frequency agility
  let frequencyAgility = 'unknown';
  if (frequencies.length > 2) {
    const spread = maxFrequency - minFrequency;
    const midFreq = (maxFrequency + minFrequency) / 2;
    const relativeSpread = spread / midFreq;
    
    if (relativeSpread < 0.001) frequencyAgility = 'none';
    else if (relativeSpread < 0.01) frequencyAgility = 'low';
    else if (relativeSpread < 0.05) frequencyAgility = 'medium';
    else frequencyAgility = 'high';
  }
  
  // Build the characteristics object
  return {
    frequency: {
      min: minFrequency,
      max: maxFrequency,
      agility: frequencyAgility
    },
    pulse: {
      width: pulseWidths.length > 0 ? 
        pulseWidths.reduce((a, b) => a + b, 0) / pulseWidths.length : null,
      repetitionFrequency: pulseReps.length > 0 ?
        pulseReps.reduce((a, b) => a + b, 0) / pulseReps.length : null,
      patterns: Array.from(patterns)
    },
    modulation: Array.from(modulations),
    sampleSize: signals.length
  };
}

/**
 * Calculate confidence level based on signal quality and calculation accuracy
 * @param {Array<RadarSignal>} signals - Signals used for calculation
 * @param {number} accuracy - Calculated accuracy in meters
 * @returns {string} - Confidence level (high, medium, low)
 */
function calculateConfidenceLevel(signals, accuracy) {
  // More signals generally means higher confidence
  const signalCountFactor = Math.min(signals.length / 5, 1);
  
  // Better accuracy means higher confidence
  const accuracyFactor = accuracy < 100 ? 1 : 
                       accuracy < 500 ? 0.7 : 
                       accuracy < 1000 ? 0.4 : 0.2;
  
  // Signal strength factor
  const signalStrengths = signals.map(s => s.signalStrength);
  const avgStrength = signalStrengths.length > 0 ?
    signalStrengths.reduce((sum, s) => sum + s, 0) / signalStrengths.length : -100;
  
  const strengthFactor = avgStrength > -50 ? 1 :
                       avgStrength > -70 ? 0.8 :
                       avgStrength > -90 ? 0.5 : 0.3;
  
  // Calculate overall confidence score
  const confidenceScore = signalCountFactor * 0.4 + 
                        accuracyFactor * 0.4 + 
                        strengthFactor * 0.2;
  
  // Convert to confidence level
  if (confidenceScore > 0.7) return 'high';
  if (confidenceScore > 0.4) return 'medium';
  return 'low';
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
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