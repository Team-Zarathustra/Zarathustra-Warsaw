// services/fusionService/integrations/humintAdapter.js
import { logger } from '../../../api/logger/logger.js';
import humintService from '../../humintService/index.js';

/**
 * Adapter for retrieving HUMINT data from the intelligence service
 */
export default class HumintAdapter {
  constructor() {
    this.humintService = humintService;
    logger.info('HUMINT adapter initialized');
  }
  
  /**
   * Get recent field reports from the intelligence service
   * @param {Date} cutoffTime - Earliest time to include
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} - Array of recent reports
   */
  async getRecentReports(cutoffTime, options = {}) {
    try {
      logger.info('Fetching recent HUMINT reports', { 
        cutoffTime: cutoffTime.toISOString() 
      });
      
      // This would call an actual method on the intelligence service
      // For now, we'll implement a simplified version
      const reports = await this.humintService.getRecentReports(cutoffTime);
      
      logger.info('Retrieved HUMINT reports', { count: reports.length });
      return reports;
    } catch (error) {
      logger.error('Error fetching HUMINT reports', { 
        error: error.message,
        stack: error.stack
      });
      return [];
    }
  }
  
  /**
   * Get a specific report by ID
   * @param {string} reportId - Report identifier
   * @returns {Promise<Object|null>} - Report or null if not found
   */
  async getReportById(reportId) {
    try {
      // First try cache
      if (this.cache) {
        const cachedReport = await this.cache.get(`report_${reportId}`);
        if (cachedReport) {
          return cachedReport;
        }
      }

      logger.info(`Report not in cache, fetching from HUMINT service: ${reportId}`);
      const report = await this.humintService.getReportById(reportId);
      if (report) {
        return report;
      }
      
      // If no cached report found, return a basic structure instead of null
      logger.warn(`Report not found in cache: ${reportId}`);
      return {
        reportId: reportId,
        intelligence: {
          summary: "Report data not available",
          enemyForces: [],
          friendlyForces: []
        },
        timestamp: new Date().toISOString(),
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
   * Extract entities from a field report
   * @param {Object} report - Field report data
   * @returns {Array} - Extracted entities
   */
  extractEntitiesFromReport(report) {
    try {
      const entities = [];
      
      // Extract enemy forces
      if (report.intelligence?.enemyForces) {
        report.intelligence.enemyForces.forEach(force => {
          entities.push({
            type: 'military_unit',
            subtype: force.type || 'unknown',
            source: 'humint',
            reportId: report.reportId,
            location: force.location ? {
              name: force.location,
              coordinates: force.coordinates
            } : null,
            timestamp: force.time || report.timestamp,
            description: force.activity,
            confidence: force.confidence || 'medium',
            properties: {
              size: force.size,
              activity: force.activity
            }
          });
        });
      }
      
      // Extract threats
      if (report.intelligence?.threats) {
        report.intelligence.threats.forEach(threat => {
          entities.push({
            type: 'threat',
            subtype: threat.type || 'generic',
            source: 'humint',
            reportId: report.reportId,
            location: threat.location ? {
              name: typeof threat.location === 'string' ? threat.location : threat.location.name,
              coordinates: typeof threat.location === 'object' ? threat.location.coordinates : null
            } : null,
            timestamp: threat.time || report.timestamp,
            description: threat.description,
            confidence: threat.confidence || 'medium',
            properties: {
              severity: threat.severity,
              immediacy: threat.immediacy
            }
          });
        });
      }
      
      // Extract locations
      if (report.intelligence?.locations) {
        report.intelligence.locations.forEach(loc => {
          entities.push({
            type: 'location',
            subtype: loc.type || 'generic',
            source: 'humint',
            reportId: report.reportId,
            location: {
              name: loc.name,
              coordinates: loc.coordinates
            },
            timestamp: loc.timeObserved || report.timestamp,
            description: loc.description || loc.name,
            confidence: loc.confidence || 'medium',
            properties: {
              controllingForce: loc.controllingForce
            }
          });
        });
      }
      
      // Additional entity types could be extracted here
      
      return entities;
    } catch (error) {
      logger.error('Error extracting entities from HUMINT report', {
        reportId: report.reportId,
        error: error.message
      });
      return [];
    }
  }
  
  /**
   * Get entities from multiple reports
   * @param {Array} reports - Array of field reports
   * @returns {Array} - Combined entities from all reports
   */
  getAllEntitiesFromReports(reports) {
    let allEntities = [];
    
    for (const report of reports) {
      const entities = this.extractEntitiesFromReport(report);
      allEntities = allEntities.concat(entities);
    }
    
    return allEntities;
  }
}