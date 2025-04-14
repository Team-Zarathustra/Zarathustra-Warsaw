// services/fusionService/utils/geoUtils.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Utility functions for geospatial operations
 */

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
 * Check if a point is inside a bounding box
 * @param {Array} point - [lat, lng] coordinates
 * @param {Object} bounds - {north, south, east, west} boundaries
 * @returns {boolean} - True if point is inside bounds
 */
export function isPointInBounds(point, bounds) {
  if (!point || point.length < 2) return false;
  if (!bounds) return false;
  
  const [lat, lng] = point;
  const { north, south, east, west } = bounds;
  
  return lat <= north && lat >= south && lng <= east && lng >= west;
}

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Bearing in degrees (0-360)
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const λ1 = lng1 * Math.PI/180;
  const λ2 = lng2 * Math.PI/180;

  const y = Math.sin(λ2-λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2-λ1);
  
  const θ = Math.atan2(y, x);
  const bearing = (θ*180/Math.PI + 360) % 360; // in degrees
  
  return bearing;
}

/**
 * Calculate a destination point given distance and bearing from start
 * @param {number} lat - Starting latitude
 * @param {number} lng - Starting longitude
 * @param {number} distance - Distance in meters
 * @param {number} bearing - Bearing in degrees
 * @returns {Array} - [lat, lng] of destination point
 */
export function calculateDestination(lat, lng, distance, bearing) {
  const R = 6371e3; // Earth radius in meters
  const δ = distance / R; // Angular distance in radians
  const θ = bearing * Math.PI/180; // Bearing in radians
  
  const φ1 = lat * Math.PI/180;
  const λ1 = lng * Math.PI/180;
  
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );
  
  // Convert back to degrees
  const latDest = φ2 * 180/Math.PI;
  const lngDest = λ2 * 180/Math.PI;
  
  return [latDest, lngDest];
}

/**
 * Create a bounding box around a center point
 * @param {Array} center - [lat, lng] of center point
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} - {north, south, east, west} boundaries
 */
export function createBoundingBox(center, radiusKm) {
  // Approximate degrees latitude per km
  const latKm = 1 / 110.574;
  
  // Approximate degrees longitude per km at this latitude
  const lngKm = 1 / (111.32 * Math.cos(center[0] * Math.PI/180));
  
  // Calculate boundaries
  const latOffset = radiusKm * latKm;
  const lngOffset = radiusKm * lngKm;
  
  return {
    north: center[0] + latOffset,
    south: center[0] - latOffset,
    east: center[1] + lngOffset,
    west: center[1] - lngOffset
  };
}

/**
 * Parse a location string into coordinates
 * @param {string} locationStr - Location string (comma-separated coordinates)
 * @returns {Array|null} - [lat, lng] or null if invalid
 */
export function parseCoordinates(locationStr) {
  if (!locationStr) return null;
  
  try {
    // Check if it's already an array
    if (Array.isArray(locationStr)) {
      if (locationStr.length >= 2 && 
          !isNaN(parseFloat(locationStr[0])) && 
          !isNaN(parseFloat(locationStr[1]))) {
        return [parseFloat(locationStr[0]), parseFloat(locationStr[1])];
      }
      return null;
    }
    
    // Try to parse string format
    const parts = locationStr.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    
    return null;
  } catch (error) {
    logger.warn('Error parsing coordinates', { locationStr, error: error.message });
    return null;
  }
}