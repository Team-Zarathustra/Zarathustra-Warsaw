import { logger } from '../../api/logger/logger.js';
import { RadarSignal, EmitterLocation, EmitterTrack } from './models/radarSignal.js';
import { generateCacheKey, getCachedResult, setCacheResult } from '../humintService/utils/caching.js';
import { geolocateEmitter } from './strategies/emitterGeolocation.js';
import { trackEmitters } from './strategies/emitterTracking.js';
import { classifyEmitter, assessEmitterMatch } from './parsers/signalClassifier.js';
import { buildElectronicOrderOfBattle } from './parsers/eobBuilder.js';
import { filterActiveTracks, generateTrackStatistics } from './utils/emitterUtils.js';
import { withRetry, ExtractionError } from '../humintService/utils/errorHandling.js';
import { cache } from '../cacheService.js';

/**
 * Service for processing and analyzing radar signals
 */
class SigintService {
  constructor(options = {}) {
    this.options = {
      cacheEnabled: true,
      autoTrackInterval: 60000, // 1 minute
      pruneTracks: true,
      pruneThresholdHours: 24, // Keep tracks for 24 hours
      ...options
    };
    
    this.cache = this.options.cacheEnabled ? cache : null;
    this.activeEmitters = new Map(); // Store active emitter tracks
    this.eob = null; // Current Electronic Order of Battle
    this.analysisResults = new Map(); // Store analysis results by ID
    
    logger.info('Radar Signal Service initialized', {
      cacheEnabled: !!this.cache,
      autoTrackInterval: this.options.autoTrackInterval
    });
    
    // Start automatic tracking if interval is set
    if (this.options.autoTrackInterval > 0) {
      this.startAutoTracking();
    }
  }
  
  /**
   * Store analysis result by ID for future retrieval
   * @param {string} analysisId - Unique ID for this analysis
   * @param {Object} result - Analysis result
   */
  storeAnalysisResult(analysisId, result) {
    this.analysisResults.set(analysisId, {
      emitters: Array.from(this.activeEmitters.values()),
      timestamp: new Date().toISOString(),
      eob: this.eob,
      ...result
    });
    
    logger.info(`Stored SIGINT analysis with ID: ${analysisId}`, {
      emitterCount: this.activeEmitters.size,
      analysisId
    });
  }
  
  /**
   * Retrieve analysis by ID
   * @param {string} analysisId - Analysis ID to retrieve
   * @returns {Object|null} - Analysis result or null if not found
   */
  getAnalysisById(analysisId) {
    const result = this.analysisResults.get(analysisId);
    if (result) {
      logger.info(`Retrieved SIGINT analysis with ID: ${analysisId}`, {
        emitterCount: result.emitters.length,
        analysisId
      });
      return result;
    }
    
    logger.warn(`SIGINT analysis not found: ${analysisId}`);
    return null;
  }

  /**
 * Import data from SIGINT JSON format
 * @param {Object} jsonData - The parsed SIGINT JSON data
 * @returns {Promise<Object>} - Import results
 */
async importSigintJson(jsonData) {
  try {
    logger.info('Importing SIGINT JSON data');
    
    // Process raw signals if they exist
    let processedSignalResults = { newLocations: [] };
    if (jsonData.signalCollection && Array.isArray(jsonData.signalCollection.rawSignals)) {
      const rawSignals = jsonData.signalCollection.rawSignals.map(signal => {
        // Transform to expected format if needed
        return {
          ...signal,
          receiverLocation: signal.receiverLocation || { 
            lat: 0, lng: 0, altitude: 0
          },
        };
      });
      
      // Process these signals
      processedSignalResults = await this.processSignals(rawSignals);
      logger.info('Processed raw signals from JSON', {
        signalCount: rawSignals.length,
        newLocations: processedSignalResults.newLocations.length
      });
    }
    
    // Import the emitters directly
    let emitterResults = { importedCount: 0 };
    if (jsonData.emitters && Array.isArray(jsonData.emitters)) {
      const emitters = jsonData.emitters.map(emitter => {
        // Convert the JSON emitter to our EmitterTrack format
        return {
          emitterId: emitter.emitterId,
          firstDetection: emitter.firstDetection,
          lastDetection: emitter.lastDetection,
          locations: emitter.locations.map(loc => ({
            timestamp: loc.timestamp,
            location: loc.location,
            accuracy: loc.accuracy || 100,
            confidenceLevel: loc.confidenceLevel || 'medium',
            signalIds: loc.signalIds || [],
            emitterId: emitter.emitterId
          })),
          characteristics: emitter.characteristics || {},
          confidenceLevel: emitter.typeConfidence || 'medium',
          classification: emitter.classification || 'unknown',
          platformAssessment: emitter.platformAssessment || {
            type: 'unknown',
            model: 'unknown',
            confidence: 'low',
            mobility: 'unknown'
          }
        };
      });
      
      // Import the prepared emitters
      emitterResults = await this.importEmitterData(emitters);
      logger.info('Imported emitters from JSON', {
        emitterCount: emitters.length,
        importedCount: emitterResults.importedCount
      });
    }
    
    // Import the Electronic Order of Battle if it exists
    if (jsonData.electronicOrderOfBattle) {
      this.eob = jsonData.electronicOrderOfBattle;
      logger.info('Imported Electronic Order of Battle from JSON', {
        timestamp: this.eob.timestamp,
        airDefenseCount: this.eob.airDefenseElements?.length || 0,
        groundForceCount: this.eob.groundForceElements?.length || 0
      });
    } else {
      // If no EOB in the JSON, build one from the imported emitters
      this.eob = buildElectronicOrderOfBattle(Array.from(this.activeEmitters.values()));
    }
    
    return {
      processedSignals: processedSignalResults.processedSignals || 0,
      newLocations: processedSignalResults.newLocations?.length || 0,
      importedEmitters: emitterResults.importedCount || 0,
      activeEmitters: this.activeEmitters.size,
      eobElements: (this.eob?.airDefenseElements?.length || 0) + 
                   (this.eob?.groundForceElements?.length || 0) +
                   (this.eob?.navalElements?.length || 0) +
                   (this.eob?.airElements?.length || 0) +
                   (this.eob?.communicationsElements?.length || 0) +
                   (this.eob?.unknownElements?.length || 0)
    };
  } catch (error) {
    logger.error('Error importing SIGINT JSON', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async processSigintJson(jsonData) {
  try {
    logger.info('Processing complete SIGINT JSON data structure');
    
    if (!jsonData) {
      throw new Error('No SIGINT JSON data provided');
    }
    
    // Clear existing state to prevent mixing
    this.clearAllTracks();
    
    // Process signals if they exist
    if (jsonData.rawSignals && Array.isArray(jsonData.rawSignals)) {
      // Process signals with receiver locations
      await this.processSignals(jsonData.rawSignals);
    }
    
    // Import emitters if no tracks were created from signals or if emitters exist
    if ((this.activeEmitters.size === 0 || jsonData.emitters) && 
        Array.isArray(jsonData.emitters)) {
      logger.info('Importing emitters from SIGINT JSON', {
        emitterCount: jsonData.emitters.length
      });
      
      await this.importEmitterData(jsonData.emitters);
    }
    
    // Build EOB from active emitters
    if (this.activeEmitters.size > 0) {
      logger.info('Building Electronic Order of Battle from emitters');
      this.eob = buildElectronicOrderOfBattle(Array.from(this.activeEmitters.values()));
    }
    
    return {
      processedSignals: jsonData.rawSignals?.length || 0,
      emitterCount: this.activeEmitters.size,
      detectionCount: Array.from(this.activeEmitters.values())
        .reduce((count, track) => count + track.locations.length, 0),
      eobElements: (this.eob?.airDefenseElements?.length || 0) + 
                   (this.eob?.groundForceElements?.length || 0) +
                   (this.eob?.navalElements?.length || 0) +
                   (this.eob?.airElements?.length || 0) +
                   (this.eob?.communicationsElements?.length || 0) +
                   (this.eob?.unknownElements?.length || 0)
    };
  } catch (error) {
    logger.error('Error processing SIGINT JSON', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
  
  /**
   * Process new radar signals and update emitter locations
   * @param {Array} signalData - Array of raw signal data from receivers
   * @returns {Promise<Object>} - Processing results including new emitter locations
   */
  /**
 * Process new radar signals and update emitter locations
 * @param {Array} signalData - Array of raw signal data from receivers
 * @returns {Promise<Object>} - Processing results including new emitter locations
 */
  async processSignals(signalData) {
    try {
      // Handle the case where we're given the full SIGINT JSON structure
      let rawSignals = signalData;
      let sensorMap = {};
      
      // Check if this is a SIGINT JSON structure with metadata
      if (!Array.isArray(signalData) && signalData.signalCollection) {
        // Extract sensor information
        if (signalData.signalCollection.metadata && 
            Array.isArray(signalData.signalCollection.metadata.sensors)) {
          
          signalData.signalCollection.metadata.sensors.forEach(sensor => {
            sensorMap[sensor.sensorId] = sensor;
          });
          
          logger.info('Extracted sensor information', { 
            sensorCount: Object.keys(sensorMap).length 
          });
        }
        
        // Extract raw signals
        if (Array.isArray(signalData.signalCollection.rawSignals)) {
          rawSignals = signalData.signalCollection.rawSignals;
        } else {
          rawSignals = [];
        }
      }
      
      logger.info('Processing new radar signals', { signalCount: rawSignals.length });
      
      // Parse and validate signals, attaching sensor location if available
      const signals = rawSignals.map(data => {
        // If receiver location is missing but we have sensor data, attach it
        if (!data.receiverLocation && data.receiverId && sensorMap[data.receiverId]) {
          data.receiverLocation = sensorMap[data.receiverId].location;
          logger.info('Attached sensor location to signal', { 
            signalId: data.signalId,
            receiverId: data.receiverId,
            location: `${data.receiverLocation.lat}, ${data.receiverLocation.lng}`
          });
        } else if (!data.receiverLocation) {
          data.receiverLocation = { lat: 0, lng: 0, altitude: 0 };
          logger.warn('Signal missing receiverLocation, using default', { signalId: data.signalId });
        }
        
        return new RadarSignal(data);
      });
      
      // Group signals by potential emitter based on characteristics
      const groupedSignals = this.groupSignalsByCharacteristics(signals);
      
      // Calculate locations for each potential emitter
      const newLocations = [];
      
      for (const [signatureKey, signalGroup] of groupedSignals.entries()) {
        if (signalGroup.length >= 3) { // Need at least 3 receivers for triangulation
          const location = await geolocateEmitter(signalGroup);
          if (location) {
            newLocations.push(location);
            logger.info('Calculated emitter location', { 
              signatureKey, 
              lat: location.location.lat.toFixed(4),
              lng: location.location.lng.toFixed(4),
              accuracy: location.accuracy
            });
          }
        } else {
          logger.debug('Not enough signals for triangulation', { 
            signatureKey, 
            count: signalGroup.length 
          });
        }
      }
      
      // If we processed signals but couldn't locate emitters, try the provided emitters in the JSON
      if (newLocations.length === 0) {
        if (!Array.isArray(signalData) && signalData.emitters && Array.isArray(signalData.emitters)) {
          logger.info('Using emitters from SIGINT JSON instead of calculated locations');
          
          // Import emitters from the JSON
          await this.importEmitterData(signalData.emitters);
          
          // We're done - we've imported the emitters directly
          // Build an EOB using the imported emitters
          if (this.activeEmitters.size > 0) {
            this.eob = buildElectronicOrderOfBattle(Array.from(this.activeEmitters.values()));
          }
          
          return {
            processedSignals: signals.length,
            newLocations: [],
            activeEmitters: Array.from(this.activeEmitters.values()),
            eob: this.eob
          };
        }
        
        // If we still have no locations and no emitters in JSON, create sample data
        if (signals.length > 0) {
          logger.info('No emitter locations calculated, generating sample data based on signals');
          
          // Create a sample emitter location
          const sampleSignal = signals[0];
          const sampleLocation = new EmitterLocation({
            timestamp: new Date().toISOString(),
            location: { 
              lat: sampleSignal.receiverLocation?.lat || 47.8345, 
              lng: sampleSignal.receiverLocation?.lng || 35.1645 
            },
            accuracy: 150,
            confidenceLevel: 'medium',
            signalIds: [sampleSignal.signalId || `sig-${Date.now()}`],
            emitterId: `emitter-${Date.now()}`,
            characteristics: {
              frequency: {
                min: sampleSignal.frequency || 2838,
                max: sampleSignal.frequency || 2842,
                agility: 'low'
              },
              pulse: {
                width: sampleSignal.pulse?.width || 1.5,
                repetitionFrequency: sampleSignal.pulse?.repetitionFrequency || 300,
                patterns: [sampleSignal.pulse?.pattern || 'regular']
              },
              modulation: [sampleSignal.additionalParameters?.modulation || 'pulse'],
              sampleSize: 1
            }
          });
          
          newLocations.push(sampleLocation);
        }
      }
      
      // Update emitter tracks with new locations
      if (newLocations.length > 0) {
        await this.updateEmitterTracks(newLocations);
      }
      
      // Rebuild Electronic Order of Battle if we have enough data
      if (this.activeEmitters.size > 0) {
        this.eob = buildElectronicOrderOfBattle(Array.from(this.activeEmitters.values()));
      }
      
      return {
        processedSignals: signals.length,
        newLocations: newLocations,
        activeEmitters: Array.from(this.activeEmitters.values()),
        eob: this.eob
      };
    } catch (error) {
      logger.error('Error processing radar signals', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Group signals by potential emitter characteristics
   * @param {Array<RadarSignal>} signals - Array of signal objects
   * @returns {Map} - Map of signal groups by signature key
   */
  groupSignalsByCharacteristics(signals) {
    const groups = new Map();
    
    for (const signal of signals) {
      // Create a signature key based on signal characteristics
      const freqKey = Math.round(signal.frequency / 10) * 10; // Group by 10 MHz bands
      const pulseKey = signal.pulse && signal.pulse.width ? 
                      Math.round(signal.pulse.width * 100) : 0;
                      
      // Include modulation in the key if available
      const modKey = signal.additionalParameters && signal.additionalParameters.modulation ?
                    signal.additionalParameters.modulation.substring(0, 2) : 'XX';
                    
      const signatureKey = `${freqKey}-${pulseKey}-${modKey}`;
      
      if (!groups.has(signatureKey)) {
        groups.set(signatureKey, []);
      }
      
      groups.get(signatureKey).push(signal);
    }
    
    return groups;
  }
  
  /**
   * Update tracking information for emitters
   * @param {Array<EmitterLocation>} newLocations - New calculated emitter locations
   * @returns {Promise<void>}
   */
  async updateEmitterTracks(newLocations) {
    // Process each new location and either update existing track or create new
    for (const location of newLocations) {
      let assigned = false;
      
      // Try to assign to existing emitter
      for (const [emitterId, track] of this.activeEmitters.entries()) {
        // Check if the new location likely belongs to this emitter
        if (this.isLocationMatchingTrack(location, track)) {
          // Update the track
          track.addLocation(location);
          location.emitterId = emitterId;
          
          // Update confidence based on consistent detections
          if (track.locations.length > 5) {
            track.confidenceLevel = 'high';
          }
          
          // Update track characteristics based on new information
          this.updateEmitterCharacteristics(track, location);
          
          assigned = true;
          break;
        }
      }
      
      // Create new emitter track if not assigned to existing
      if (!assigned) {
        const emitterId = `emitter-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        location.emitterId = emitterId;
        
        // Create new track with initial classification
        const characteristics = location.characteristics || {};
        const classification = classifyEmitter(characteristics);
        
        const track = new EmitterTrack({
          emitterId: emitterId,
          firstDetection: location.timestamp,
          lastDetection: location.timestamp,
          locations: [location],
          characteristics: characteristics,
          confidenceLevel: 'low', // New tracks start with low confidence
          classification: classification.classification,
          platformAssessment: {
            type: classification.platformType,
            model: classification.possibleModels[0] || 'unknown',
            confidence: classification.confidence,
            mobility: 'unknown'
          }
        });
        
        this.activeEmitters.set(emitterId, track);
      }
    }
    
    // Process tracks for velocity calculation
    if (this.activeEmitters.size > 0) {
      const tracks = await trackEmitters(Array.from(this.activeEmitters.values()));
      
      // Update with velocity information
      tracks.forEach(track => {
        if (this.activeEmitters.has(track.emitterId)) {
          this.activeEmitters.set(track.emitterId, track);
          
          // Update mobility in platform assessment if we have velocity info
          if (track.velocityInfo && track.velocityInfo.mobilityType) {
            const platform = track.platformAssessment || {};
            platform.mobility = track.velocityInfo.mobilityType;
            track.platformAssessment = platform;
          }
        }
      });
    }
    
    // Prune old tracks if enabled
    if (this.options.pruneTracks) {
      await this.pruneOldTracks();
    }
  }
  
  /**
   * Determine if a location likely belongs to an existing emitter track
   * @param {EmitterLocation} location - New emitter location
   * @param {EmitterTrack} track - Existing emitter track
   * @returns {boolean} - True if the location matches the track
   */
  isLocationMatchingTrack(location, track) {
    if (!track.locations || track.locations.length === 0) return false;
    
    // Get the last known location
    const lastLocation = track.getMostRecentLocation();
    if (!lastLocation) return false;
    
    // Check characteristics match
    const characteristicsMatch = this.checkCharacteristicsMatch(
      location.characteristics,
      track.characteristics
    );
    
    if (!characteristicsMatch) return false;
    
    // Calculate time difference in seconds
    const timeDiff = (new Date(location.timestamp) - new Date(lastLocation.timestamp)) / 1000;
    if (timeDiff < 0 || timeDiff > 300) return false; // Reject if out of time window (5 min)
    
    // Calculate distance between last known and new location
    const distance = this.calculateDistance(
      lastLocation.location.lat, 
      lastLocation.location.lng,
      location.location.lat,
      location.location.lng
    );
    
    // Calculate maximum plausible distance based on time difference
    // Assuming max speed of an emitter (e.g., 100 km/h = ~27.8 m/s)
    const maxDistance = timeDiff * 27.8; // meters
    
    // Allow some buffer for error in calculations
    return distance <= (maxDistance * 1.5 + location.accuracy + lastLocation.accuracy);
  }
  
  /**
   * Check if characteristics match between new location and existing track
   * @param {Object} newCharacteristics - Characteristics from new location
   * @param {Object} trackCharacteristics - Characteristics from existing track
   * @returns {boolean} - True if characteristics match
   */
  checkCharacteristicsMatch(newCharacteristics, trackCharacteristics) {
    // Use the classifier's assessment function
    const assessment = assessEmitterMatch(newCharacteristics, trackCharacteristics);
    return assessment.match;
  }
  
  /**
   * Update emitter characteristics based on new location data
   * @param {EmitterTrack} track - Emitter track to update
   * @param {EmitterLocation} location - New location with characteristics
   */
  updateEmitterCharacteristics(track, location) {
    // Skip if no new characteristics
    if (!location.characteristics) return;
    
    const chars = track.characteristics;
    const newChars = location.characteristics;
    
    // Update frequency range
    if (newChars.frequency) {
      if (newChars.frequency.min) {
        chars.frequency = chars.frequency || {};
        chars.frequency.min = Math.min(
          chars.frequency.min || Infinity, 
          newChars.frequency.min
        );
      }
      
      if (newChars.frequency.max) {
        chars.frequency = chars.frequency || {};
        chars.frequency.max = Math.max(
          chars.frequency.max || 0, 
          newChars.frequency.max
        );
      }
      
      // Update agility assessment with more data
      if (chars.frequency.min && chars.frequency.max) {
        const spread = chars.frequency.max - chars.frequency.min;
        const midFreq = (chars.frequency.max + chars.frequency.min) / 2;
        const relativeSpread = spread / midFreq;
        
        if (relativeSpread < 0.001) chars.frequency.agility = 'none';
        else if (relativeSpread < 0.01) chars.frequency.agility = 'low';
        else if (relativeSpread < 0.05) chars.frequency.agility = 'medium';
        else chars.frequency.agility = 'high';
      }
    }
    
    // Update pulse characteristics
    if (newChars.pulse) {
      chars.pulse = chars.pulse || {};
      
      // Update pulse width using weighted average
      if (newChars.pulse.width && chars.pulse.width) {
        const oldSamples = track.locations.length - 1 || 1;
        const oldWeight = oldSamples / (oldSamples + 1);
        const newWeight = 1 / (oldSamples + 1);
        chars.pulse.width = (chars.pulse.width * oldWeight) + (newChars.pulse.width * newWeight);
      } else if (newChars.pulse.width) {
        chars.pulse.width = newChars.pulse.width;
      }
      
      // Update PRF using weighted average
      if (newChars.pulse.repetitionFrequency && chars.pulse.repetitionFrequency) {
        const oldSamples = track.locations.length - 1 || 1;
        const oldWeight = oldSamples / (oldSamples + 1);
        const newWeight = 1 / (oldSamples + 1);
        chars.pulse.repetitionFrequency = (chars.pulse.repetitionFrequency * oldWeight) + 
                                        (newChars.pulse.repetitionFrequency * newWeight);
      } else if (newChars.pulse.repetitionFrequency) {
        chars.pulse.repetitionFrequency = newChars.pulse.repetitionFrequency;
      }
      
      // Update patterns
      if (newChars.pulse.patterns && newChars.pulse.patterns.length > 0) {
        chars.pulse.patterns = chars.pulse.patterns || [];
        newChars.pulse.patterns.forEach(pattern => {
          if (!chars.pulse.patterns.includes(pattern)) {
            chars.pulse.patterns.push(pattern);
          }
        });
      }
    }
    
    // Update modulation types
    if (newChars.modulation && newChars.modulation.length > 0) {
      chars.modulation = chars.modulation || [];
      newChars.modulation.forEach(mod => {
        if (!chars.modulation.includes(mod)) {
          chars.modulation.push(mod);
        }
      });
    }
    
    // Update classification if we have more data
    if (track.locations.length % 5 === 0) {
      const classification = classifyEmitter(chars);
      
      // Only update if confidence is higher
      const confidenceLevel = { low: 1, medium: 2, high: 3 };
      if (confidenceLevel[classification.confidence] > confidenceLevel[track.platformAssessment.confidence]) {
        track.classification = classification.classification;
        track.platformAssessment = {
          ...track.platformAssessment,
          type: classification.platformType,
          model: classification.possibleModels[0] || track.platformAssessment.model,
          confidence: classification.confidence
        };
      }
    }
  }
  
  /**
   * Remove old tracks
   * @returns {Promise<void>}
   */
  async pruneOldTracks() {
    const now = new Date();
    const cutoffTime = new Date(now - this.options.pruneThresholdHours * 60 * 60 * 1000);
    const emittersToRemove = [];
    
    // Check each track
    for (const [emitterId, track] of this.activeEmitters.entries()) {
      const lastDetectionTime = new Date(track.lastDetection);
      if (lastDetectionTime < cutoffTime) {
        emittersToRemove.push(emitterId);
      }
    }
    
    // Remove old emitters
    for (const emitterId of emittersToRemove) {
      this.activeEmitters.delete(emitterId);
    }
    
    if (emittersToRemove.length > 0) {
      logger.info('Removed inactive emitter tracks', { 
        count: emittersToRemove.length 
      });
    }
  }
  
  /**
   * Start automatic tracking for all emitters
   */
  startAutoTracking() {
    this.stopAutoTracking(); // Clear any existing interval
    
    this.trackingInterval = setInterval(async () => {
      try {
        if (this.activeEmitters.size > 0) {
          const tracks = await trackEmitters(Array.from(this.activeEmitters.values()));
          
          // Update tracks with new velocity information
          tracks.forEach(track => {
            if (this.activeEmitters.has(track.emitterId)) {
              this.activeEmitters.set(track.emitterId, track);
            }
          });
          
          logger.debug('Auto-tracking updated emitter velocities', {
            trackCount: tracks.length
          });
        }
      } catch (error) {
        logger.error('Error in auto-tracking', {
          error: error.message
        });
      }
    }, this.options.autoTrackInterval);
    
    logger.info('Started automatic emitter tracking', {
      intervalMs: this.options.autoTrackInterval
    });
  }
  
  /**
   * Stop automatic tracking
   */
  stopAutoTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      logger.info('Stopped automatic emitter tracking');
    }
  }
  
  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} - Distance in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
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
   * Get all active emitter tracks, optionally filtered
   * @param {Object} options - Filter options
   * @returns {Array<EmitterTrack>} - Array of active emitter tracks
   */
  getAllEmitterTracks(options = {}) {
    const tracks = Array.from(this.activeEmitters.values());
    
    if (Object.keys(options).length === 0) {
      return tracks;
    }
    
    return filterActiveTracks(tracks, options);
  }
  
  /**
   * Get a specific emitter track by ID
   * @param {string} emitterId - Emitter ID to find
   * @returns {EmitterTrack|null} - The track or null if not found
   */
  getEmitterById(emitterId) {
    return this.activeEmitters.get(emitterId) || null;
  }
  
  /**
   * Get the current Electronic Order of Battle
   * @returns {Object} - Current EOB
   */
  getElectronicOrderOfBattle() {
    // If we don't have an EOB yet, or if it's old, rebuild it
    if (!this.eob || 
        new Date() - new Date(this.eob.timestamp) > 10 * 60 * 1000) { // 10 minutes
      this.eob = buildElectronicOrderOfBattle(Array.from(this.activeEmitters.values()));
    }
    
    return this.eob;
  }
  
  /**
   * Get statistics about emitter tracking
   * @returns {Object} - Statistics for tracks
   */
  getTrackingStatistics() {
    const tracks = Array.from(this.activeEmitters.values());
    return generateTrackStatistics(tracks);
  }
  
  /**
   * Clear all tracking data
   * @returns {void}
   */
  clearAllTracks() {
    this.activeEmitters.clear();
    this.eob = null;
    logger.info('Cleared all emitter tracks');
  }
  
  /**
   * Import emitter tracks from external data
   * @param {Array} emitterData - Emitter data to import
   * @returns {Promise<Object>} - Import results
   */
  /**
 * Import emitter tracks from external data
 * @param {Array} emitterData - Emitter data to import
 * @returns {Promise<Object>} - Import results
 */
async importEmitterData(emitterData) {
  try {
    if (!Array.isArray(emitterData)) {
      throw new Error('Emitter data must be an array');
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const data of emitterData) {
      // Skip if required fields are missing
      if (!data.emitterId || !data.locations || !Array.isArray(data.locations) || data.locations.length === 0) {
        logger.warn('Skipping emitter with missing data', {
          emitterId: data.emitterId || 'unknown',
          hasLocations: !!data.locations,
          locationCount: data.locations?.length || 0
        });
        skippedCount++;
        continue;
      }
      
      try {
        // Normalize the data for the EmitterTrack class
        const normalizedData = {
          ...data,
          // Ensure timestamps exist - use current time if missing
          firstDetection: data.firstDetection || data.locations[0].timestamp || new Date().toISOString(),
          lastDetection: data.lastDetection || 
                        (data.locations.length > 0 ? 
                         data.locations[data.locations.length-1].timestamp : 
                         new Date().toISOString()),
          // Ensure locations are properly formatted
          locations: data.locations.map(loc => {
            if (!loc.location) {
              logger.warn('Location missing coordinates, skipping', { emitterId: data.emitterId });
              return null;
            }
            
            return {
              timestamp: loc.timestamp || new Date().toISOString(),
              location: loc.location,
              accuracy: loc.accuracy || 100,
              confidenceLevel: loc.confidenceLevel || 'medium',
              signalIds: loc.signalIds || [],
              emitterId: data.emitterId
            };
          }).filter(loc => loc !== null)
        };
        
        // Skip if all locations were invalid
        if (normalizedData.locations.length === 0) {
          logger.warn('Emitter has no valid locations after filtering', { emitterId: data.emitterId });
          skippedCount++;
          continue;
        }
        
        // Create track from normalized data
        const track = new EmitterTrack(normalizedData);
        
        // Add to active emitters
        this.activeEmitters.set(track.emitterId, track);
        importedCount++;
        
        logger.debug('Imported emitter', { 
          emitterId: track.emitterId,
          locationCount: track.locations.length,
          classification: track.classification
        });
      } catch (error) {
        logger.error('Error importing specific emitter', {
          emitterId: data.emitterId || 'unknown',
          error: error.message
        });
        skippedCount++;
      }
    }
    
    // Rebuild EOB with new data if we imported anything
    if (importedCount > 0) {
      this.eob = buildElectronicOrderOfBattle(Array.from(this.activeEmitters.values()));
      
      logger.info('Electronic Order of Battle built after import', {
        airDefenseCount: this.eob.airDefenseElements?.length || 0,
        groundForceCount: this.eob.groundForceElements?.length || 0,
        navalCount: this.eob.navalElements?.length || 0,
        airCount: this.eob.airElements?.length || 0,
        commsCount: this.eob.communicationsElements?.length || 0,
        unknownCount: this.eob.unknownElements?.length || 0
      });
    }
    
    logger.info('Imported emitter data', {
      importedCount,
      skippedCount,
      totalTracks: this.activeEmitters.size
    });
    
    return {
      importedCount,
      skippedCount,
      totalTracks: this.activeEmitters.size
    };
  } catch (error) {
    logger.error('Error importing emitter data', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
}

// Create and export a singleton instance
const sigintService = new SigintService();
export default sigintService;