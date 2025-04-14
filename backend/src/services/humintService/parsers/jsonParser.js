// parsers/jsonParser.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Extract and parse JSON from AI response text
 * @param {string} responseText - Raw AI response text
 * @param {Object} options - Parsing options
 * @returns {Object|null} - Parsed JSON or null if failed
 */
export function extractJsonFromResponse(responseText, options = {}) {
  const {
    extractionType = 'unknown',
    allowPartialRecovery = true,
    throwOnError = false
  } = options;
  
  try {
    // Extract JSON from potential text wrapping
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : null;
    
    if (!jsonStr) {
      logger.error('No JSON found in response', { 
        extractionType,
        responsePreview: responseText.substring(0, 200) + '...'
      });
      
      if (throwOnError) {
        throw new Error('No JSON found in response');
      }
      
      return null;
    }
    
    // Try to parse the JSON
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      logger.error('JSON parse error', { 
        error: parseError.message,
        extractionType,
        jsonPreview: jsonStr.substring(0, 200) + '...'
      });
      
      // Attempt recovery if enabled
      if (allowPartialRecovery) {
        const recoveredJson = recoverTruncatedJson(jsonStr, parseError);
        
        if (recoveredJson) {
          logger.info('Successfully recovered truncated JSON', { extractionType });
          return recoveredJson;
        }
      }
      
      if (throwOnError) {
        throw parseError;
      }
      
      return null;
    }
  } catch (error) {
    logger.error('Error extracting JSON', { 
      error: error.message,
      extractionType
    });
    
    if (throwOnError) {
      throw error;
    }
    
    return null;
  }
}

/**
 * Attempts to recover truncated or malformed JSON
 * @param {string} jsonStr - The JSON string to recover
 * @param {Error} parseError - The original parsing error
 * @returns {Object|null} - Recovered JSON object or null if failed
 */
function recoverTruncatedJson(jsonStr, parseError) {
  // Approach 1: Fix truncation by adding missing closing braces
  if (parseError.message.includes('Unexpected end')) {
    let openBraces = (jsonStr.match(/\{/g) || []).length;
    let closeBraces = (jsonStr.match(/\}/g) || []).length;
    let openBrackets = (jsonStr.match(/\[/g) || []).length;
    let closeBrackets = (jsonStr.match(/\]/g) || []).length;
    
    let missingBraces = openBraces - closeBraces;
    let missingBrackets = openBrackets - closeBrackets;
    
    if (missingBraces > 0 || missingBrackets > 0) {
      const fixedJson = jsonStr + ']'.repeat(missingBrackets) + '}'.repeat(missingBraces);
      try {
        const recovered = JSON.parse(fixedJson);
        logger.info('Successfully recovered truncated JSON by adding closing brackets/braces');
        return recovered;
      } catch (secondError) {
        logger.warn('JSON recovery with missing brackets/braces failed', { error: secondError.message });
      }
    }
  }
  
  // Approach 2: Fix trailing commas and other common issues
  try {
    // Fix trailing commas
    const fixedJson = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/]\s*\{/g, '],[{')
      .replace(/}\s*\{/g, '},{');
    
    const recovered = JSON.parse(fixedJson);
    logger.info('Successfully recovered JSON after fixing format issues');
    return recovered;
  } catch (recoveryError) {
    logger.warn('JSON recovery attempt failed', { error: recoveryError.message });
  }
  
  // Approach 3: Try to extract valid portions of the JSON
  try {
    const extractValidJson = (str) => {
      // Try to find the longest valid JSON object in the string
      let validJson = null;
      
      // Start with the complete string and try progressively shorter substrings
      for (let i = str.length; i > 0; i--) {
        try {
          const substring = str.substring(0, i) + "}".repeat(10); // Add potential closing braces
          const potentialJson = JSON.parse(substring);
          if (potentialJson && typeof potentialJson === 'object') {
            validJson = potentialJson;
            break;
          }
        } catch (e) {
          // Continue trying shorter substrings
        }
      }
      
      return validJson;
    };
    
    const partialJson = extractValidJson(jsonStr);
    if (partialJson) {
      logger.info('Recovered partial JSON object');
      return partialJson;
    }
  } catch (partialError) {
    logger.warn('Partial JSON recovery failed', { error: partialError.message });
  }
  
  return null;
}