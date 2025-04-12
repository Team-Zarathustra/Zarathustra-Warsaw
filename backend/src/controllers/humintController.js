import { processFieldReport, validateMultipleReports } from '../services/humintService/humintService.js';
import { logger } from '../api/logger/logger.js';

export const analyzeFieldReport = async (req, res, next) => {
  try {
    const { reportText, reportMetadata = {}, extractionOptions = {} } = req.body;
    
    if (!reportText || typeof reportText !== 'string') {
      return res.status(400).json({ 
        error: 'Report text is required',
        details: 'Please provide the text content of the field report'
      });
    }
    
    logger.info('Field report analysis requested', { 
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      reportId: reportMetadata.reportId,
      reportLength: reportText.length,
      reportSourceType: reportMetadata.sourceType || 'unspecified',
      extractionTypes: extractionOptions.extractionTypes,
      rateLimitInfo: {
        limit: res.getHeader('X-RateLimit-Limit'),
        remaining: res.getHeader('X-RateLimit-Remaining')
      }
    });

    const analysisResults = await processFieldReport(reportText, reportMetadata, extractionOptions);
    
    logger.info('Field report analysis completed successfully', { 
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      reportId: reportMetadata.reportId,
      confidenceLevel: analysisResults.qualityScores?.overall || 'unspecified'
    });
    
    return res.status(200).json(analysisResults);
  } catch (error) {
    logger.error('Field report analysis failed', { 
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      error: error.message,
      stack: error.stack
    });
    
    if (error.name === 'ExtractionError') {
      return res.status(422).json({
        error: 'Failed to analyze field report',
        details: error.message,
        code: 'EXTRACTION_ERROR'
      });
    }
    
    next(error);
  }
};

export const analyzeMultipleReports = async (req, res, next) => {
  try {
    const { reports, validationOptions = {} } = req.body;
    
    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ 
        error: 'Reports array is required',
        details: 'Please provide an array of field reports to analyze'
      });
    }

    const invalidReports = reports.filter(report => !report.reportText || typeof report.reportText !== 'string');
    if (invalidReports.length > 0) {
      return res.status(400).json({
        error: 'Invalid report format',
        details: 'Each report must contain a reportText field with string content',
        invalidIndices: invalidReports.map((_, index) => index)
      });
    }
    
    logger.info('Multiple field reports analysis requested', { 
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      reportCount: reports.length,
      validationTypes: validationOptions.validationTypes || ['corroboration'],
      rateLimitInfo: {
        limit: res.getHeader('X-RateLimit-Limit'),
        remaining: res.getHeader('X-RateLimit-Remaining')
      }
    });

    const validationResults = await validateMultipleReports(reports, validationOptions);
    
    logger.info('Multiple field reports analysis completed', { 
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      reportCount: reports.length,
      validatedClaimsCount: validationResults.validatedClaims?.length || 0
    });
    
    return res.status(200).json(validationResults);
  } catch (error) {
    logger.error('Multiple field reports analysis failed', { 
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      error: error.message,
      stack: error.stack
    });
    
    next(error);
  }
};

export const exportMilitaryFormat = async (req, res, next) => {
  try {
    const { analysisId, format = 'INTSUM' } = req.params;
    const { customOptions = {} } = req.body;
    
    // PLACEHOLDER
    
    const supportedFormats = ['INTSUM', 'INTREP', 'NATO', 'SITREP'];
    
    if (!supportedFormats.includes(format)) {
      return res.status(400).json({
        error: 'Unsupported export format',
        details: `Format must be one of: ${supportedFormats.join(', ')}`,
        supportedFormats
      });
    }
    
    // PLACEHOLDER

    const exportData = {
      format,
      analysisId,
      timestamp: new Date().toISOString(),
      content: "This is a placeholder for the exported content in " + format + " format",
    };
    
    return res.status(200).json(exportData);
  } catch (error) {
    next(error);
  }
};