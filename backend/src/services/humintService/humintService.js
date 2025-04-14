import { logger } from '../../api/logger/logger.js';
import humintService from '../humintService/index.js';
import { ExtractionError } from './utils/errorHandling.js';
import { generateCacheKey, getCachedResult, setCacheResult } from './utils/caching.js';
import { cache } from '../cacheService.js'; // Updated to use the standard cache implementation

/**
 * Process a single field report for intelligence extraction
 * @returns {Promise<Object>} - Extracted intelligence
 */

export const processFieldReport = async (reportText, reportMetadata = {}, options = {}) => {
  try {
    logger.info('Processing field report', {
      reportId: reportMetadata.reportId || 'unknown',
      reportType: reportMetadata.type || 'standard',
      reportTextLength: reportText.length,
      extractionOptions: options
    });
    
    // Generate cache key for this report
    const cacheKey = generateCacheKey(
      reportText.substring(0, 5000), // First 5000 chars for consistent hashing
      'field-report-analysis',
      { reportId: reportMetadata.reportId, reportType: reportMetadata.type }
    );
    
    // Check cache first
    const cachedResult = await getCachedResult(cache, cacheKey);
    if (cachedResult) {
      logger.info('Using cached field report analysis', { 
        reportId: reportMetadata.reportId,
        cacheKey
      });
      return cachedResult;
    }
    
    // Determine extraction types based on options or use defaults
    const extractionTypes = options.extractionTypes || [
      'tacticalObservations',
      'threats',
      'resources', 
      'civilianStatus',
      'geospatialInformation'
    ];
    
    // Get the raw extraction results
    const extractionResults = await humintService.extractMultipleTypes(
      reportText, 
      extractionTypes,
      {
        reportId: reportMetadata.reportId,
        reportMetadata,
        language: reportMetadata.language || 'en',
        concurrency: 2,
        optimizeGroups: true
      }
    );
    
    // Create standardized format for analysis results
    const analysisResults = {
      reportId: reportMetadata.reportId || 'unknown',
      intelligence: {},
      timestamp: new Date().toISOString(),
      language: reportMetadata.language || 'en',
      qualityScores: {}
    };
    
    // Map each extraction type to the standardized format
    Object.keys(extractionResults).forEach(type => {
      const result = extractionResults[type];
      if (!result || !result.data) return;
      
      // Build intelligence structure based on type
      if (type === 'tacticalObservations') {
        analysisResults.intelligence.enemyForces = [];
        analysisResults.intelligence.friendlyForces = [];
        
        // Process tactical observations into enemy/friendly forces
        if (result.data.observations) {
          result.data.observations.forEach(obs => {
            if (obs.entities?.force === 'enemy') {
              analysisResults.intelligence.enemyForces.push({
                type: obs.entities.equipment || 'Unknown',
                size: obs.entities.size || 'Unknown',
                location: obs.location?.name || 'Unknown',
                activity: obs.text,
                coordinates: obs.location?.coordinates || null,
                time: obs.time || null,
                confidence: obs.confidence || result.confidence
              });
            } else if (obs.entities?.force === 'friendly') {
              analysisResults.intelligence.friendlyForces.push({
                type: obs.entities.equipment || 'Unknown',
                activity: obs.text,
                confidence: obs.confidence || result.confidence
              });
            }
          });
        }
        
        // Add to quality scores
        analysisResults.qualityScores.tacticalSituation = result.confidence;
      }
      
      else if (type === 'threats') {
        analysisResults.intelligence.threats = result.data.identified || [];
        analysisResults.qualityScores.threats = result.confidence;
      }
      
      else if (type === 'geospatialInformation') {
        analysisResults.intelligence.locations = result.data.locations || [];
        analysisResults.intelligence.controlZones = result.data.controlZones || [];
        analysisResults.qualityScores.geospatialInformation = result.confidence;
      }
      
      else if (type === 'civilianStatus') {
        analysisResults.intelligence.civilianSituation = {
          populations: result.data.populations || [],
          infrastructure: result.data.infrastructure || [],
          sentiment: result.data.sentiment || null,
          confidence: result.confidence
        };
        analysisResults.qualityScores.civilianSituation = result.confidence;
      }
      
      else if (type === 'resources') {
        analysisResults.intelligence.resourceStatus = {
          personnel: {
            status: null,
            casualties: null,
            confidence: result.confidence
          },
          equipment: result.data.status?.filter(s => s.category === 'equipment') || [],
          supplies: {
            status: result.data.status?.find(s => s.category === 'supplies')?.condition || null,
            shortages: result.data.shortages || [],
            confidence: result.confidence
          }
        };
        analysisResults.qualityScores.resourceStatus = result.confidence;
      }
      
      else if (type === 'reliability') {
        analysisResults.intelligence.reliabilityAssessment = result.data.assessment || {
          overallReliability: 'medium',
          factors: {},
          firsthandObservations: [],
          secondhandInformation: [],
          uncertainInformation: []
        };
        analysisResults.qualityScores.reliability = result.confidence;
      }
      
      else if (type === 'predictions') {
        analysisResults.intelligence.predictions = result.data || [];
        analysisResults.qualityScores.predictions = result.confidence;
      }
    });
    
    // Calculate confidence scores for the report if not already present
    if (!analysisResults.qualityScores.overall) {
      const scores = Object.values(analysisResults.qualityScores).filter(score => score !== 'overall');
      
      if (scores.includes('high') && scores.filter(s => s === 'high').length > scores.length / 2) {
        analysisResults.qualityScores.overall = 'high';
      } else if (!scores.includes('fallback') && scores.filter(s => s === 'low').length < scores.length / 2) {
        analysisResults.qualityScores.overall = 'medium';
      } else {
        analysisResults.qualityScores.overall = 'low';
      }
    }
    
    // Add a unique ID for the analysis if not present
    if (!analysisResults.analysisId) {
      analysisResults.analysisId = generateAnalysisId(reportMetadata);
    }
    
    // Cache the result
    await setCacheResult(cache, cacheKey, analysisResults, 24 * 60 * 60);
    
    logger.info('Field report processing complete', { 
      reportId: reportMetadata.reportId,
      analysisId: analysisResults.analysisId,
      extractedEntities: countExtractedEntities(analysisResults)
    });
    
    return analysisResults;
  } catch (error) {
    logger.error('Field report processing failed', { 
      error: error.message,
      reportId: reportMetadata.reportId,
      stack: error.stack
    });
    
    throw new ExtractionError(`Failed to process field report: ${error.message}`);
  }
};

/**
 * Process multiple field reports and validate information across them
 * @param {Array<Object>} reports - Array of report objects with text and metadata
 * @param {Object} validationOptions - Options for validation process
 * @returns {Promise<Object>} - Validation results with corroborated claims
 */
export const validateMultipleReports = async (reports, validationOptions = {}) => {
  try {
    logger.info('Starting multi-report validation', {
      reportCount: reports.length,
      validationOptions
    });
    
    // Process each report individually first
    const analysisPromises = reports.map(report => 
      processFieldReport(
        report.reportText, 
        report.reportMetadata || {}, 
        report.extractionOptions || {}
      )
    );
    
    // Wait for all reports to be processed
    const analysisResults = await Promise.all(analysisPromises);
    
    // Perform cross-validation across all reports
    const validatedResults = crossValidateReports(analysisResults, validationOptions);
    
    logger.info('Multi-report validation complete', {
      reportCount: reports.length,
      validatedClaimsCount: validatedResults.validatedClaims.length,
      contradictionsFound: validatedResults.contradictions.length
    });
    
    return validatedResults;
  } catch (error) {
    logger.error('Multi-report validation failed', {
      error: error.message,
      stack: error.stack,
      reportCount: reports.length
    });
    
    throw new Error(`Failed to validate multiple reports: ${error.message}`);
  }
};

/**
 * Generate formatted military report in standard format
 * @param {string} analysisId - ID of the analysis to format
 * @param {string} format - Desired output format (INTREP, INTSUM, etc.)
 * @param {Object} options - Formatting options
 * @returns {Promise<Object>} - Formatted military report
 */
export const generateMilitaryFormatReport = async (analysisId, format, options = {}) => {
  // This is a placeholder for the format conversion functionality
  // In a real implementation, you would:
  // 1. Retrieve the analysis by ID from database or cache
  // 2. Apply the appropriate formatting template
  // 3. Return the formatted document
  
  return {
    format,
    analysisId,
    title: `${format} Report`,
    content: "Placeholder for formatted report",
    timestamp: new Date().toISOString()
  };
};

/**
 * Cross-validate multiple reports to find corroborated information
 * @param {Array<Object>} analysisResults - Array of individual report analyses
 * @param {Object} validationOptions - Options for the validation process
 * @returns {Object} - Validation results with corroborated and contradictory claims
 */
function crossValidateReports(analysisResults, validationOptions = {}) {
  // Initialize results structure
  const validationResults = {
    validatedClaims: [],
    contradictions: [],
    unmatchedClaims: [],
    validationTimestamp: new Date().toISOString(),
    meta: {
      reportCount: analysisResults.length,
      options: validationOptions
    }
  };
  
  // Extract all claims from all reports
  const allClaims = [];
  
  analysisResults.forEach((result, reportIndex) => {
    const reportId = result.reportId || `report-${reportIndex}`;
    
    // Extract enemy forces as claims
    if (result.intelligence?.enemyForces) {
      result.intelligence.enemyForces.forEach(force => {
        allClaims.push({
          type: 'force',
          subtype: 'enemy',
          text: force.activity || `${force.type} at ${force.location}`,
          location: {
            name: force.location,
            coordinates: force.coordinates
          },
          time: force.time,
          confidence: force.confidence || 'medium',
          reportIndex,
          reportId
        });
      });
    }
    
    // Extract threats as claims
    if (result.intelligence?.threats) {
      result.intelligence.threats.forEach(threat => {
        allClaims.push({
          type: 'threat',
          subtype: threat.type || 'general',
          text: threat.description,
          location: threat.location,
          time: threat.time,
          confidence: threat.confidence || 'medium',
          reportIndex,
          reportId
        });
      });
    }
    
    // Extract locations as claims
    if (result.intelligence?.locations) {
      result.intelligence.locations.forEach(loc => {
        allClaims.push({
          type: 'location',
          subtype: loc.type || 'position',
          text: loc.description || loc.name,
          location: {
            name: loc.name,
            coordinates: loc.coordinates
          },
          time: loc.timeObserved,
          confidence: loc.confidence || 'medium',
          reportIndex,
          reportId
        });
      });
    }
    
    // Extract civilian situations as claims
    if (result.intelligence?.civilianSituation?.populations) {
      result.intelligence.civilianSituation.populations.forEach(pop => {
        allClaims.push({
          type: 'civilian',
          subtype: 'population',
          text: pop.description,
          location: {
            name: pop.location
          },
          confidence: pop.confidence || result.intelligence.civilianSituation.confidence || 'medium',
          reportIndex,
          reportId
        });
      });
    }
  });
  
  // Find corroborated claims (simplified algorithm for demonstration)
  const processedClaimIndices = new Set();
  
  for (let i = 0; i < allClaims.length; i++) {
    if (processedClaimIndices.has(i)) continue;
    
    const claim = allClaims[i];
    const corroborations = [];
    const contradictions = [];
    
    // Compare with all other claims
    for (let j = 0; j < allClaims.length; j++) {
      if (i === j || processedClaimIndices.has(j)) continue;
      
      const otherClaim = allClaims[j];
      
      // Check if claims are related (same type and similar content)
      if (claim.type === otherClaim.type && areSimilarClaims(claim, otherClaim)) {
        // Check if they corroborate or contradict
        if (areContradictoryClaims(claim, otherClaim)) {
          contradictions.push(j);
        } else {
          corroborations.push(j);
          processedClaimIndices.add(j); // Mark as processed
        }
      }
    }
    
    // If claim has corroboration, add it to validated claims
    if (corroborations.length > 0) {
      const corroboratedClaim = {
        primaryClaim: claim,
        corroboratingClaims: corroborations.map(idx => allClaims[idx]),
        contradictingClaims: contradictions.map(idx => allClaims[idx]),
        corroborationScore: calculateCorroborationScore(
          [claim, ...corroborations.map(idx => allClaims[idx])],
          contradictions.map(idx => allClaims[idx])
        ),
        validatedTimestamp: new Date().toISOString()
      };
      
      validationResults.validatedClaims.push(corroboratedClaim);
      processedClaimIndices.add(i); // Mark primary claim as processed
    }
  }
  
  // Handle contradictions between validated claims
  findContradictionsBetweenValidatedClaims(validationResults);
  
  // Collect unmatched claims
  for (let i = 0; i < allClaims.length; i++) {
    if (!processedClaimIndices.has(i)) {
      validationResults.unmatchedClaims.push(allClaims[i]);
    }
  }
  
  return validationResults;
}

/**
 * Determines if two claims are similar enough to be compared
 * @param {Object} claim1 - First claim
 * @param {Object} claim2 - Second claim
 * @returns {boolean} - True if claims are similar
 */
function areSimilarClaims(claim1, claim2) {
  
  // Simple text similarity check
  const textSimilarity = calculateTextSimilarity(claim1.text, claim2.text);
  
  // Location proximity check if both have locations
  let locationMatch = false;
  if (claim1.location && claim2.location) {
    locationMatch = areLocationsNearby(claim1.location, claim2.location);
  }
  
  // Time proximity check if both have timestamps
  let timeMatch = false;
  if (claim1.time && claim2.time) {
    timeMatch = areTimesClose(claim1.time, claim2.time);
  }
  
  // Claims are similar if text is similar or both location and time match
  return textSimilarity > 0.6 || (locationMatch && timeMatch);
}

/**
 * Simple text similarity calculation
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score between 0-1
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  // Simple word overlap calculation
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  const uniqueWords1 = new Set(words1);
  const uniqueWords2 = new Set(words2);
  
  let matchCount = 0;
  for (const word of uniqueWords1) {
    if (uniqueWords2.has(word)) {
      matchCount++;
    }
  }
  
  const totalUniqueWords = new Set([...uniqueWords1, ...uniqueWords2]).size;
  return totalUniqueWords > 0 ? matchCount / totalUniqueWords : 0;
}

/**
 * Check if two locations are near each other
 * @param {Object} location1 - First location object
 * @param {Object} location2 - Second location object
 * @returns {boolean} - True if locations are nearby
 */
function areLocationsNearby(location1, location2) {
  // If locations have names, check if they match
  if (location1.name && location2.name) {
    return location1.name.toLowerCase() === location2.name.toLowerCase();
  }
  
  // If locations have coordinates, check distance
  if (location1.coordinates && location2.coordinates) {
    return calculateDistance(location1.coordinates, location2.coordinates) < 5; // Within 5km
  }
  
  return false;
}

/**
 * Calculate distance between two coordinates in kilometers
 * @param {Array|Object} coord1 - First coordinate [lat, lng] or {lat, lng}
 * @param {Array|Object} coord2 - Second coordinate [lat, lng] or {lat, lng}
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
  // Skip if coordinates aren't valid
  if (!coord1 || !coord2) return 999999; // Large number to ensure no match
  
  // Convert to standard format
  const lat1 = Array.isArray(coord1) ? coord1[0] : coord1.lat;
  const lng1 = Array.isArray(coord1) ? coord1[1] : coord1.lng;
  const lat2 = Array.isArray(coord2) ? coord2[0] : coord2.lat;
  const lng2 = Array.isArray(coord2) ? coord2[1] : coord2.lng;
  
  // Skip if any coordinate isn't a number
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    return 999999;
  }
  
  // Haversine formula for distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check if two timestamps are close to each other
 * @param {string|Date} time1 - First timestamp
 * @param {string|Date} time2 - Second timestamp
 * @returns {boolean} - True if times are within 6 hours
 */
function areTimesClose(time1, time2) {
  try {
    const date1 = time1 instanceof Date ? time1 : new Date(time1);
    const date2 = time2 instanceof Date ? time2 : new Date(time2);
    
    // Check if dates are valid
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return false;
    }
    
    // Calculate difference in hours
    const hoursDiff = Math.abs(date1 - date2) / (1000 * 60 * 60);
    
    // Consider times close if within 6 hours
    return hoursDiff <= 6;
  } catch (e) {
    return false;
  }
}

/**
 * Check if two claims contradict each other
 * @param {Object} claim1 - First claim
 * @param {Object} claim2 - Second claim
 * @returns {boolean} - True if claims contradict
 */
function areContradictoryClaims(claim1, claim2) {
  
  // Check for movement direction contradictions
  if (claim1.subtype === 'movement' && claim2.subtype === 'movement') {
    const directions1 = extractDirections(claim1.text);
    const directions2 = extractDirections(claim2.text);
    
    if (directions1.length > 0 && directions2.length > 0) {
      // Check if directions are opposite
      if ((directions1.includes('north') && directions2.includes('south')) ||
          (directions1.includes('south') && directions2.includes('north')) ||
          (directions1.includes('east') && directions2.includes('west')) ||
          (directions1.includes('west') && directions2.includes('east'))) {
        return true;
      }
    }
  }
  
  // Check for presence vs absence contradictions
  if (claim1.type === 'force' && claim2.type === 'force') {
    const hasNegation1 = /\b(no|not|none|absent|negative|cleared)\b/i.test(claim1.text);
    const hasNegation2 = /\b(no|not|none|absent|negative|cleared)\b/i.test(claim2.text);
    
    // If one is negative and one is positive, they contradict
    if (hasNegation1 !== hasNegation2) {
      return true;
    }
  }
  
  // Compare numbers for significant differences
  const numbers1 = extractNumbers(claim1.text);
  const numbers2 = extractNumbers(claim2.text);
  
  if (numbers1.length > 0 && numbers2.length > 0) {
    // Compare the first number in each claim (simplified approach)
    const diff = Math.abs(numbers1[0] - numbers2[0]);
    const max = Math.max(numbers1[0], numbers2[0]);
    
    // If difference is more than 50% of the larger number, consider it contradictory
    if (diff / max > 0.5 && max > 5) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract direction words from text
 * @param {string} text - Text to analyze
 * @returns {Array} - Array of direction words found
 */
function extractDirections(text) {
  if (!text) return [];
  const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
  return directions.filter(dir => text.toLowerCase().includes(dir));
}

/**
 * Extract numbers from text
 * @param {string} text - Text to analyze
 * @returns {Array} - Array of numbers found
 */
function extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/\b\d+\b/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Calculate corroboration score based on supporting and contradicting claims
 * @param {Array} supportingClaims - Array of claims that support each other
 * @param {Array} contradictingClaims - Array of claims that contradict
 * @returns {number} - Corroboration score between 0-1
 */
function calculateCorroborationScore(supportingClaims, contradictingClaims) {
  // Base calculation on number of supporting vs contradicting claims
  const supportCount = supportingClaims.length;
  const contradictCount = contradictingClaims.length;
  
  // Apply confidence weights
  let weightedSupportCount = 0;
  supportingClaims.forEach(claim => {
    // Convert confidence to weight
    const weight = claim.confidence === 'high' ? 1.0 : 
                  claim.confidence === 'medium' ? 0.7 : 0.4;
    weightedSupportCount += weight;
  });
  
  let weightedContradictCount = 0;
  contradictingClaims.forEach(claim => {
    // Convert confidence to weight
    const weight = claim.confidence === 'high' ? 1.0 : 
                  claim.confidence === 'medium' ? 0.7 : 0.4;
    weightedContradictCount += weight;
  });
  
  // Calculate score: ratio of weighted support to total weighted claims
  const totalWeight = weightedSupportCount + weightedContradictCount;
  
  if (totalWeight === 0) {
    return 0;
  }
  
  let score = weightedSupportCount / totalWeight;
  
  // Bonus for multiple high-confidence supporting claims
  const highConfidenceSupportCount = supportingClaims.filter(c => c.confidence === 'high').length;
  if (highConfidenceSupportCount >= 2) {
    score = Math.min(score + 0.1, 1.0);
  }
  
  return score;
}

/**
 * Find contradictions between already validated claims
 * @param {Object} validationResults - The validation results object to update
 */
function findContradictionsBetweenValidatedClaims(validationResults) {
  const { validatedClaims } = validationResults;
  
  for (let i = 0; i < validatedClaims.length; i++) {
    for (let j = i + 1; j < validatedClaims.length; j++) {
      const claim1 = validatedClaims[i].primaryClaim;
      const claim2 = validatedClaims[j].primaryClaim;
      
      // If claims are related and contradictory
      if (areSimilarClaims(claim1, claim2) && areContradictoryClaims(claim1, claim2)) {
        validationResults.contradictions.push({
          claim1: {
            claim: claim1,
            corroborationScore: validatedClaims[i].corroborationScore
          },
          claim2: {
            claim: claim2,
            corroborationScore: validatedClaims[j].corroborationScore
          },
          contradictionType: determineContradictionType(claim1, claim2),
          timeDetected: new Date().toISOString()
        });
      }
    }
  }
}

/**
 * Determine the type of contradiction between claims
 * @param {Object} claim1 - First claim
 * @param {Object} claim2 - Second claim
 * @returns {string} - Type of contradiction
 */
function determineContradictionType(claim1, claim2) {
  // Check movement direction contradictions
  if (claim1.subtype === 'movement' && claim2.subtype === 'movement') {
    return 'directional_conflict';
  }
  
  // Check presence vs absence contradictions
  if (claim1.type === 'force' && claim2.type === 'force') {
    return 'presence_conflict';
  }
  
  // Check numerical discrepancies
  if (extractNumbers(claim1.text).length > 0 && extractNumbers(claim2.text).length > 0) {
    return 'numerical_discrepancy';
  }
  
  // Default contradiction type
  return 'content_conflict';
}

/**
 * Generate a unique ID for the analysis based on report metadata
 * @param {Object} reportMetadata - Report metadata
 * @returns {string} - Unique ID
 */
function generateAnalysisId(reportMetadata) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  const reportId = reportMetadata.reportId || 'unknown';
  
  return `${reportId.substring(0, 8)}-${timestamp}-${random}`;
}

/**
 * Count the number of entities extracted in analysis results
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} - Count of different entity types
 */
function countExtractedEntities(analysisResults) {
  const counts = {
    total: 0
  };
  
  if (!analysisResults.intelligence) {
    return counts;
  }
  
  const intelligence = analysisResults.intelligence;
  
  // Count different entity types
  if (Array.isArray(intelligence.enemyForces)) {
    counts.enemyForces = intelligence.enemyForces.length;
    counts.total += intelligence.enemyForces.length;
  }
  
  if (Array.isArray(intelligence.friendlyForces)) {
    counts.friendlyForces = intelligence.friendlyForces.length;
    counts.total += intelligence.friendlyForces.length;
  }
  
  if (Array.isArray(intelligence.threats)) {
    counts.threats = intelligence.threats.length;
    counts.total += intelligence.threats.length;
  }
  
  if (Array.isArray(intelligence.locations)) {
    counts.locations = intelligence.locations.length;
    counts.total += intelligence.locations.length;
  }
  
  if (Array.isArray(intelligence.controlZones)) {
    counts.controlZones = intelligence.controlZones.length;
    counts.total += intelligence.controlZones.length;
  }
  
  if (intelligence.civilianSituation && Array.isArray(intelligence.civilianSituation.populations)) {
    counts.civilianPopulations = intelligence.civilianSituation.populations.length;
    counts.total += intelligence.civilianSituation.populations.length;
  }
  
  if (intelligence.civilianSituation && Array.isArray(intelligence.civilianSituation.infrastructure)) {
    counts.civilianInfrastructure = intelligence.civilianSituation.infrastructure.length;
    counts.total += intelligence.civilianSituation.infrastructure.length;
  }
  
  return counts;
}