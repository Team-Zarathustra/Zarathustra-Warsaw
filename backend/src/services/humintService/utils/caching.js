// utils/caching.js
import { logger } from '../../../api/logger/logger.js';
import crypto from 'crypto';

/**
 * Safely converts objects to strings for cache keys, handling circular references
 * @param {any} obj - The object to stringify
 * @returns {string} - String representation of the object
 */
function safeStringify(obj) {
  if (obj === null || obj === undefined) return 'null';
  
  if (typeof obj !== 'object') return String(obj);
  
  // Handle Date objects
  if (obj instanceof Date) return obj.toISOString();
  
  try {
    // Try regular JSON stringify first
    return JSON.stringify(obj);
  } catch (error) {
    // If circular reference, create a simplified version
    if (error.message.includes('circular') || error.message.includes('cyclic')) {
      // For arrays, stringify elements individually
      if (Array.isArray(obj)) {
        return `[${obj.map(item => safeStringify(item)).join(',')}]`;
      }
      
      // For objects, stringify properties individually
      const props = {};
      for (const key of Object.keys(obj)) {
        // Skip functions and properties that could cause circular references
        if (typeof obj[key] !== 'function' && 
            key !== '_idleNext' && 
            key !== '_idlePrev' &&
            key !== 'domain') {
          try {
            props[key] = safeStringify(obj[key]);
          } catch (e) {
            props[key] = `[${typeof obj[key]}]`;
          }
        }
      }
      return JSON.stringify(props);
    }
    
    // For other errors, return the object's constructor name
    return `[Object ${obj.constructor ? obj.constructor.name : 'Object'}]`;
  }
}

/**
 * Generates a cache key for extraction requests
 * @param {string} content - The content to be extracted (or a subset for efficiency)
 * @param {string} extractionType - The type of extraction being performed
 * @param {Object} options - Additional options that affect the extraction
 * @returns {string} - A unique cache key
 */
export function generateCacheKey(content, extractionType, options = {}) {
  // Create a content hash from the first portion of content to be more efficient
  const contentSample = content.substring(0, 5000);
  const contentHash = crypto
    .createHash('md5')
    .update(contentSample)
    .digest('hex');
  
  // Create a string representation of options that affect extraction
  const optionsStr = Object.entries(options)
    .filter(([key]) => key !== 'domain') // Domain is handled separately
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      return `${key}:${safeStringify(value)}`;
    })
    .join('|');
  
  // Create the full cache key
  const cacheKey = `ai_extract_${contentHash}_${extractionType}${optionsStr ? `_${optionsStr}` : ''}`;
  
  logger.debug('Generated cache key', { 
    extractionType,
    cacheKey,
    contentHashLength: contentHash.length,
    hasOptions: !!optionsStr
  });
  
  return cacheKey;
}

/**
 * Attempts to retrieve a cached extraction result
 * @param {Object} cache - The cache service
 * @param {string} cacheKey - The cache key
 * @returns {Promise<Object|null>} - The cached result or null if not found
 */
export async function getCachedResult(cache, cacheKey) {
  if (!cache) {
    return null;
  }
  
  try {
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    return null;
  } catch (error) {
    logger.warn('Failed to retrieve from cache', { 
      error: error.message,
      cacheKey
    });
    return null;
  }
}

/**
 * Stores an extraction result in the cache
 * @param {Object} cache - The cache service
 * @param {string} cacheKey - The cache key
 * @param {Object} result - The result to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success indicator
 */
export async function setCacheResult(cache, cacheKey, result, ttl = 24 * 60 * 60) {
  if (!cache) {
    return false;
  }
  
  try {
    await cache.set(cacheKey, result, ttl);
    return true;
  } catch (error) {
    logger.warn('Failed to store in cache', { 
      error: error.message,
      cacheKey
    });
    return false;
  }
}