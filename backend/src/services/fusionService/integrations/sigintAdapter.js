// services/fusionService/integrations/sigintAdapter.js
import { logger } from '../../../api/logger/logger.js';
import sigintService from '../../sigintService/index.js';

/**
 * Adapter for retrieving SIGINT data from the radar service
 */
export default class SigintAdapter {
  constructor() {
    this.sigintService = sigintService;
    logger.info('SIGINT adapter initialized');
  }
  
  /**
   * Get active emitter tracks from the radar service
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} - Array of active emitter tracks
   */
/**
 * Get active emitter tracks from the radar service
 * @param {Object} options - Filtering options
 * @returns {Promise<Array>} - Array of active emitter tracks
 */
async getActiveEmitterTracks(options = {}) {
  try {
    let tracks = [];
    
    // If we have an analysisId, use it to retrieve the specific analysis
    if (options.analysisId) {
      const analysis = this.sigintService.getAnalysisById(options.analysisId);
      if (analysis && analysis.emitters) {
        logger.info(`Using emitters from analysis: ${options.analysisId}`, {
          emitterCount: analysis.emitters.length
        });
        return analysis.emitters;
      } else {
        logger.warn(`Analysis not found: ${options.analysisId}, falling back to current emitters`);
      }
    }
    
    // Fall back to getting all active tracks
    tracks = this.sigintService.getAllEmitterTracks(options);
    
    // If still no tracks found, generate a sample track for development
    if (!tracks || tracks.length === 0) {
      logger.info('No tracks found, generating sample track for development');
      
      // Create a sample emitter track
      const sampleTrack = {
        emitterId: `emitter-${Date.now()}`,
        firstDetection: new Date(new Date().getTime() - 3600000).toISOString(),
        lastDetection: new Date().toISOString(),
        locations: [
          {
            timestamp: new Date().toISOString(),
            location: { lat: 47.8345, lng: 35.1645 },
            accuracy: 150,
            confidenceLevel: 'high'
          }
        ],
        characteristics: {
          frequency: {
            min: 2838,
            max: 2842,
            agility: 'low'
          },
          pulse: {
            width: 1.5,
            repetitionFrequency: 300,
            patterns: ['regular']
          },
          modulation: ['pulse']
        },
        confidenceLevel: 'high',
        classification: 'air-surveillance-radar',
        platformAssessment: {
          type: 'ground-based',
          model: 'P-18 Spoon Rest D',
          confidence: 'medium',
          mobility: 'slow-moving'
        }
      };
      
      return [sampleTrack];
    }
    
    return tracks;
  } catch (error) {
    logger.error('Error retrieving SIGINT tracks', { error: error.message });
    return [];
  }
}
  
/**
 * Convert emitter tracks to standardized entities
 * @param {Array} tracks - Emitter tracks
 * @returns {Array} - Standardized entities
 */
convertTracksToEntities(tracks) {
  try {
    logger.info('Converting SIGINT tracks to entities', { trackCount: tracks.length });
    
    return tracks.map(track => {
      // Get the most recent location for this track
      if (!track.locations || track.locations.length === 0) {
        logger.warn('Track has no locations, skipping', { emitterId: track.emitterId });
        return null;
      }
      
      const recentLocations = track.locations
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      const mostRecent = recentLocations[0];
      
      // Check if location has the right format
      if (!mostRecent.location || 
          (mostRecent.location.lat === undefined && mostRecent.location.lng === undefined)) {
        logger.warn('Track has invalid location format, skipping', { emitterId: track.emitterId });
        return null;
      }
      
      // Create standardized entity with coordinates in the expected format for fusion
      return {
        type: 'electronic_emitter',
        subtype: track.classification || 'radar',
        source: 'sigint',
        emitterId: track.emitterId,
        location: {
          // Ensure coordinates are in array format expected by fusion layer
          coordinates: [
            mostRecent.location.lat, 
            mostRecent.location.lng
          ],
          name: track.platformAssessment?.model || 
                `${track.classification || 'Unknown'} emitter at ${mostRecent.location.lat.toFixed(4)}, ${mostRecent.location.lng.toFixed(4)}`
        },
        timestamp: mostRecent.timestamp,
        description: `${track.classification || 'Unknown'} ${track.platformAssessment?.type || 'radar'} emitter`,
        confidence: mostRecent.confidenceLevel || track.confidenceLevel || 'medium',
        properties: {
          characteristics: track.characteristics,
          platformAssessment: track.platformAssessment,
          firstDetection: track.firstDetection,
          lastDetection: track.lastDetection,
          detectionCount: track.locations.length,
          mobilityType: track.platformAssessment?.mobility || track.velocityInfo?.mobilityType || 'unknown'
        }
      };
    }).filter(entity => entity !== null); // Remove any null entities
  } catch (error) {
    logger.error('Error converting SIGINT tracks to entities', {
      error: error.message,
      stack: error.stack
    });
    return [];
  }
}
  
  /**
   * Check if a track is within a geographic area
   * @param {Object} track - Emitter track
   * @param {Object} area - Area specification
   * @returns {boolean} - True if track is in area
   */
  isTrackInArea(track, area) {
    // Get the most recent location
    if (!track.locations || track.locations.length === 0) {
      return false;
    }
    
    const recentLocation = track.locations[track.locations.length - 1];
    if (!recentLocation || !recentLocation.location) {
      return false;
    }
    
    const location = recentLocation.location;
    
    // If area is a string (name), we can't really check
    if (typeof area === 'string') {
      return false;
    }
    
    // If area is a bounding box
    if (area.north && area.south && area.east && area.west) {
      const lat = location.lat || location[0];
      const lng = location.lng || location[1];
      
      return lat <= area.north && lat >= area.south && 
             lng <= area.east && lng >= area.west;
    }
    
    // If area is a center point and radius (km)
    if (area.center && area.radius) {
      const entityLat = location.lat || location[0];
      const entityLng = location.lng || location[1];
      
      const R = 6371; // Earth radius in km
      const φ1 = entityLat * Math.PI/180;
      const φ2 = area.center[0] * Math.PI/180;
      const Δφ = (area.center[0] - entityLat) * Math.PI/180;
      const Δλ = (area.center[1] - entityLng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // in km
      
      return distance <= area.radius;
    }
    
    return false;
  }
  
  /**
   * Get a specific emitter track by ID
   * @param {string} emitterId - Emitter ID
   * @returns {Object|null} - Emitter track or null if not found
   */
  getEmitterById(emitterId) {
    try {
      const tracks = this.sigintService.getAllEmitterTracks();
      const track = tracks.find(t => t.emitterId === emitterId);
      
      if (!track) {
        logger.warn('SIGINT emitter not found', { emitterId });
        return null;
      }
      
      return track;
    } catch (error) {
      logger.error('Error getting SIGINT emitter', {
        emitterId,
        error: error.message
      });
      return null;
    }
  }
}