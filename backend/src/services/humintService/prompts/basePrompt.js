/**
 * Creates a base system prompt for AI intelligence extraction
 * @param {string} language - Content language ('en' or other)
 * @returns {string} - Base system prompt
 */
export function createBaseSystemPrompt(language = 'en') {
    return `You are a specialized military intelligence analyst with expertise in extracting and structuring information from field reports.
  Your task is to accurately extract specific intelligence from the provided field report.
  
  IMPORTANT GUIDELINES:
  - Extract only information that is explicitly stated or strongly implied in the report
  - Distinguish between firsthand observations and secondhand/reported information
  - Assign appropriate confidence levels (high, medium, low) based on certainty and source
  - Maintain precision in extracting locations, times, units, and quantities
  - Note contradictions or inconsistencies if present
  - DO NOT add assumptions, interpretations, or information not in the report
  - DO NOT include recommendations unless explicitly stated in the report
  - Prioritize factual information over opinions or speculation
  - If information is not available, use null or empty arrays instead of inventing data
  - Respond in ${language === 'en' ? 'English' : language}
  - YOU MUST PRODUCE COMPLETE, VALID JSON THAT CAN BE PARSED WITHOUT ERRORS`;
  }
  
  /**
   * Creates a standardized JSON response format instruction
   * @param {string} format - JSON structure to return
   * @returns {string} - Formatted instruction
   */
  export function createResponseFormatInstruction(format) {
    return `
  RESPONSE FORMAT:
  Return your answer in this JSON format:
  ${format}
  
  Remember to:
  1. Only extract information that is explicitly present or strongly implied
  2. Set confidence to "none" if you can't find the information
  3. Return only the JSON with no additional explanation or notes`;
  }
  
  /**
   * Create the language-specific fallback text
   * @param {string} language - 'en' or other language code
   * @returns {Object} - Localized text strings
   */
  export function getLocalizedTexts(language = 'en') {
    if (language !== 'en') {
      // Add other languages as needed
      return {
        noData: 'Information not found',
        generic: {
          uncertain: 'Uncertain information',
          unknown: 'Unknown'
        },
        reliability: {
          high: 'High reliability',
          medium: 'Medium reliability',
          low: 'Low reliability'
        }
      };
    }
    
    // Default to English
    return {
      noData: 'No data available',
      generic: {
        uncertain: 'Uncertain information',
        unknown: 'Unknown'
      },
      reliability: {
        high: 'High reliability',
        medium: 'Medium reliability',
        low: 'Low reliability'
      }
    };
  }