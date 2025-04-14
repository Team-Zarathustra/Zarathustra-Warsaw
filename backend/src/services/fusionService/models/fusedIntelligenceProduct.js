// services/fusionService/models/fusedIntelligenceProduct.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Model for a comprehensive intelligence product from fused sources
 */
export class FusedIntelligenceProduct {
  constructor(data) {
    this.id = data.id || `product-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.title = data.title || 'Intelligence Report';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.summary = data.summary || '';
    this.entities = data.entities || [];
    this.assessments = data.assessments || [];
    this.recommendations = data.recommendations || [];
    this.confidence = data.confidence || 'medium';
    this.format = data.format || 'standard';
    this.sources = {
      humint: new Set(),
      sigint: new Set()
    };
    
    // Track source IDs
    this.trackSources(data.entities || []);
  }
  
  /**
   * Track source IDs used in this intelligence product
   * @param {Array} entities - Fused entities
   */
  trackSources(entities) {
    try {
      for (const entity of entities) {
        // Track HUMINT sources
        if (entity.sources?.humint) {
          for (const humintEntity of entity.sources.humint) {
            if (humintEntity.reportId) {
              this.sources.humint.add(humintEntity.reportId);
            }
          }
        }
        
        // Track SIGINT sources
        if (entity.sources?.sigint) {
          for (const sigintEntity of entity.sources.sigint) {
            if (sigintEntity.emitterId) {
              this.sources.sigint.add(sigintEntity.emitterId);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error tracking sources in intelligence product', {
        error: error.message,
        productId: this.id
      });
    }
  }
  
  /**
   * Check if this product contains multi-source corroborated intelligence
   * @returns {boolean} - True if contains multi-source intelligence
   */
  hasMultiSourceIntelligence() {
    return this.sources.humint.size > 0 && this.sources.sigint.size > 0;
  }
  
  /**
   * Calculate overall confidence of the intelligence product
   * @returns {string} - Confidence level (high, medium, low)
   */
  calculateOverallConfidence() {
    try {
      // Tally confidence levels
      const confidenceCounts = {
        high: 0,
        medium: 0,
        low: 0
      };
      
      // Count entities by confidence
      for (const entity of this.entities) {
        if (entity.confidence) {
          confidenceCounts[entity.confidence] = 
            (confidenceCounts[entity.confidence] || 0) + 1;
        }
      }
      
      // Special case: Multi-source corroboration increases confidence
      const multiSourceEntities = this.entities.filter(e => 
        e.sources?.humint?.length > 0 && e.sources?.sigint?.length > 0
      ).length;
      
      const totalEntities = this.entities.length || 1;
      const multiSourceRatio = multiSourceEntities / totalEntities;
      
      // Apply multi-source boost
      if (multiSourceRatio > 0.5) {
        confidenceCounts.high += 2;
      } else if (multiSourceRatio > 0.25) {
        confidenceCounts.medium += 2;
      }
      
      // Determine overall confidence
      const totalVotes = confidenceCounts.high + confidenceCounts.medium + confidenceCounts.low;
      
      if (totalVotes === 0) return 'medium';
      
      if (confidenceCounts.high > totalVotes / 2) return 'high';
      if (confidenceCounts.low > totalVotes / 2) return 'low';
      return 'medium';
    } catch (error) {
      logger.error('Error calculating product confidence', {
        error: error.message,
        productId: this.id
      });
      return 'medium';
    }
  }
  
  /**
   * Format the intelligence product for export
   * @param {string} format - Format type (INTSUM, INTREP, etc.)
   * @returns {Object} - Formatted intelligence product
   */
  formatForExport(format = 'INTSUM') {
    // This would implement format-specific transformations
    // Returns a correctly formatted output for the requested format
    
    const exportFormats = {
      INTSUM: this.formatAsIntsum(),
      INTREP: this.formatAsIntrep(),
      NATO: this.formatAsNatoReport(),
      JSON: this.formatAsJson()
    };
    
    return exportFormats[format] || this.formatAsJson();
  }
  
  /**
   * Format as Intelligence Summary (INTSUM)
   * @returns {Object} - INTSUM formatted report
   */
  formatAsIntsum() {
    return {
      type: 'INTSUM',
      dtg: new Date().toISOString(),
      reference: `INTSUM/${this.id}`,
      period: {
        from: getOldestTimestamp(this.entities),
        to: getNewestTimestamp(this.entities)
      },
      summary: this.summary,
      enemyForces: this.entities
        .filter(e => e.type === 'military_unit')
        .map(formatEntityForIntsum),
      terrain: this.entities
        .filter(e => e.type === 'location')
        .map(formatEntityForIntsum),
      conclusions: this.assessments,
      confidenceAssessment: this.confidence
    };
  }
  
  /**
   * Format as Intelligence Report (INTREP)
   * @returns {Object} - INTREP formatted report
   */
  formatAsIntrep() {
    // Similar implementation as formatAsIntsum but with INTREP structure
    return {
      type: 'INTREP',
      // INTREP specific implementation
    };
  }
  
  /**
   * Format as NATO standard report
   * @returns {Object} - NATO formatted report
   */
  formatAsNatoReport() {
    // NATO format implementation
    return {
      type: 'NATO',
      // NATO specific implementation
    };
  }
  
  /**
   * Format as JSON
   * @returns {Object} - JSON representation
   */
  formatAsJson() {
    return {
      id: this.id,
      title: this.title,
      timestamp: this.timestamp,
      summary: this.summary,
      entities: this.entities,
      assessments: this.assessments,
      recommendations: this.recommendations,
      confidence: this.confidence,
      sources: {
        humint: Array.from(this.sources.humint),
        sigint: Array.from(this.sources.sigint)
      }
    };
  }
}

/**
 * Format entity for INTSUM
 * @param {Object} entity - Fused entity
 * @returns {Object} - INTSUM formatted entity
 */
function formatEntityForIntsum(entity) {
  // Format entity according to INTSUM specifications
  return {
    description: entity.description,
    location: entity.location,
    timestamp: entity.timestamp,
    confidence: entity.confidence,
    multiSource: entity.sources?.humint?.length > 0 && entity.sources?.sigint?.length > 0
  };
}

/**
 * Get oldest timestamp from entity array
 * @param {Array} entities - Array of entities
 * @returns {string} - ISO timestamp
 */
function getOldestTimestamp(entities) {
  if (!entities || entities.length === 0) {
    return new Date().toISOString();
  }
  
  const timestamps = entities
    .map(e => e.timestamp)
    .filter(t => t)
    .map(t => new Date(t).getTime());
  
  if (timestamps.length === 0) {
    return new Date().toISOString();
  }
  
  return new Date(Math.min(...timestamps)).toISOString();
}

/**
 * Get newest timestamp from entity array
 * @param {Array} entities - Array of entities
 * @returns {string} - ISO timestamp
 */
function getNewestTimestamp(entities) {
  if (!entities || entities.length === 0) {
    return new Date().toISOString();
  }
  
  const timestamps = entities
    .map(e => e.timestamp)
    .filter(t => t)
    .map(t => new Date(t).getTime());
  
  if (timestamps.length === 0) {
    return new Date().toISOString();
  }
  
  return new Date(Math.max(...timestamps)).toISOString();
}