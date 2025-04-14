import { logger } from '../../../api/logger/logger.js';
import { generateCacheKey, getCachedResult, setCacheResult } from '../utils/caching.js';
import { extractIntelligenceWithAI } from './targetedIntelligence.js';

/**s
 * Batch process multiple intelligence extraction requests
 * @param {string} reportText - Raw text of the field report
 * @param {Array<string>} intelligenceTypes - Types of intelligence to extract
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Combined extraction results
 */
export async function batchExtractWithAI(reportText, intelligenceTypes, options = {}) {
  try {
    const { cache, concurrency = 2, language = 'en', reportId = '' } = options;
    
    logger.info('Starting batch AI intelligence extraction', { 
      types: intelligenceTypes,
      contentLength: reportText.length,
      concurrency,
      reportId
    });
    
    // Generate cache key if caching is enabled
    let cacheKey = null;
    if (cache) {
      cacheKey = generateCacheKey(
        reportText.substring(0, 5000), // Hash first 5000 chars for consistency
        intelligenceTypes.sort().join('_'),
        { language, reportId }
      );
      
      // Check cache first
      const cachedResult = await getCachedResult(cache, cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    // Process extractions in batches based on concurrency
    const batchResults = {};
    
    // Group extraction types into batches
    const batches = [];
    for (let i = 0; i < intelligenceTypes.length; i += concurrency) {
      batches.push(intelligenceTypes.slice(i, i + concurrency));
    }
    
    // Process each batch sequentially
    for (const batch of batches) {
      // Process each extraction type in this batch concurrently
      const batchPromises = batch.map(type => 
        extractIntelligenceWithAI(reportText, type, { ...options, language })
      );
      
      // Wait for all extractions in this batch to complete
      const batchResponses = await Promise.allSettled(batchPromises);
      
      // Process results from this batch
      batchResponses.forEach((response, index) => {
        const intelligenceType = batch[index];
        
        if (response.status === 'fulfilled') {
          batchResults[intelligenceType] = response.value;
        } else {
          logger.error('Batch extraction item failed', { 
            intelligenceType,
            error: response.reason?.message || 'Unknown error',
            reportId
          });
          
          batchResults[intelligenceType] = { 
            data: null, 
            confidence: 'fallback',
            error: response.reason?.message || 'Unknown error',
            intelligenceType
          };
        }
      });
      
      // Short delay between batches to avoid rate limits
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Cache the combined results if caching is enabled
    if (cache && cacheKey) {
      await setCacheResult(cache, cacheKey, batchResults, 24 * 60 * 60);
    }
    
    return batchResults;
  } catch (error) {
    logger.error('Batch intelligence extraction failed', { 
      error: error.message,
      reportId: options.reportId || 'unknown'
    });
    
    // Return empty results for all requested types
    return intelligenceTypes.reduce((acc, type) => {
      acc[type] = { 
        data: null, 
        confidence: 'fallback', 
        error: error.message,
        intelligenceType: type
      };
      return acc;
    }, {});
  }
}

/**
 * Optimized batch extraction for related intelligence types
 * @param {string} reportText - Raw text of the field report
 * @param {Array<string>} groupedTypes - Related intelligence types
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Grouped extraction results
 */
export async function extractRelatedGroup(reportText, groupedTypes, options = {}) {
  try {
    // Define specific groups for optimized extraction
    const group = groupedTypes.sort().join('_');
    logger.info(`Extracting related intelligence group: ${group}`, {
      types: groupedTypes,
      contentLength: reportText.length,
      reportId: options.reportId || 'unknown'
    });
    
    // For the hackathon, we'll implement a simple version that extracts one 
    // comprehensive intelligence type and then post-processes it into the requested types
    
    // Determine a primary intelligence type that can cover the group
    let primaryType;
    const situationalTypes = new Set(['tacticalObservations', 'threats', 'geospatialInformation']);
    const humanitarianTypes = new Set(['civilianStatus', 'resources', 'medicalSituation']);
    const technicalTypes = new Set(['communicationsElectronic', 'weaponSystems', 'fortifications']);
    
    // Count how many types from each group are requested
    let situationalCount = groupedTypes.filter(type => situationalTypes.has(type)).length;
    let humanitarianCount = groupedTypes.filter(type => humanitarianTypes.has(type)).length;
    let technicalCount = groupedTypes.filter(type => technicalTypes.has(type)).length;
    
    // Select the primary type based on the group with the most requested types
    if (situationalCount >= humanitarianCount && situationalCount >= technicalCount) {
      primaryType = 'tacticalObservations'; // This covers most situational intelligence
    } else if (humanitarianCount >= technicalCount) {
      primaryType = 'civilianStatus'; // This covers most humanitarian intelligence
    } else {
      primaryType = 'communicationsElectronic'; // This covers most technical intelligence
    }
    
    // If we implement a specialized extraction for this group in the future,
    // we would call a custom extraction function here.
    // For now, just fall back to standard batch extraction
    
    return batchExtractWithAI(reportText, groupedTypes, options);
  } catch (error) {
    logger.error('Related group extraction failed', { 
      error: error.message,
      reportId: options.reportId || 'unknown' 
    });
    return batchExtractWithAI(reportText, groupedTypes, options);
  }
}