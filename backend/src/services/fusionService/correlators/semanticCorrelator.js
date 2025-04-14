// services/fusionService/correlators/semanticCorrelator.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Correlate entities based on semantic content
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @returns {Object} - Semantic correlation result
 */
export function correlateSemanticContent(entity1, entity2) {
  try {
    // This is a fallback semantic correlator when LLM is not available
    // It uses keyword matching and entity type compatibility
    
    // Extract descriptions to compare
    const desc1 = entity1.description || '';
    const desc2 = entity2.description || '';
    
    // Clean and tokenize descriptions
    const tokens1 = tokenizeText(desc1);
    const tokens2 = tokenizeText(desc2);
    
    // Calculate token overlap
    const commonTokens = findCommonTokens(tokens1, tokens2);
    const overlapScore = calculateOverlapScore(commonTokens, tokens1, tokens2);
    
    // Check entity type compatibility
    const typeCompatibilityScore = assessTypeCompatibility(entity1, entity2);
    
    // Combine scores with type compatibility having higher weight
    const combinedScore = (overlapScore * 0.4) + (typeCompatibilityScore * 0.6);
    
    return {
      score: combinedScore,
      reason: `Semantic similarity based on ${commonTokens.length} shared keywords and entity type compatibility`,
      commonTerms: commonTokens
    };
  } catch (error) {
    logger.error('Error in semantic correlation', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      score: 0.3, // Default to low-medium score on error
      reason: 'Error in semantic correlation: ' + error.message,
      commonTerms: []
    };
  }
}

/**
 * Tokenize text into meaningful tokens
 * @param {string} text - Text to tokenize
 * @returns {Array} - Array of tokens
 */
function tokenizeText(text) {
  if (!text) return [];
  
  // Convert to lowercase
  const lowercased = text.toLowerCase();
  
  // Remove punctuation and split by whitespace
  const tokens = lowercased
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2) // Remove very short words
    .filter(token => !stopWords.includes(token)); // Remove stop words
  
  return tokens;
}

/**
 * Find common tokens between two token arrays
 * @param {Array} tokens1 - First token array
 * @param {Array} tokens2 - Second token array
 * @returns {Array} - Common tokens
 */
function findCommonTokens(tokens1, tokens2) {
  const tokenSet2 = new Set(tokens2);
  return tokens1.filter(token => tokenSet2.has(token));
}

/**
 * Calculate overlap score based on common tokens
 * @param {Array} commonTokens - Common tokens
 * @param {Array} tokens1 - First token array
 * @param {Array} tokens2 - Second token array
 * @returns {number} - Overlap score (0-1)
 */
function calculateOverlapScore(commonTokens, tokens1, tokens2) {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  // Calculate Jaccard similarity
  const unionSize = new Set([...tokens1, ...tokens2]).size;
  const jaccardSimilarity = commonTokens.length / unionSize;
  
  // Calculate coverage of each token set
  const coverage1 = commonTokens.length / tokens1.length;
  const coverage2 = commonTokens.length / tokens2.length;
  
  // Combine measures
  return (jaccardSimilarity * 0.4) + ((coverage1 + coverage2) / 2) * 0.6;
}

/**
 * Assess compatibility between entity types
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @returns {number} - Compatibility score (0-1)
 */
function assessTypeCompatibility(entity1, entity2) {
  // Define type compatibility matrix
  const compatibilityMatrix = {
    // HUMINT entity types
    military_unit: {
      electronic_emitter: 0.7, // Military units often have electronic emissions
      military_unit: 0.9,
      threat: 0.5,
      location: 0.4
    },
    threat: {
      electronic_emitter: 0.6, // Threats may have electronic signatures
      military_unit: 0.5,
      threat: 0.9,
      location: 0.3
    },
    location: {
      electronic_emitter: 0.3, // Locations themselves don't emit, but contain emitters
      military_unit: 0.4,
      threat: 0.3,
      location: 0.9
    },
    
    // SIGINT entity types
    electronic_emitter: {
      military_unit: 0.7,
      threat: 0.6,
      location: 0.3,
      electronic_emitter: 0.9
    }
  };
  
  // Get entity types, defaulting to generic if not specified
  const type1 = entity1.type || 'generic';
  const type2 = entity2.type || 'generic';
  
  // Look up compatibility score
  if (compatibilityMatrix[type1] && compatibilityMatrix[type1][type2] !== undefined) {
    return compatibilityMatrix[type1][type2];
  }
  
  // Default score for unspecified type combinations
  return 0.5;
}

// Common stop words to filter out
const stopWords = [
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
  'his', 'her', 'they', 'from', 'say', 'she', 'will', 'one', 'all', 'would',
  'there', 'their', 'what', 'about', 'who', 'get', 'which', 'when', 'make',
  'can', 'like', 'time', 'just', 'him', 'know', 'take', 'into', 'year', 'your',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'near', 'area', 'observed', 'reported', 'located'
];