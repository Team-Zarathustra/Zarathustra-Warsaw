import { logger } from '../../../api/logger/logger.js';
import { callClaudeAPI } from '../../claudeService.js';
import { createMilitaryExtractionPrompt } from '../prompts/militaryPrompts.js';
import { extractJsonFromResponse } from '../parsers/jsonParser.js';
import { generateQualityScores, standardizeConfidence } from '../parsers/confidenceCalculator.js';
import { generateCacheKey, getCachedResult, setCacheResult } from '../utils/caching.js';
import { withRetry, ExtractionError } from '../utils/errorHandling.js';

// Configure model for extraction tasks
const EXTRACTION_MODEL = process.env.EXTRACTION_MODEL || 'claude-3-5-sonnet-20240620';

/**
 * Extract specific intelligence type from field report text using AI
 * @param {string} reportText - Raw text of the field report
 * @param {string} intelligenceType - Type of intelligence to extract
 * @param {Object} options - Additional options for extraction
 * @returns {Promise<Object>} - Extracted intelligence with confidence score
 */
export async function extractIntelligenceWithAI(reportText, intelligenceType, options = {}) {
  try {
    const { cache, model = EXTRACTION_MODEL, language = 'en', reportId = '' } = options;
    
    logger.info('Starting AI intelligence extraction', { 
      intelligenceType,
      contentLength: reportText.length,
      model,
      reportId
    });
    
    // Generate cache key if caching is enabled
    let cacheKey = null;
    if (cache) {
      cacheKey = generateCacheKey(reportText.substring(0, 5000), intelligenceType, options);
      
      // Check cache first
      const cachedResult = await getCachedResult(cache, cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    // Create targeted extraction prompt
    const prompt = createMilitaryExtractionPrompt(reportText, intelligenceType, { 
      ...options, 
      language,
      reportMetadata: options.reportMetadata || {}
    });
    
    // Call AI API with retry logic
    const response = await withRetry(
      callClaudeAPI, 
      [prompt, model], 
      { context: `${intelligenceType} intelligence extraction`, maxRetries: 2 }
    );
    
    // Parse and validate response
    const parsedData = extractJsonFromResponse(response.content, {
      extractionType: intelligenceType,
      allowPartialRecovery: true
    });
    
    if (!parsedData) {
      throw new ExtractionError(`Failed to parse ${intelligenceType} intelligence extraction response`);
    }
    
    // Extract the specific intelligence based on type
    const extractionResult = parseTargetedResponse(parsedData, intelligenceType);
    
    logger.info('AI intelligence extraction completed', {
      intelligenceType,
      success: !!extractionResult.data,
      confidence: extractionResult.confidence,
      reportId
    });
    
    // Cache the result if caching is enabled
    if (cache && cacheKey) {
      await setCacheResult(cache, cacheKey, extractionResult, 24 * 60 * 60);
    }
    
    return extractionResult;
  } catch (error) {
    logger.error('AI intelligence extraction failed', {
      intelligenceType,
      error: error.message,
      stack: error.stack,
      reportId: options.reportId || 'unknown'
    });
    
    return {
      data: null,
      confidence: 'fallback',
      error: error.message,
      intelligenceType
    };
  }
}

/**
 * Parse and validate the AI extraction response
 * @param {Object} parsedData - Parsed JSON from AI response
 * @param {string} intelligenceType - Type of intelligence that was extracted
 * @returns {Object} - Structured extraction results
 */
function parseTargetedResponse(parsedData, intelligenceType) {
  try {
    // Extract relevant data based on intelligence type
    if (parsedData[intelligenceType]) {
      const extractedData = parsedData[intelligenceType];
      
      // Validate confidence level
      const rawConfidence = extractedData.confidence;
      const confidence = standardizeConfidence(rawConfidence);
      
      // Remove confidence from data object to avoid duplication
      const { confidence: _, ...dataWithoutConfidence } = extractedData;
      
      return {
        data: dataWithoutConfidence,
        confidence: confidence === 'none' ? 'fallback' : confidence,
        intelligenceType
      };
    }
    
    logger.warn('Unexpected response structure', { intelligenceType, parsedData });
    return { 
      data: null, 
      confidence: 'fallback',
      error: 'Unexpected response structure',
      intelligenceType
    };
    
  } catch (error) {
    logger.error('Error processing intelligence response', { error: error.message });
    return { 
      data: null, 
      confidence: 'fallback',
      error: error.message,
      intelligenceType
    };
  }
}