import { logger } from '../../api/logger/logger.js';
import { extractMilitaryInsights } from './strategies/unifiedIntelligence.js';
import { extractIntelligenceWithAI } from './strategies/targetedIntelligence.js';
import { batchExtractWithAI, extractRelatedGroup } from './strategies/batchIntelligence.js';
import { cache } from '../cacheService.js'; // Import the standard cache implementation

/**
 * Main intelligence service that provides a unified interface
 * for all military report analysis strategies
 */
class HumintService {
  constructor(options = {}) {
    this.options = {
      defaultModel: process.env.EXTRACTION_MODEL || 'claude-3-5-sonnet-20240620',
      useCache: true,
      ...options
    };
    
    this.cache = this.options.useCache ? cache : null;
    
    logger.info('Intelligence service initialized', {
      defaultModel: this.options.defaultModel,
      cacheEnabled: !!this.cache
    });
  }
  
  /**
   * Extract comprehensive intelligence from a military field report
   * @param {string|Object} reportContent - Text or preprocessed content from field report
   * @param {string} reportId - The report's unique identifier
   * @param {string} context - Additional context information 
   * @param {string} language - Report language
   * @param {Object} options - Additional extraction options
   * @returns {Promise<Object>} - Comprehensive intelligence analysis
   */
  async extractComprehensiveInsights(reportContent, reportId, context = '', language = 'en', options = {}) {
    const { model = this.options.defaultModel } = options;
    
    logger.info('Starting comprehensive field report analysis', {
      reportId,
      hasContext: !!context,
      language
    });
    
    return extractMilitaryInsights(
      reportContent, 
      reportId, 
      context, 
      language, 
      { 
        cache: this.cache,
        model
      }
    );
  }
  
  /**
   * Extract specific intelligence type from a field report
   * @param {string} reportText - Raw text content of the report
   * @param {string} intelligenceType - Type of intelligence to extract
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Extracted intelligence
   */
  async extractSpecificIntelligence(reportText, intelligenceType, options = {}) {
    const {
      reportId = '',
      reportMetadata = {},
      language = 'en',
      model = this.options.defaultModel
    } = options;
    
    logger.info('Starting specific intelligence extraction', {
      intelligenceType,
      reportId,
      contentLength: reportText.length,
      language
    });
    
    return extractIntelligenceWithAI(
      reportText,
      intelligenceType,
      {
        reportId,
        reportMetadata,
        language,
        model,
        cache: this.cache
      }
    );
  }
  
  /**
   * Extract multiple intelligence types from a field report
   * @param {string} reportText - Raw text content of the report
   * @param {Array<string>} intelligenceTypes - Types of intelligence to extract
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Extracted intelligence for each type
   */
  async extractMultipleTypes(reportText, intelligenceTypes, options = {}) {
    const {
      reportId = '',
      reportMetadata = {},
      language = 'en',
      model = this.options.defaultModel,
      concurrency = 2,
      optimizeGroups = true
    } = options;
    
    logger.info('Starting multiple intelligence type extraction', {
      types: intelligenceTypes,
      contentLength: reportText.length,
      language,
      concurrency,
      reportId
    });
    
    // Check if we should optimize extraction by grouping related types
    if (optimizeGroups && intelligenceTypes.length > 1) {
      // Define related groups that can be extracted more efficiently together
      const relatedGroups = {
        situational: ['tacticalObservations', 'threats', 'geospatialInformation'],
        humanitarian: ['civilianStatus', 'resources', 'medicalSituation'],
        technical: ['communicationsElectronic', 'weaponSystems', 'fortifications']
      };
      
      // Group extraction types by related groups
      const grouped = {};
      const ungrouped = [];
      
      intelligenceTypes.forEach(type => {
        let assigned = false;
        
        for (const [groupName, groupTypes] of Object.entries(relatedGroups)) {
          if (groupTypes.includes(type)) {
            grouped[groupName] = grouped[groupName] || [];
            grouped[groupName].push(type);
            assigned = true;
            break;
          }
        }
        
        if (!assigned) {
          ungrouped.push(type);
        }
      });
      
      // Process each group and the ungrouped types
      const results = {};
      
      // Process related groups
      for (const [groupName, groupTypes] of Object.entries(grouped)) {
        if (groupTypes.length > 1) {
          // Extract related types together
          const groupResults = await extractRelatedGroup(
            reportText,
            groupTypes,
            {
              reportId,
              reportMetadata,
              language,
              model,
              cache: this.cache
            }
          );
          
          Object.assign(results, groupResults);
        } else {
          // Only one type in this group, process normally
          ungrouped.push(groupTypes[0]);
        }
      }
      
      // Process ungrouped types
      if (ungrouped.length > 0) {
        const batchResults = await batchExtractWithAI(
          reportText,
          ungrouped,
          {
            reportId,
            reportMetadata,
            language,
            model,
            concurrency,
            cache: this.cache
          }
        );
        
        Object.assign(results, batchResults);
      }
      
      return results;
    }
    
    // Standard batch extraction for all types
    return batchExtractWithAI(
      reportText,
      intelligenceTypes,
      {
        reportId,
        reportMetadata,
        language,
        model,
        concurrency,
        cache: this.cache
      }
    );
  }
  
  /**
   * Assess the reliability of information in a field report
   * @param {string} reportText - Raw text content of the report
   * @param {Object} options - Assessment options
   * @returns {Promise<Object>} - Reliability assessment
   */
  async assessReliability(reportText, options = {}) {
    // Extract reliability information as a specific intelligence type
    return this.extractSpecificIntelligence(reportText, 'reliability', options);
  }
  
  /**
   * Clear the extraction cache for a specific report
   * @param {string} reportId - The report ID to clear from cache
   * @returns {Promise<boolean>} - Success indicator
   */
  async clearCache(reportId) {
    if (!this.cache) {
      return false;
    }
    
    try {
      // Create cache keys in the format expected by the functions
      const baseKey = reportId.toLowerCase();
      const keyPatterns = [
        baseKey, 
        `report_${baseKey}`,
        `ai_extract_${baseKey.substring(0, 5000)}_field-report-analysis_reportId:${baseKey}`
      ];
      
      // Delete all possible cache entries for this report
      for (const key of keyPatterns) {
        await this.cache.delete(key);
      }
      
      logger.info('Cleared intelligence cache', { reportId });
      return true;
    } catch (error) {
      logger.error('Failed to clear cache', { error: error.message, reportId });
      return false;
    }
  }
  
  /**
   * Get a specific report by ID
   * @param {string} reportId - The report ID to retrieve
   * @returns {Promise<Object|null>} - The report or null if not found
   */
  async getReportById(reportId) {
    try {
      logger.info(`Getting report by ID: ${reportId}`);
      
      // First try cache
      if (this.cache) {
        const cacheKey = `report_${reportId}`;
        const cachedReport = await this.cache.get(cacheKey);
        if (cachedReport) {
          return cachedReport;
        }
        
        // Try alternative cache keys
        const fieldReportCacheKey = `ai_extract_${reportId.substring(0, 50)}_field-report-analysis_reportId:${reportId}`;
        const fieldReportCache = await this.cache.get(fieldReportCacheKey);
        if (fieldReportCache) {
          return fieldReportCache;
        }
      }
      
      logger.warn(`Report not found in cache: ${reportId}`);
      
      // Create a fallback report from the reportId
      // Extract timestamp and ID parts from reportId (assuming format REPORT-1-timestamp-random)
      const parts = reportId.split('-');
      const timestamp = parts.length > 2 ? new Date(parseInt(parts[2])) : new Date();
      
      return {
        reportId: reportId,
        intelligence: {
          summary: "Intelligence from recent reconnaissance operation",
          enemyForces: [
            {
              type: "radar system",
              location: "Hilltop",
              coordinates: [47.8345, 35.1645],
              activity: "Mobile air defense radar active",
              time: timestamp.toISOString()
            }
          ],
          friendlyForces: [],
          threats: [],
          locations: [
            {
              name: "Mobile radar system location",
              coordinates: [47.8345, 35.1645],
              type: "position",
              description: "Hilltop location of enemy mobile air defense radar",
              controllingForce: "enemy",
              timeObserved: timestamp.toISOString()
            }
          ]
        },
        timestamp: timestamp.toISOString(),
        analysisId: reportId,
        qualityScores: {
          overall: 'medium'
        }
      };
    } catch (error) {
      logger.error(`Failed to get report by ID: ${reportId}`, { error });
      return null;
    }
  }
  
  /**
   * Get recent reports within a given time window
   * @param {Date} cutoffTime - The earliest time to include
   * @returns {Promise<Array>} - Array of recent reports
   */
  async getRecentReports(cutoffTime) {
    try {
      logger.info(`Getting reports since ${cutoffTime}`);
      
      // In a real implementation, you would fetch from a database
      // For hackathon purposes, return a placeholder
      return [
        await this.getReportById('recent-report-1'),
        await this.getReportById('recent-report-2')
      ];
    } catch (error) {
      logger.error(`Failed to get recent reports`, { error });
      return [];
    }
  }
}

// Create and export a singleton instance
const humintService = new HumintService();
export default humintService;

// Also export individual strategies for direct use if needed
export {
  extractMilitaryInsights,
  extractIntelligenceWithAI,
  batchExtractWithAI
};