// components/military-intelligence/utils/geoUtils.ts

/**
 * Utilities for extracting and handling geospatial information from field reports
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoLocation {
  name?: string; // Make name optional to fix TypeScript error
  description?: string;
  coordinates?: Coordinates;
  type?: 'location' | 'observation' | 'movement';
  timestamp?: string;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Extracts coordinates from a text string
 * Handles various formats like:
 * - 49.98081, 36.25272
 * - grid coordinates 49.98081, 36.25272
 * - at coordinates (49.98081, 36.25272)
 * - etc.
 */
export const extractCoordinatesFromText = (text: string): Coordinates | null => {
  if (!text) return null;
  
  console.log(`[DEBUG] Extracting coordinates from text: "${text.substring(0, 100)}..."`);
  
  // Standard decimal format: 49.98081, 36.25272
  const standardPattern = /(\d+\.\d+),\s*(\d+\.\d+)/;
  
  // Look for full coordinates with comma separator
  const match = text.match(standardPattern);
  if (match && match.length >= 3) {
    const coords = {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2])
    };
    
    // Validate coordinates are in Ukraine region (rough bounds check)
    if (coords.latitude >= 44 && coords.latitude <= 53 && 
        coords.longitude >= 22 && coords.longitude <= 41) {
      console.log(`[DEBUG] Extracted valid Ukraine coordinates: ${coords.latitude}, ${coords.longitude}`);
      return coords;
    } else {
      console.log(`[DEBUG] Extracted coordinates outside Ukraine bounds: ${coords.latitude}, ${coords.longitude} - checking if digits were truncated`);
      
      // Check if latitude might be missing a leading digit (should be 4x.xxxx for Ukraine)
      if (coords.latitude < 10 && coords.longitude > 30 && coords.longitude < 41) {
        // This is likely a truncated coordinate - fix by adding leading "4"
        coords.latitude = 40 + coords.latitude;
        console.log(`[DEBUG] Fixed truncated latitude: ${coords.latitude}, ${coords.longitude}`);
        return coords;
      }
    }
  }
  
  // If we got here, no valid coordinates found
  return null;
};

/**
 * Extracts named locations from text with potential coordinates
 */
export const extractLocationsFromText = (text: string): GeoLocation[] => {
  if (!text) return [];
  
  const locations: GeoLocation[] = [];
  const locationPatterns = [
    // Location with coordinates: village of Mala Danylivka (10km north of Kharkiv) (49.123, 36.456)
    /(\w+\s+(?:of|near|at)\s+[\w\s]+)\s*(?:\(.*?\))?\s*\(?\s*(\d+\.\d+),\s*(\d+\.\d+)\)?/gi,
    
    // Named location with coordinates: Mala Danylivka (49.123, 36.456)
    /([\w\s-]+)\s*\(?\s*(\d+\.\d+),\s*(\d+\.\d+)\)?/gi,
    
    // Location mentioned with grid coordinates
    /([\w\s-]+)\s*grid\s+coordinates\s+(\d+\.\d+),\s*(\d+\.\d+)/gi
  ];
  
  for (const pattern of locationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      locations.push({
        name: match[1].trim(),
        coordinates: {
          latitude: parseFloat(match[2]),
          longitude: parseFloat(match[3])
        },
        type: 'location'
      });
    }
  }
  
  // If no locations with embedded coordinates were found,
  // try to extract any coordinates and create generic locations
  if (locations.length === 0) {
    const lines = text.split('\n');
    for (const line of lines) {
      const coords = extractCoordinatesFromText(line);
      if (coords) {
        // Try to extract a location name from the line
        let name = 'Unknown Location';
        
        // Look for place names before coordinates
        const placeName = line.split(/\d+\.\d+/)[0].trim();
        if (placeName && placeName.length > 3 && placeName.length < 50) {
          // Extract the last 2-3 words as likely location name
          const words = placeName.split(/\s+/);
          if (words.length > 2) {
            name = words.slice(-3).join(' ');
          } else {
            name = placeName;
          }
        }
        
        locations.push({
          name,
          description: line,
          coordinates: coords,
          type: 'location'
        });
      }
    }
  }
  
  return locations;
};

/**
 * Extracts troop/equipment movements with coordinates
 */
export const extractMovementsFromText = (text: string): GeoLocation[] => {
  if (!text) return [];
  
  const movements: GeoLocation[] = [];
  const movementPatterns = [
    // Movement pattern: "moving/advancing/retreating toward/from [location] (coords)"
    /(moving|advancing|retreating|withdrawing)(?:\s+\w+)?\s+(?:to|from|toward|towards|north|south|east|west|northeast|northwest|southeast|southwest)(?:\s+\w+)?\s+([\w\s]+)(?:.*?coordinates\s+)?(\d+\.\d+),\s*(\d+\.\d+)/gi,
    
    // Convoy/troops moving: "convoy of X observed at (coords) moving direction"
    /(convoy|troops|forces|tanks|vehicles)(?:.*?)(?:coordinates\s+)?(\d+\.\d+),\s*(\d+\.\d+)(?:.*?)(moving|advancing|heading|proceeding)/gi
  ];
  
  for (const pattern of movementPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Adapt based on which pattern matched
      let name, description, lat, lng;
      
      if (match[0].includes('coordinates')) {
        name = match[1] || 'Movement';
        description = match[0];
        // Extract coordinates from the full match
        const coords = extractCoordinatesFromText(match[0]);
        if (coords) {
          lat = coords.latitude;
          lng = coords.longitude;
        }
      } else if (match.length >= 5) {
        name = `${match[1]} near ${match[2]}`;
        description = match[0];
        lat = parseFloat(match[3]);
        lng = parseFloat(match[4]);
      } else if (match.length >= 4) {
        name = `${match[1]} Movement`;
        description = match[0];
        lat = parseFloat(match[2]);
        lng = parseFloat(match[3]);
      }
      
      if (lat && lng) {
        movements.push({
          name,
          description,
          coordinates: { latitude: lat, longitude: lng },
          type: 'movement'
        });
      }
    }
  }
  
  return movements;
};

/**
 * Extracts observations (sightings, enemy activity) with coordinates
 */
export const extractObservationsFromText = (text: string): GeoLocation[] => {
  if (!text) return [];
  
  const observations: GeoLocation[] = [];
  const observationPatterns = [
    // Observation pattern: "observed X at/near (coords)"
    /(observed|spotted|sighted|detected)(?:\s+[\w\s]+)(?:.*?)(?:coordinates\s+)?(\d+\.\d+),\s*(\d+\.\d+)/gi,
    
    // Activity pattern: "activity at/near (coords)"
    /(activity|presence|position|equipment|deployment)(?:.*?)(?:coordinates\s+)?(\d+\.\d+),\s*(\d+\.\d+)/gi
  ];
  
  for (const pattern of observationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let lat, lng;
      
      // Extract coordinates from the full match if it contains "coordinates"
      if (match[0].includes('coordinates')) {
        const coords = extractCoordinatesFromText(match[0]);
        if (coords) {
          lat = coords.latitude;
          lng = coords.longitude;
        }
      } else if (match.length >= 4) {
        lat = parseFloat(match[2]);
        lng = parseFloat(match[3]);
      }
      
      if (lat && lng) {
        observations.push({
          name: `${match[1].charAt(0).toUpperCase() + match[1].slice(1)}`,
          description: match[0],
          coordinates: { latitude: lat, longitude: lng },
          type: 'observation'
        });
      }
    }
  }
  
  return observations;
};

/**
 * Process a complete field report and extract all geospatial information
 * @returns An object containing locations, movements, and observations
 */
export const processReportForGeospatialData = (reportText: string) => {
  const locations = extractLocationsFromText(reportText);
  const movements = extractMovementsFromText(reportText);
  const observations = extractObservationsFromText(reportText);
  
  console.log('[DEBUG] Final processed geo data:', {
    locations: locations.map(l => `${l.name}: ${l.coordinates?.latitude},${l.coordinates?.longitude}`),
    movements: movements.map(m => `${m.name}: ${m.coordinates?.latitude},${m.coordinates?.longitude}`),
    observations: observations.map(o => `${o.name}: ${o.coordinates?.latitude},${o.coordinates?.longitude}`)
  });
  
  return {
    locations,
    movements,
    observations
  };
};