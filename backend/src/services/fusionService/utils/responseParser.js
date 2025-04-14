// services/fusionService/utils/responseParser.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Parse the LLM response for entity correlation
 * @param {string} responseText - Raw text response from LLM
 * @returns {Object} - Structured correlation result
 */
export function parseCorrelationResponse(responseText) {
  try {
    logger.info('Parsing LLM correlation response', {
      responseLength: responseText.length
    });
    
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('No JSON found in LLM response', {
        sampleResponse: responseText.substring(0, 100) + '...'
      });
      return parseUnstructuredResponse(responseText);
    }
    
    const jsonStr = jsonMatch[0];
    
    // Parse the JSON
    const parsed = JSON.parse(jsonStr);
    
    // Validate and normalize the result
    const result = {
      score: typeof parsed.score === 'number' ? parsed.score : parseScoreFromText(parsed.score),
      reason: parsed.reason || 'No explanation provided',
      entityRelationship: parsed.entityRelationship || 'unknown'
    };
    
    // Ensure score is in valid range
    result.score = Math.max(0, Math.min(1, result.score));
    
    return result;
  } catch (error) {
    logger.error('Error parsing LLM correlation response', {
      error: error.message,
      stack: error.stack,
      sampleResponse: responseText.substring(0, 100) + '...'
    });
    
    // Attempt to salvage information from unstructured response
    return parseUnstructuredResponse(responseText);
  }
}

/**
 * Parse score from text if it's not a number
 * @param {string} scoreText - Text representation of score
 * @returns {number} - Numeric score
 */
function parseScoreFromText(scoreText) {
  if (!scoreText) return 0.5;
  
  // Remove any non-numeric characters except decimal point
  const cleanedText = scoreText.toString().replace(/[^\d.]/g, '');
  
  // Parse as float
  const score = parseFloat(cleanedText);
  
  // Return default if parsing failed
  if (isNaN(score)) return 0.5;
  
  // Ensure in range 0-1
  return Math.max(0, Math.min(1, score));
}

/**
 * Attempt to extract information from unstructured LLM response
 * @param {string} responseText - Raw text response
 * @returns {Object} - Best-effort correlation result
 */
function parseUnstructuredResponse(responseText) {
  // Look for score indicators
  let score = 0.5; // Default medium score
  
  // Check for indications of high correlation
  if (responseText.includes('definitely the same') || 
      responseText.includes('high confidence') ||
      responseText.includes('strongly correlated') ||
      responseText.includes('very likely')) {
    score = 0.85;
  } 
  // Check for indications of moderate correlation
  else if (responseText.includes('likely') ||
           responseText.includes('probable') ||
           responseText.includes('reasonable confidence')) {
    score = 0.65;
  }
  // Check for indications of low correlation
  else if (responseText.includes('unlikely') ||
           responseText.includes('probably not') ||
           responseText.includes('low confidence') ||
           responseText.includes('doubtful')) {
    score = 0.3;
  }
  // Check for indications of very low correlation
  else if (responseText.includes('definitely not') ||
           responseText.includes('unrelated') ||
           responseText.includes('no connection') ||
           responseText.includes('different entities')) {
    score = 0.1;
  }
  
  // Extract a reason if possible
  let reason = responseText.substring(0, 200) + '...';
  
  // Try to find a more specific reason
  const reasonKeywords = ['because', 'reason', 'due to', 'based on'];
  for (const keyword of reasonKeywords) {
    const keywordIndex = responseText.toLowerCase().indexOf(keyword);
    if (keywordIndex !== -1) {
      // Extract text after the keyword
      const textAfterKeyword = responseText.substring(keywordIndex);
      // Find the end of the sentence
      const endIndex = textAfterKeyword.search(/[.!?]\s/) + 1;
      if (endIndex > 0) {
        reason = textAfterKeyword.substring(0, endIndex);
        break;
      }
    }
  }
  
  // Determine entity relationship
  let entityRelationship = 'unknown';
  if (score > 0.8) {
    entityRelationship = 'same_entity';
  } else if (score > 0.6) {
    entityRelationship = 'related_entity';
  } else if (score > 0.4) {
    entityRelationship = 'part_of_same_unit';
  } else if (score > 0.2) {
    entityRelationship = 'supporting_entity';
  } else {
    entityRelationship = 'unrelated';
  }
  
  return {
    score,
    reason,
    entityRelationship,
    parseMethod: 'unstructured'
  };
}

/**
 * Parse LLM response for fused intelligence report
 * @param {string} responseText - Raw text from LLM
 * @returns {Object} - Structured report
 */
export function parseReportResponse(responseText) {
  // This would parse responses from report generation prompts
  // Not fully implemented for this example
  return {
    report: responseText,
    sections: extractReportSections(responseText)
  };
}

/**
 * Extract sections from a generated report
 * @param {string} reportText - Full report text
 * @returns {Object} - Report sections
 */
function extractReportSections(reportText) {
  // Basic section extraction from a formatted report
  // This is a simplified implementation
  
  const sections = {};
  
  // Common section titles in military reports
  const sectionTitles = [
    'SUMMARY', 'SITUATION', 'ENEMY FORCES', 'FRIENDLY FORCES',
    'ASSESSMENT', 'RECOMMENDATION', 'CONCLUSION'
  ];
  
  // Extract content between section headers
  let currentSection = 'preamble';
  sections[currentSection] = '';
  
  const lines = reportText.split('\n');
  
  for (const line of lines) {
    // Check if this line is a section header
    const isSectionHeader = sectionTitles.some(title => 
      line.toUpperCase().includes(title) && 
      line.toUpperCase().replace(/[^A-Z]/g, '').length < 30
    );
    
    if (isSectionHeader) {
      currentSection = line.trim();
      sections[currentSection] = '';
    } else {
      sections[currentSection] += line + '\n';
    }
  }
  
  // Trim whitespace in each section
  for (const section in sections) {
    sections[section] = sections[section].trim();
  }
  
  return sections;
}