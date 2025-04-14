import { logger } from '../../../api/logger/logger.js';
import { callClaudeAPI } from '../../claudeService.js';
import { createUnifiedMilitaryPrompt } from '../prompts/militaryPrompts.js';
import { extractJsonFromResponse } from '../parsers/jsonParser.js';
import { generateQualityScores, standardizeConfidence } from '../parsers/confidenceCalculator.js';
import { generateCacheKey, getCachedResult, setCacheResult } from '../utils/caching.js';
import { withRetry, ExtractionError } from '../utils/errorHandling.js';

// Get Claude model from environment variables or use a default
const EXTRACTION_MODEL = process.env.EXTRACTION_MODEL || 'claude-3-5-sonnet-20240620';

/**
 * Extract comprehensive military intelligence from a field report in a single API call
 * @param {string|Object} reportContent - Raw text or preprocessed content from field report
 * @param {string} reportId - The report's unique identifier
 * @param {string} context - Optional additional context 
 * @param {string} language - Report language ('en' or other)
 * @param {Object} options - Additional extraction options
 * @returns {Promise<Object>} - Comprehensive intelligence analysis
 */
export async function extractMilitaryInsights(reportContent, reportId, context = '', language = 'en', options = {}) {
  try {
    const { cache, model = EXTRACTION_MODEL } = options;
    
    // Generate cache key if caching is enabled
    let cacheKey = null;
    if (cache) {
      const contentSample = typeof reportContent === 'string' ? 
        reportContent.substring(0, 5000) : 
        JSON.stringify(reportContent).substring(0, 5000);
      
      cacheKey = generateCacheKey(contentSample, 'unified-military', { reportId, context, language });
      
      // Check cache first
      const cachedResult = await getCachedResult(cache, cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    logger.info('Extracting comprehensive military intelligence', { 
      language, 
      model,
      reportId,
      contentLength: typeof reportContent === 'string' ? reportContent.length : 
                    (reportContent.rawTextContent?.length || 0),
      hasContext: !!context
    });
    
    // Create unified prompt including context
    const prompt = createUnifiedMilitaryPrompt(reportContent, reportId, context, language);
    
    // Call Claude API with retry logic
    const claudeResponse = await withRetry(
      callClaudeAPI, 
      [prompt, model], 
      { context: 'unified military extraction API call', maxRetries: 2 }
    );
    
    // Parse and validate response
    const parsedData = extractJsonFromResponse(claudeResponse.content, {
      extractionType: 'unified-military',
      allowPartialRecovery: true
    });
    
    if (!parsedData) {
      throw new ExtractionError('Failed to parse JSON response from Claude');
    }
    
    // Transform the data into a standardized format
    const insights = parseUnifiedData(parsedData, reportId, language);
    
    logger.info('Successfully extracted unified military insights', {
      reportId,
      insightTypes: Object.keys(insights.intelligence)
    });
    
    // Cache the result if caching is enabled
    if (cache && cacheKey) {
      await setCacheResult(cache, cacheKey, insights, 24 * 60 * 60);
    }
    
    return insights;
  } catch (error) {
    logger.error('Failed to extract unified military insights', { 
      error: error.message, 
      stack: error.stack,
      reportId
    });
    
    // Return a minimal fallback response
    return createFallbackResponse(reportContent, reportId, language, context);
  }
}

/**
 * Parse and transform the raw extracted data into a standardized format
 * @param {Object} extractedData - Raw data extracted from Claude
 * @param {string} reportId - The report's unique identifier
 * @param {string} language - Report language
 * @returns {Object} - Structured insights
 */
function parseUnifiedData(extractedData, reportId, language) {
  const timestamp = new Date().toISOString();
  
  // Create a consistent structure
  const intelligence = {
    summary: extractedData.reportAnalysis?.summary || 'Intelligence analysis not available',
    reliability: extractedData.reportAnalysis?.reliability || 'medium',
    reportingQuality: extractedData.reportAnalysis?.reportingQuality || 'medium',
    
    // Tactical situation
    enemyForces: Array.isArray(extractedData.tacticalSituation?.enemyForces) ? 
      extractedData.tacticalSituation.enemyForces : [],
    
    friendlyForces: Array.isArray(extractedData.tacticalSituation?.friendlyForces) ? 
      extractedData.tacticalSituation.friendlyForces : [],
    
    // Threats
    threats: Array.isArray(extractedData.threats) ? 
      extractedData.threats : [],
    
    // Geospatial information
    locations: Array.isArray(extractedData.geospatialInformation?.locations) ? 
      extractedData.geospatialInformation.locations : [],
    
    controlZones: Array.isArray(extractedData.geospatialInformation?.controlZones) ? 
      extractedData.geospatialInformation.controlZones : [],
    
    // Civilian situation
    civilianSituation: extractedData.civilianSituation || {
      populationStatus: null,
      displacementActivity: null,
      humanitarianConcerns: [],
      civilianInfrastructure: [],
      confidence: 'low'
    },
    
    // Resource status
    resourceStatus: extractedData.resourceStatus || {
      personnel: {
        status: null,
        casualties: null,
        confidence: 'low'
      },
      equipment: [],
      supplies: {
        status: null,
        shortages: [],
        confidence: 'low'
      }
    },
    
    // Key intelligence
    keyIntelligence: Array.isArray(extractedData.keyIntelligence) ? 
      extractedData.keyIntelligence : [],
    
    // Reliability indicators
    reliabilityAssessment: {
      firsthandObservations: Array.isArray(extractedData.reliability?.firsthandObservations) ? 
        extractedData.reliability.firsthandObservations : [],
      
      secondhandInformation: Array.isArray(extractedData.reliability?.secondhandInformation) ? 
        extractedData.reliability.secondhandInformation : [],
      
      uncertainInformation: Array.isArray(extractedData.reliability?.uncertainInformation) ? 
        extractedData.reliability.uncertainInformation : [],
      
      overallAssessment: extractedData.reliability?.overallAssessment || 'medium'
    }
  };
  
  // Generate quality scores
  const qualityScores = {
    overall: standardizeConfidence(extractedData.reportAnalysis?.reliability || 'medium'),
    tacticalSituation: standardizeConfidence(extractedData.tacticalSituation?.confidence || 'medium'),
    threats: calculateArrayConfidence(extractedData.threats || []),
    geospatialInformation: standardizeConfidence(extractedData.geospatialInformation?.confidence || 'medium'),
    civilianSituation: standardizeConfidence(extractedData.civilianSituation?.confidence || 'low'),
    resourceStatus: standardizeConfidence(extractedData.resourceStatus?.supplies?.confidence || 'medium'),
    keyIntelligence: calculateArrayConfidence(extractedData.keyIntelligence || []),
    reliability: standardizeConfidence(extractedData.reliability?.overallAssessment || 'medium')
  };
  
  // Return structured response
  return {
    reportId,
    intelligence,
    timestamp,
    language,
    qualityScores,
    extractionMethod: 'unified'
  };
}

/**
 * Calculate confidence level for an array of items
 * @param {Array} items - Array of items with confidence property
 * @returns {string} - Overall confidence level
 */
function calculateArrayConfidence(items) {
  if (!items || items.length === 0) {
    return 'low';
  }
  
  // Count confidence levels
  const confidenceCounts = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  items.forEach(item => {
    const confidence = standardizeConfidence(item.confidence || 'medium');
    confidenceCounts[confidence] = (confidenceCounts[confidence] || 0) + 1;
  });
  
  // Determine overall confidence
  if (confidenceCounts.high > items.length / 2) {
    return 'high';
  } else if (confidenceCounts.high + confidenceCounts.medium > items.length / 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Create a fallback response when extraction fails
 * @param {string|Object} reportContent - Raw text or preprocessed content
 * @param {string} reportId - The report's unique identifier
 * @param {string} language - Report language
 * @param {string} context - Additional context (optional)
 * @returns {Object} - Basic fallback response
 */
function createFallbackResponse(reportContent, reportId, language, context = '') {
  const timestamp = new Date().toISOString();
  
  // Extract some basic text content
  let reportText = '';
  if (typeof reportContent === 'string') {
    reportText = reportContent;
  } else if (reportContent.rawTextContent) {
    reportText = reportContent.rawTextContent;
  } else {
    reportText = JSON.stringify(reportContent);
  }
  
  // Create a simple fallback summary based on report length
  let summary = 'Failed to analyze report content.';
  if (reportText.length > 200) {
    // Take the first paragraph as a basic summary
    const firstParagraph = reportText.split('\n\n')[0];
    if (firstParagraph.length > 30) {
      summary = firstParagraph.substring(0, 300) + (firstParagraph.length > 300 ? '...' : '');
    }
  }
  
  // Create minimal intelligence
  const intelligence = {
    summary,
    reliability: 'low',
    reportingQuality: 'medium',
    
    enemyForces: [],
    friendlyForces: [],
    threats: [],
    locations: [],
    controlZones: [],
    
    civilianSituation: {
      populationStatus: null,
      displacementActivity: null,
      humanitarianConcerns: [],
      civilianInfrastructure: [],
      confidence: 'low'
    },
    
    resourceStatus: {
      personnel: {
        status: null,
        casualties: null,
        confidence: 'low'
      },
      equipment: [],
      supplies: {
        status: null,
        shortages: [],
        confidence: 'low'
      }
    },
    
    keyIntelligence: [],
    
    reliabilityAssessment: {
      firsthandObservations: [],
      secondhandInformation: [],
      uncertainInformation: [],
      overallAssessment: 'low'
    }
  };
  
  // All fallback content marked with low confidence
  const qualityScores = {
    overall: 'fallback',
    tacticalSituation: 'fallback',
    threats: 'fallback',
    geospatialInformation: 'fallback',
    civilianSituation: 'fallback',
    resourceStatus: 'fallback',
    keyIntelligence: 'fallback',
    reliability: 'fallback'
  };
  
  return {
    reportId,
    intelligence,
    timestamp,
    language,
    qualityScores,
    extractionMethod: 'fallback'
  };
}