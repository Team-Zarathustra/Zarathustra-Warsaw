// services/fusionService/correlators/llmCorrelator.js
import { logger } from '../../../api/logger/logger.js';
import { callClaudeAPI } from '../../claudeService.js';
import { buildCorrelationPrompt } from '../utils/promptBuilder.js';
import { parseCorrelationResponse } from '../utils/responseParser.js';

/**
 * Use LLM to semantically correlate HUMINT and SIGINT entities
 * @param {Object} humintEntity - The HUMINT entity
 * @param {Object} sigintEntity - The SIGINT entity
 * @returns {Promise<Object>} - Correlation result with score and explanation
 */
export async function correlateUsingLLM(humintEntity, sigintEntity) {
  try {
    logger.info('Starting LLM correlation analysis', {
      humintEntity: humintEntity.type,
      sigintEntity: sigintEntity.type
    });
    
    // Build prompt for the correlation analysis
    const prompt = buildCorrelationPrompt(humintEntity, sigintEntity);
    
    // Call Claude API
    const response = await callClaudeAPI(
      prompt, 
      'claude-3-5-sonnet-20240620' // Use a suitable model
    );
    
    // Parse the response
    const result = parseCorrelationResponse(response.content);
    
    logger.info('LLM correlation complete', {
      correlationScore: result.score,
      correlationReason: result.reason?.substring(0, 100) + '...'
    });
    
    return result;
  } catch (error) {
    logger.error('Error in LLM correlation', {
      error: error.message,
      stack: error.stack
    });
    
    // Return a fallback result with low confidence
    return {
      score: 0.2,
      reason: 'LLM correlation failed: ' + error.message,
      entityRelationship: 'unknown'
    };
  }
}

/**
 * Fallback correlation function that uses simple rules when LLM is not available
 * @param {Object} humintEntity - The HUMINT entity
 * @param {Object} sigintEntity - The SIGINT entity
 * @returns {Object} - Correlation result
 */
export function fallbackCorrelation(humintEntity, sigintEntity) {
  // Simple keyword matching in descriptions
  const humintKeywords = extractKeywords(humintEntity.description);
  const sigintKeywords = extractKeywords(sigintEntity.description);
  
  const matchingKeywords = humintKeywords.filter(
    keyword => sigintKeywords.includes(keyword)
  );
  
  // Calculate keyword overlap ratio
  const keywordOverlap = matchingKeywords.length / 
    Math.max(humintKeywords.length, sigintKeywords.length, 1);
  
  // Simple rules for entity type compatibility
  let typeCompatibility = 0.5; // Neutral starting point
  
  // Radar-related HUMINT entities are more likely to correlate with SIGINT
  if (humintEntity.type === 'military_unit' && 
      (humintEntity.subtype?.includes('radar') || 
       humintEntity.subtype?.includes('air defense') || 
       humintEntity.description?.toLowerCase().includes('radar') ||
       humintEntity.description?.toLowerCase().includes('electronic'))) {
    typeCompatibility = 0.8;
  }
  
  // Calculate final score (weighted combination)
  const score = (keywordOverlap * 0.6) + (typeCompatibility * 0.4);
  
  return {
    score: Math.min(0.7, score), // Cap at 0.7 as fallback shouldn't give extremely high confidence
    reason: `Keyword match (${matchingKeywords.join(', ')}) and entity type compatibility`,
    entityRelationship: score > 0.5 ? 'potential_match' : 'unlikely_match'
  };
}

/**
 * Extract simple keywords from text
 * @param {string} text - Text to extract keywords from
 * @returns {Array<string>} - Array of keywords
 */
function extractKeywords(text) {
  if (!text) return [];
  
  // Simple keyword extraction
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !commonWords.includes(word));
}

// Common words to filter out
const commonWords = [
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
  'his', 'her', 'they', 'from', 'say', 'she', 'will', 'one', 'all', 'would',
  'there', 'their', 'what', 'about', 'who', 'get', 'which', 'when', 'make',
  'can', 'like', 'time', 'just', 'him', 'know', 'take', 'into', 'year', 'your',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'near', 'area', 'observed', 'reported', 'located'
];