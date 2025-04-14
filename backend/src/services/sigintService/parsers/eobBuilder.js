import { logger } from '../../../api/logger/logger.js';
import { EOBElement } from '../models/radarSignal.js';

/**
 * Build Electronic Order of Battle from emitter tracks
 * @param {Array<EmitterTrack>} tracks - Array of emitter tracks
 * @returns {Object} - Electronic Order of Battle
 */
export function buildElectronicOrderOfBattle(tracks) {
  try {
    logger.info('Building Electronic Order of Battle', { trackCount: tracks.length });
    
    const eob = {
      timestamp: new Date().toISOString(),
      airDefenseElements: [],
      groundForceElements: [],
      navalElements: [],
      airElements: [],
      communicationsElements: [],
      unknownElements: []
    };
    
    // Group emitters by location clusters
    const clusters = clusterEmittersByLocation(tracks);
    
    // Process each cluster to identify military elements
    clusters.forEach((clusterTracks, index) => {
      // Skip clusters with only one emitter if not significant
      if (clusterTracks.length === 1 && !isSingleEmitterSignificant(clusterTracks[0])) {
        return;
      }
      
      // Identify the type of military element in this cluster
      const elementType = identifyMilitaryElementType(clusterTracks);
      const elementId = `${elementType.category}-${Date.now()}-${index}`;
      
      // Calculate approximate center location for the element
      const location = calculateClusterCenter(clusterTracks);
      
      // Create EOB element
      const element = new EOBElement({
        id: elementId,
        type: elementType.type,
        components: clusterTracks.map(track => ({
          emitterId: track.emitterId,
          classification: track.classification,
          function: determineFunctionInElement(track, elementType.type)
        })),
        location,
        confidence: calculateElementConfidence(clusterTracks),
        notes: generateElementNotes(clusterTracks, elementType),
        timestamp: new Date().toISOString()
      });
      
      // Add to appropriate category in EOB
      switch (elementType.category) {
        case 'AD':
          eob.airDefenseElements.push(element);
          break;
        case 'GF':
          eob.groundForceElements.push(element);
          break;
        case 'NF':
          eob.navalElements.push(element);
          break;
        case 'AF':
          eob.airElements.push(element);
          break;
        case 'CM':
          eob.communicationsElements.push(element);
          break;
        default:
          eob.unknownElements.push(element);
      }
    });
    
    logger.info('Electronic Order of Battle built', {
      airDefenseCount: eob.airDefenseElements.length,
      groundForceCount: eob.groundForceElements.length,
      navalCount: eob.navalElements.length,
      airCount: eob.airElements.length,
      commsCount: eob.communicationsElements.length,
      unknownCount: eob.unknownElements.length
    });
    
    return eob;
  } catch (error) {
    logger.error('Error building Electronic Order of Battle', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      timestamp: new Date().toISOString(),
      airDefenseElements: [],
      groundForceElements: [],
      navalElements: [],
      airElements: [],
      communicationsElements: [],
      unknownElements: [],
      error: error.message
    };
  }
}

/**
 * Cluster emitters based on geographic proximity
 * @param {Array<EmitterTrack>} tracks - Array of emitter tracks
 * @returns {Array<Array<EmitterTrack>>} - Arrays of clustered tracks
 */
function clusterEmittersByLocation(tracks) {
  // Filter tracks that have location information
  const tracksWithLocation = tracks.filter(track => {
    const location = track.getMostRecentLocation();
    return location && location.location && 
           location.location.lat && location.location.lng;
  });
  
  if (tracksWithLocation.length === 0) {
    return [];
  }
  
  // Initialize clusters with the first track
  const clusters = [[tracksWithLocation[0]]];
  const clusterRadius = 5000; // 5km radius for clustering
  
  // Assign each track to a cluster or create a new one
  for (let i = 1; i < tracksWithLocation.length; i++) {
    const track = tracksWithLocation[i];
    const trackLocation = track.getMostRecentLocation().location;
    
    let assignedToCluster = false;
    
    // Check each existing cluster
    for (const cluster of clusters) {
      // Get representative location of cluster (first track's location)
      const clusterLocation = cluster[0].getMostRecentLocation().location;
      
      // Calculate distance
      const distance = calculateDistance(
        trackLocation.lat, trackLocation.lng,
        clusterLocation.lat, clusterLocation.lng
      );
      
      // If within cluster radius, add to this cluster
      if (distance <= clusterRadius) {
        cluster.push(track);
        assignedToCluster = true;
        break;
      }
    }
    
    // If not assigned to any cluster, create a new one
    if (!assignedToCluster) {
      clusters.push([track]);
    }
  }
  
  return clusters;
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

/**
 * Determine if a single emitter is significant enough to be its own element
 * @param {EmitterTrack} track - Emitter track to evaluate
 * @returns {boolean} - True if the emitter is significant
 */
function isSingleEmitterSignificant(track) {
  // Key radar types are always significant
  const significantTypes = [
    'early-warning-radar',
    'long-range-surveillance',
    'air-surveillance-radar',
    'counter-battery-radar',
    'phased-array-radar'
  ];
  
  if (significantTypes.includes(track.classification)) {
    return true;
  }
  
  // High confidence emitters might be significant
  if (track.confidenceLevel === 'high' && 
      track.locations.length > 5 &&
      track.platformAssessment &&
      track.platformAssessment.confidence !== 'low') {
    return true;
  }
  
  return false;
}

/**
 * Identify the military element type based on emitter tracks
 * @param {Array<EmitterTrack>} tracks - Clustered emitter tracks
 * @returns {Object} - Element type identification
 */
function identifyMilitaryElementType(tracks) {
  // Count emitter types
  const typeCounts = {};
  
  tracks.forEach(track => {
    if (track.classification) {
      typeCounts[track.classification] = (typeCounts[track.classification] || 0) + 1;
    }
  });
  
  // Air defense patterns
  const adRadars = [
    'air-surveillance-radar',
    'early-warning-radar',
    'long-range-surveillance',
    'fire-control-radar'
  ];
  
  const adCount = adRadars.reduce((count, type) => count + (typeCounts[type] || 0), 0);
  
  // Ground force patterns
  const gfRadars = [
    'ground-surveillance-radar',
    'counter-battery-radar',
    'battlefield-surveillance-radar',
    'targeting-radar'
  ];
  
  const gfCount = gfRadars.reduce((count, type) => count + (typeCounts[type] || 0), 0);
  
  // Communication patterns
  const commTypes = [
    'vhf-tactical-communications',
    'uhf-tactical-communications',
    'hf-communications',
    'uhf-digital-communications'
  ];
  
  const commCount = commTypes.reduce((count, type) => count + (typeCounts[type] || 0), 0);
  
  // Naval patterns (rare but possible)
  const navalRadars = [
    'naval-surveillance-radar',
    'navigation-radar',
    'surface-search-radar'
  ];
  
  const navalCount = navalRadars.reduce((count, type) => count + (typeCounts[type] || 0), 0);
  
  // Determine the dominant category
  const categories = [
    { count: adCount, category: 'AD', type: determineAirDefenseType(tracks) },
    { count: gfCount, category: 'GF', type: determineGroundForceType(tracks) },
    { count: commCount, category: 'CM', type: 'communications-node' },
    { count: navalCount, category: 'NF', type: 'naval-unit' }
  ];
  
  const dominantCategory = categories.sort((a, b) => b.count - a.count)[0];
  
  // If no clear signature, use most reliable information
  if (dominantCategory.count === 0) {
    // Look for platform assessments
    const platforms = tracks
      .filter(t => t.platformAssessment && t.platformAssessment.type)
      .map(t => t.platformAssessment.type);
    
    if (platforms.includes('ground-based')) {
      return { category: 'GF', type: 'unknown-ground-unit' };
    } else if (platforms.includes('vehicle-mounted')) {
      return { category: 'GF', type: 'unknown-ground-unit' };
    } else if (platforms.includes('ship-based')) {
      return { category: 'NF', type: 'unknown-naval-unit' };
    }
    
    // Default to unknown
    return { category: 'UN', type: 'unknown-element' };
  }
  
  return dominantCategory;
}

/**
 * Determine specific air defense type
 * @param {Array<EmitterTrack>} tracks - Emitter tracks in this element
 * @returns {string} - Specific air defense type
 */
function determineAirDefenseType(tracks) {
  // Look for specific radar combinations
  const hasLongRange = tracks.some(t => 
    t.classification === 'long-range-surveillance' || 
    t.classification === 'early-warning-radar'
  );
  
  const hasFireControl = tracks.some(t => 
    t.classification === 'fire-control-radar'
  );
  
  if (hasLongRange && hasFireControl) {
    return 'integrated-air-defense';
  } else if (hasFireControl) {
    return 'SAM-system';
  } else if (hasLongRange) {
    return 'early-warning-site';
  }
  
  return 'air-defense-element';
}

/**
 * Determine specific ground force type
 * @param {Array<EmitterTrack>} tracks - Emitter tracks in this element
 * @returns {string} - Specific ground force type
 */
function determineGroundForceType(tracks) {
  // Check for artillery-related radars
  const hasCounterBattery = tracks.some(t => 
    t.classification === 'counter-battery-radar'
  );
  
  const hasTargeting = tracks.some(t => 
    t.classification === 'targeting-radar'
  );
  
  const hasGroundSurveillance = tracks.some(t => 
    t.classification === 'ground-surveillance-radar' ||
    t.classification === 'battlefield-surveillance-radar'
  );
  
  if (hasCounterBattery) {
    return 'artillery-unit';
  } else if (hasTargeting) {
    return 'mechanized-unit';
  } else if (hasGroundSurveillance) {
    return 'reconnaissance-unit';
  }
  
  return 'ground-unit';
}

/**
 * Determine the function of a specific emitter in a military element
 * @param {EmitterTrack} track - Emitter track
 * @param {string} elementType - Type of military element
 * @returns {string} - Function of this emitter in the element
 */
function determineFunctionInElement(track, elementType) {
  // Air defense functions
  if (elementType.includes('air-defense') || elementType === 'SAM-system') {
    if (track.classification === 'early-warning-radar' || 
        track.classification === 'long-range-surveillance') {
      return 'search-acquisition';
    } else if (track.classification === 'fire-control-radar') {
      return 'target-tracking';
    } else if (track.classification && track.classification.includes('communication')) {
      return 'command-control';
    }
  }
  
  // Artillery functions
  else if (elementType === 'artillery-unit') {
    if (track.classification === 'counter-battery-radar') {
      return 'counter-battery';
    } else if (track.classification === 'targeting-radar') {
      return 'fire-direction';
    } else if (track.classification && track.classification.includes('communication')) {
      return 'command-control';
    }
  }
  
  // Reconnaissance functions
  else if (elementType === 'reconnaissance-unit') {
    if (track.classification === 'ground-surveillance-radar' || 
        track.classification === 'battlefield-surveillance-radar') {
      return 'surveillance';
    } else if (track.classification && track.classification.includes('communication')) {
      return 'reporting';
    }
  }
  
  // Communications element functions
  else if (elementType === 'communications-node') {
    if (track.classification === 'vhf-tactical-communications') {
      return 'tactical-net';
    } else if (track.classification === 'uhf-digital-communications') {
      return 'data-link';
    } else if (track.classification === 'hf-communications') {
      return 'long-range-comms';
    }
  }
  
  // Default function based on classification
  return classificationToFunction(track.classification);
}

/**
 * Map classification to generic function
 * @param {string} classification - Emitter classification
 * @returns {string} - Generic function
 */
function classificationToFunction(classification) {
  if (!classification) return 'unknown';
  
  if (classification.includes('surveillance')) return 'surveillance';
  if (classification.includes('fire-control')) return 'targeting';
  if (classification.includes('early-warning')) return 'early-warning';
  if (classification.includes('targeting')) return 'targeting';
  if (classification.includes('communications')) return 'communication';
  if (classification.includes('counter-battery')) return 'counter-battery';
  
  return 'unknown';
}

/**
 * Calculate the center location for a cluster of emitters
 * @param {Array<EmitterTrack>} tracks - Emitter tracks in cluster
 * @returns {Object} - Center location {lat, lng}
 */
function calculateClusterCenter(tracks) {
  // Get all locations
  const locations = tracks
    .map(track => track.getMostRecentLocation()?.location)
    .filter(loc => loc && loc.lat && loc.lng);
  
  if (locations.length === 0) {
    return null;
  }
  
  // Calculate average
  const sumLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
  const sumLng = locations.reduce((sum, loc) => sum + loc.lng, 0);
  
  return {
    lat: sumLat / locations.length,
    lng: sumLng / locations.length
  };
}

/**
 * Calculate confidence level for a military element
 * @param {Array<EmitterTrack>} tracks - Emitter tracks in element
 * @returns {string} - Confidence level (high, medium, low)
 */
function calculateElementConfidence(tracks) {
  // Count confidence levels
  const confidenceCount = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  tracks.forEach(track => {
    if (track.confidenceLevel) {
      confidenceCount[track.confidenceLevel] = 
        (confidenceCount[track.confidenceLevel] || 0) + 1;
    }
  });
  
  // Calculate overall confidence
  const totalTracks = tracks.length;
  
  if (confidenceCount.high > totalTracks / 2) {
    return 'high';
  } else if (confidenceCount.high + confidenceCount.medium > totalTracks / 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate descriptive notes for a military element
 * @param {Array<EmitterTrack>} tracks - Emitter tracks in element
 * @param {Object} elementType - Element type information
 * @returns {string} - Descriptive notes
 */
function generateElementNotes(tracks, elementType) {
  // Get platform assessments
  const platforms = tracks
    .filter(t => t.platformAssessment && t.platformAssessment.model)
    .map(t => t.platformAssessment.model);
  
  // Unique platform models
  const uniquePlatforms = [...new Set(platforms)];
  
  // Mobility assessment from track velocity info
  const mobilityInfo = tracks
    .filter(t => t.velocityInfo && t.velocityInfo.mobilityType)
    .map(t => t.velocityInfo.mobilityType);
  
  const uniqueMobility = [...new Set(mobilityInfo)];
  
  // Build notes
  let notes = `${elementType.type.replace(/-/g, ' ')} `;
  
  if (uniquePlatforms.length > 0) {
    notes += `with ${uniquePlatforms.join(', ')} `;
  }
  
  if (uniqueMobility.length > 0) {
    // Take the most mobile assessment
    const mobilityOrder = [
      'stationary', 'quasi-stationary', 'slow-moving', 
      'stop-and-go', 'mobile', 'highly-mobile'
    ];
    
    const highestMobility = uniqueMobility.sort((a, b) => 
      mobilityOrder.indexOf(b) - mobilityOrder.indexOf(a)
    )[0];
    
    notes += `(${highestMobility})`;
  }
  
  return notes;
}