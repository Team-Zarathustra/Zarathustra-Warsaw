/**
 * Standardizes confidence level strings
 * @param {string} confidence - Raw confidence level from AI
 * @returns {string} - Standardized confidence level
 */
export function standardizeConfidence(confidence) {
    if (!confidence) return 'low';
    
    const lowerConfidence = confidence.toLowerCase();
    
    if (lowerConfidence === 'high') return 'high';
    if (lowerConfidence === 'medium') return 'medium';
    if (lowerConfidence === 'low') return 'low';
    if (lowerConfidence === 'none' || lowerConfidence === 'fallback') return 'fallback';
    
    // Default to medium for unknown values
    return 'medium';
  }
  
  /**
   * Calculates overall confidence for a section based on individual items
   * @param {Array} items - Array of items with confidence ratings
   * @returns {string} - Overall confidence level (high, medium, low, fallback)
   */
  export function calculateOverallConfidence(items) {
    if (!items || items.length === 0) {
      return 'fallback';
    }
    
    // Map confidence levels to numeric values
    const confidenceValues = {
      'high': 3,
      'medium': 2,
      'low': 1,
      'fallback': 0
    };
    
    // Calculate average confidence score
    let totalScore = 0;
    let validItems = 0;
    
    items.forEach(item => {
      if (item.confidence) {
        const score = confidenceValues[standardizeConfidence(item.confidence)] || 0;
        totalScore += score;
        validItems++;
      }
    });
    
    if (validItems === 0) return 'fallback';
    
    const averageScore = totalScore / validItems;
    
    // Convert back to string confidence
    if (averageScore >= 2.5) return 'high';
    if (averageScore >= 1.5) return 'medium';
    if (averageScore >= 0.5) return 'low';
    return 'fallback';
  }
  
  /**
   * Creates a complete set of quality scores for extraction results
   * @param {Object} extractedData - Data extracted from AI
   * @returns {Object} - Standardized quality scores
   */
  export function generateQualityScores(extractedData) {
    const qualityScores = {};
    
    // Process different types of extracted data
    if (extractedData.companyOverview) {
      qualityScores.companyOverview = extractedData.companyOverview.confidence || 'medium';
    }
    
    if (extractedData.valueProposition) {
      qualityScores.valueProposition = extractedData.valueProposition.confidence || 'medium';
    }
    
    if (Array.isArray(extractedData.painPoints)) {
      qualityScores.painPoints = calculateOverallConfidence(extractedData.painPoints);
    }
    
    if (Array.isArray(extractedData.targetAudience)) {
      qualityScores.targetAudience = calculateOverallConfidence(extractedData.targetAudience);
    }
    
    if (Array.isArray(extractedData.productsServices)) {
      qualityScores.productsServices = calculateOverallConfidence(extractedData.productsServices);
    }
    
    if (Array.isArray(extractedData.recentDevelopments)) {
      qualityScores.recentDevelopments = calculateOverallConfidence(extractedData.recentDevelopments);
    }
    
    if (Array.isArray(extractedData.personalizationAngles)) {
      qualityScores.personalizationAngles = calculateOverallConfidence(extractedData.personalizationAngles);
    }
    
    if (Array.isArray(extractedData.engagementHooks)) {
      qualityScores.engagementHooks = calculateOverallConfidence(extractedData.engagementHooks);
    }
    
    if (extractedData.geographicFocus) {
      qualityScores.geographicFocus = extractedData.geographicFocus.confidence || 'medium';
    }
    
    if (extractedData.technologicalStack) {
      qualityScores.technologicalStack = extractedData.technologicalStack.confidence || 'medium';
    }
    
    // Add other fields as needed
    
    // Calculate overall quality score
    const scores = Object.values(qualityScores);
    const confidenceCounts = {
      high: scores.filter(s => s === 'high').length,
      medium: scores.filter(s => s === 'medium').length,
      low: scores.filter(s => s === 'low').length,
      fallback: scores.filter(s => s === 'fallback').length
    };
    
    if (confidenceCounts.high > scores.length / 2) {
      qualityScores.overall = 'high';
    } else if (confidenceCounts.high + confidenceCounts.medium > scores.length / 2) {
      qualityScores.overall = 'medium';
    } else if (confidenceCounts.fallback > scores.length / 2) {
      qualityScores.overall = 'fallback';
    } else {
      qualityScores.overall = 'low';
    }
    
    return qualityScores;
  }