// services/fusionService/models/correlationResult.js
/**
 * Model representing the correlation between HUMINT and SIGINT entities
 */
export class CorrelationResult {
    constructor(data) {
      this.humintEntity = data.humintEntity;
      this.sigintEntity = data.sigintEntity;
      this.spatialCorrelation = data.spatialCorrelation || { score: 0, reason: 'Not calculated' };
      this.temporalCorrelation = data.temporalCorrelation || { score: 0, reason: 'Not calculated' };
      this.semanticCorrelation = data.semanticCorrelation || { score: 0, reason: 'Not calculated' };
      this.score = data.score || 0;
      this.confidence = data.confidence || 'low';
      this.timestamp = data.timestamp || new Date().toISOString();
    }
  
    /**
     * Get the primary factors contributing to this correlation
     * @returns {Array} - Array of primary correlation factors
     */
    getPrimaryFactors() {
      const factors = [];
      
      if (this.spatialCorrelation && this.spatialCorrelation.score > 0.7) {
        factors.push('strong spatial correlation');
      }
      
      if (this.temporalCorrelation && this.temporalCorrelation.score > 0.7) {
        factors.push('strong temporal correlation');
      }
      
      if (this.semanticCorrelation && this.semanticCorrelation.score > 0.7) {
        factors.push('strong semantic correlation');
      }
      
      if (factors.length === 0) {
        if (this.score > 0.5) {
          factors.push('moderate overall correlation');
        } else {
          factors.push('weak correlation');
        }
      }
      
      return factors;
    }
    
    /**
     * Get summary of the correlation result
     * @returns {string} - Summary text
     */
    getSummary() {
      const factors = this.getPrimaryFactors();
      
      return `Correlation between HUMINT and SIGINT (score: ${(this.score * 100).toFixed(0)}%, confidence: ${this.confidence}) based on ${factors.join(', ')}.`;
    }
  }