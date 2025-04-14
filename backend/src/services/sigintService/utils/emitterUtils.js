/**
 * Filter active emitter tracks
 * @param {Array<EmitterTrack>} tracks - All emitter tracks
 * @param {Object} options - Filter options
 * @returns {Array<EmitterTrack>} - Filtered tracks
 */
export function filterActiveTracks(tracks, options = {}) {
    const {
      timeWindow = 60 * 60 * 1000, // 1 hour by default
      areaFilter = null,
      typeFilter = null,
      confidenceFilter = null
    } = options;
    
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeWindow);
    
    return tracks.filter(track => {
      // Time filter - check if last detection is within time window
      const lastDetection = new Date(track.lastDetection);
      if (lastDetection < cutoffTime) {
        return false;
      }
      
      if (areaFilter) {
        const lastLocation = track.getMostRecentLocation();
        if (!lastLocation || !isPointInArea(lastLocation.location, areaFilter)) {
          return false;
        }
      }
      
      // Type filter if specified
      if (typeFilter && track.classification !== typeFilter) {
        return false;
      }
      
      // Confidence filter if specified
      if (confidenceFilter && track.confidenceLevel !== confidenceFilter) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Check if a point is within a geographic area
   * @param {Object} point - Point coordinates {lat, lng}
   * @param {Object} area - Area definition (bbox or circle)
   * @returns {boolean} - True if point is in area
   */
  export function isPointInArea(point, area) {
    if (!point || !point.lat || !point.lng) {
      return false;
    }
    
    // Bounding box check
    if (area.north !== undefined && area.south !== undefined && 
        area.east !== undefined && area.west !== undefined) {
      return point.lat <= area.north && point.lat >= area.south &&
             point.lng <= area.east && point.lng >= area.west;
    }
    
    // Circle check
    if (area.center && area.radius) {
      const distance = calculateDistance(
        point.lat, point.lng,
        area.center.lat, area.center.lng
      );
      return distance <= area.radius;
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
  export function calculateDistance(lat1, lng1, lat2, lng2) {
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
   * Convert track array to GeoJSON format
   * @param {Array<EmitterTrack>} tracks - Emitter tracks
   * @param {boolean} includeHistory - Whether to include historical locations
   * @returns {Object} - GeoJSON FeatureCollection
   */
  export function tracksToGeoJSON(tracks, includeHistory = false) {
    const features = [];
    
    tracks.forEach(track => {
      // Current location as point feature
      const lastLocation = track.getMostRecentLocation();
      if (lastLocation && lastLocation.location) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lastLocation.location.lng, lastLocation.location.lat]
          },
          properties: {
            emitterId: track.emitterId,
            classification: track.classification,
            timestamp: lastLocation.timestamp,
            confidence: lastLocation.confidenceLevel,
            accuracy: lastLocation.accuracy,
            platformType: track.platformAssessment?.type || 'unknown'
          }
        });
        
        // Add accuracy circle
        if (lastLocation.accuracy) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Circle',
              coordinates: [lastLocation.location.lng, lastLocation.location.lat],
              radius: lastLocation.accuracy
            },
            properties: {
              emitterId: track.emitterId,
              type: 'accuracy',
              confidence: lastLocation.confidenceLevel
            }
          });
        }
      }
      
      // Include historical track if requested
      if (includeHistory && track.locations && track.locations.length > 1) {
        // Sort locations by time
        const sortedLocations = [...track.locations].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        // Create LineString for track
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: sortedLocations
              .filter(loc => loc.location && loc.location.lat && loc.location.lng)
              .map(loc => [loc.location.lng, loc.location.lat])
          },
          properties: {
            emitterId: track.emitterId,
            type: 'track',
            classification: track.classification,
            firstDetection: track.firstDetection,
            lastDetection: track.lastDetection
          }
        });
      }
    });
    
    return {
      type: 'FeatureCollection',
      features
    };
  }
  
  /**
   * Generate summary statistics for a set of emitter tracks
   * @param {Array<EmitterTrack>} tracks - Emitter tracks to analyze
   * @returns {Object} - Statistical summary
   */
  export function generateTrackStatistics(tracks) {
    if (!tracks || tracks.length === 0) {
      return {
        count: 0,
        classifications: {},
        confidence: {
          high: 0,
          medium: 0,
          low: 0
        },
        averageLocationCount: 0
      };
    }
    
    // Count classifications
    const classifications = {};
    tracks.forEach(track => {
      if (track.classification) {
        classifications[track.classification] = 
          (classifications[track.classification] || 0) + 1;
      }
    });
    
    // Count confidence levels
    const confidence = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    tracks.forEach(track => {
      if (track.confidenceLevel && confidence[track.confidenceLevel] !== undefined) {
        confidence[track.confidenceLevel]++;
      }
    });
    
    // Calculate average location count
    const totalLocations = tracks.reduce(
      (sum, track) => sum + (track.locations ? track.locations.length : 0),
      0
    );
    
    const averageLocationCount = tracks.length ? totalLocations / tracks.length : 0;
    
    // Calculate time span
    let oldestTime = new Date();
    let newestTime = new Date(0);
    
    tracks.forEach(track => {
      if (track.firstDetection) {
        const time = new Date(track.firstDetection);
        if (time < oldestTime) oldestTime = time;
      }
      if (track.lastDetection) {
        const time = new Date(track.lastDetection);
        if (time > newestTime) newestTime = time;
      }
    });
    
    const timeSpanMs = newestTime - oldestTime;
    const timeSpanHours = timeSpanMs / (1000 * 60 * 60);
    
    return {
      count: tracks.length,
      classifications,
      confidence,
      averageLocationCount,
      timeStats: {
        oldestDetection: oldestTime.toISOString(),
        newestDetection: newestTime.toISOString(),
        timeSpanHours: timeSpanHours
      }
    };
  }
  
  /**
   * Create a unique signature for an emitter based on characteristics
   * @param {Object} characteristics - Emitter characteristics
   * @returns {string} - Signature hash
   */
  export function generateEmitterSignature(characteristics) {
    if (!characteristics || !characteristics.frequency) {
      return null;
    }
    
    const signatureParts = [];
    
    // Add frequency range
    if (characteristics.frequency.min && characteristics.frequency.max) {
      const freqMid = Math.round((characteristics.frequency.min + characteristics.frequency.max) / 2);
      signatureParts.push(`F${freqMid}`);
    }
    
    // Add pulse data
    if (characteristics.pulse) {
      if (characteristics.pulse.width) {
        signatureParts.push(`PW${Math.round(characteristics.pulse.width * 100)}`);
      }
      if (characteristics.pulse.repetitionFrequency) {
        signatureParts.push(`PRF${Math.round(characteristics.pulse.repetitionFrequency)}`);
      }
      if (characteristics.pulse.patterns && characteristics.pulse.patterns.length > 0) {
        signatureParts.push(`PP${characteristics.pulse.patterns[0].substring(0, 3)}`);
      }
    }
    
    // Add modulation if available
    if (characteristics.modulation && characteristics.modulation.length > 0) {
      signatureParts.push(`MOD${characteristics.modulation[0].substring(0, 3)}`);
    }
    
    return signatureParts.join('-');
  }