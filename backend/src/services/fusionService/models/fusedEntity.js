// services/fusionService/models/fusedEntity.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Model for a fused entity combining HUMINT and SIGINT data
 */
export class FusedEntity {
  constructor(data) {
    this.id = data.id || `entity-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.type = data.type || 'unknown';
    this.sources = data.sources || { humint: [], sigint: [] };
    this.location = data.location;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.description = data.description || '';
    this.confidence = data.confidence || 'medium';
    this.correlation = data.correlation;
    this.properties = data.properties || {};
  }
  
  /**
   * Check if entity is confirmed by multiple sources
   * @returns {boolean} - True if confirmed by both HUMINT and SIGINT
   */
  hasMultiSourceConfirmation() {
    return this.sources.humint.length > 0 && this.sources.sigint.length > 0;
  }
  
  /**
   * Get primary source for this entity
   * @returns {string} - Primary source type
   */
  getPrimarySource() {
    if (this.sources.humint.length > 0 && this.sources.sigint.length === 0) {
      return 'humint';
    } else if (this.sources.humint.length === 0 && this.sources.sigint.length > 0) {
      return 'sigint';
    } else if (this.sources.humint.length > 0 && this.sources.sigint.length > 0) {
      return 'multi-source';
    }
    return 'unknown';
  }
  
  /**
   * Get the most recent timestamp from all source entities
   * @returns {string} - ISO timestamp
   */
  getMostRecentTimestamp() {
    try {
      const timestamps = [];
      
      // Add timestamps from HUMINT sources
      for (const entity of this.sources.humint) {
        if (entity.timestamp) {
          timestamps.push(new Date(entity.timestamp).getTime());
        }
      }
      
      // Add timestamps from SIGINT sources
      for (const entity of this.sources.sigint) {
        if (entity.timestamp) {
          timestamps.push(new Date(entity.timestamp).getTime());
        }
      }
      
      // Get most recent timestamp
      if (timestamps.length > 0) {
        return new Date(Math.max(...timestamps)).toISOString();
      }
      
      // Default to entity timestamp if no source timestamps
      return this.timestamp;
    } catch (error) {
      logger.error('Error getting most recent timestamp', {
        entityId: this.id,
        error: error.message
      });
      return this.timestamp;
    }
  }
  
  /**
   * Generate a summary of this fused entity
   * @returns {string} - Summary text
   */
  getSummary() {
    const sourceTypes = [];
    if (this.sources.humint.length > 0) sourceTypes.push('HUMINT');
    if (this.sources.sigint.length > 0) sourceTypes.push('SIGINT');
    
    const sourceText = sourceTypes.length > 0 
      ? `[${sourceTypes.join('+')}]` 
      : '[Unknown]';
    
    let confidenceText = '';
    if (this.confidence === 'high') {
      confidenceText = 'high confidence';
    } else if (this.confidence === 'medium') {
      confidenceText = 'medium confidence';
    } else {
      confidenceText = 'low confidence';
    }
    
    return `${sourceText} ${this.description} (${confidenceText})`;
  }
  
  /**
   * Convert to JSON representation
   * @returns {Object} - JSON object
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      sources: this.sources,
      location: this.location,
      timestamp: this.timestamp,
      description: this.description,
      confidence: this.confidence,
      correlation: this.correlation ? {
        score: this.correlation.score,
        factors: this.correlation.getPrimaryFactors()
      } : null,
      properties: this.properties,
      multiSource: this.hasMultiSourceConfirmation()
    };
  }
}

// Export the classes from the models directory
export { CorrelationResult } from './correlationResult.js';
export { FusedIntelligenceProduct } from './fusedIntelligenceProduct.js';