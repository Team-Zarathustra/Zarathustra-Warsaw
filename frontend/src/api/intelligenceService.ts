// src/api/intelligenceService.ts
import api from "@/util/authUtils";
import { AxiosError } from 'axios';
import axios from 'axios';
import { 
  AnalysisResponse, 
  APIError,
  FieldReportRequest, 
  ReportMetadata, 
  ExtractionOptions, 
  ValidationResult,
  RateLimitInfo
} from './fieldReport'; // Reuse types from fieldReport.ts
import { SigintAnalysisResponse, FusionAnalysisResponse } from '../type/sigintTypes';

// Create a separate API instance for public endpoints that doesn't use the auth interceptors
const API_URL = import.meta.env.VITE_API_URL;
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handling utilities - reused across services
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}

function handleApiError(error: unknown, defaultMessage: string): never {
  if (error instanceof APIError) {
    throw error;
  }
  if (isAxiosError(error)) {
    console.error('Axios error details:', error.message, error.response?.data);
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || defaultMessage;
    
    throw new APIError(
      errorMessage,
      status,
      error.response?.data
    );
  }
  console.error('Non-Axios error:', error);
  throw new APIError(defaultMessage, 500);
}

// Generate quality scores for HUMINT analysis - reused from fieldReport.ts
function generateQualityScores(analysis: AnalysisResponse) {
  const { intelligence } = analysis;
  const scores: { [key: string]: 'high' | 'medium' | 'low' | 'fallback' } = {};
  
  // Overall data quality
  scores.overall = intelligence.reliability as 'high' | 'medium' | 'low';
  
  // Summary quality
  scores.summary = intelligence.summary ? 'high' : 'fallback';
  
  // Enemy forces quality
  scores.enemyForces = intelligence.enemyForces && intelligence.enemyForces.length > 0 
    ? 'high' 
    : 'fallback';
  
  // Friendly forces quality
  scores.friendlyForces = intelligence.friendlyForces && intelligence.friendlyForces.length > 0 
    ? 'medium' 
    : 'fallback';
  
  // Threats quality
  scores.threats = intelligence.threats && intelligence.threats.length > 0 
    ? 'high' 
    : 'fallback';
  
  // Geospatial information quality
  scores.geospatialInformation = intelligence.locations && intelligence.locations.length > 0 
    ? 'high' 
    : 'fallback';
  
  // Civilian situation quality
  scores.civilianSituation = intelligence.civilianSituation?.populationStatus 
    ? 'medium' 
    : 'fallback';
  
  // Resource status quality
  scores.resourceStatus = intelligence.resourceStatus?.equipment && 
                          intelligence.resourceStatus.equipment.length > 0 
    ? 'medium' 
    : 'fallback';
  
  // Reliability assessment
  scores.reliability = intelligence.reliabilityAssessment?.overallReliability || 'medium';
  
  return scores;
}

/****************************************
 * HUMINT (Human Intelligence) Services *
 ****************************************/

/**
 * Analyze a single field report
 * @param {FieldReportRequest} data - The field report and extraction options
 * @returns {Promise<AnalysisResponse>} - The analysis response
 */
export const analyzeFieldReport = async (data: FieldReportRequest): Promise<AnalysisResponse> => {
  try {
    console.log('Making field report analysis request to:', `${API_URL}/field-reports/analyze`);
    console.log('Request data:', { 
      reportLength: data.reportText.length,
      reportMetadata: data.reportMetadata,
      extractionTypes: data.extractionOptions?.extractionTypes
    });
    
    let headers = {};
    const token = localStorage.getItem('authToken');
    if (token) {
      headers = { Authorization: `Bearer ${token}` };
    }
    
    // Use publicApi to support both authenticated and unauthenticated requests
    const response = await publicApi.post<AnalysisResponse>(
      '/field-reports/analyze', 
      {
        reportText: data.reportText,
        reportMetadata: data.reportMetadata || {},
        extractionOptions: data.extractionOptions || {}
      },
      {
        headers
      }
    );
    
    // Add quality scores if not provided by the API
    if (!response.data.qualityScores) {
      response.data.qualityScores = generateQualityScores(response.data);
    }
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to analyze field report');
  }
};

/**
 * Analyze multiple field reports and perform cross-validation
 * @param {Array} reports - Array of report objects with text and metadata
 * @param {Object} validationOptions - Options for validation
 * @returns {Promise<ValidationResult>} - Cross-validation results
 */
export const validateMultipleReports = async (
  reports: Array<{ reportText: string; reportMetadata?: ReportMetadata; extractionOptions?: ExtractionOptions }>,
  validationOptions: any = {}
): Promise<ValidationResult> => {
  try {
    // This endpoint requires authentication
    const response = await api.post<ValidationResult>(
      '/field-reports/analyze-multiple',
      { reports, validationOptions }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to validate multiple reports');
  }
};

/**
 * Export analysis in military standard format
 * @param {string} analysisId - ID of the analysis to export
 * @param {string} format - Desired format (INTREP, INTSUM, etc.)
 * @param {Object} customOptions - Optional format-specific options
 * @returns {Promise<any>} - Formatted report data
 */
export const exportMilitaryFormat = async (
  analysisId: string,
  format: string,
  customOptions: any = {}
): Promise<any> => {
  try {
    // This endpoint requires authentication
    const response = await api.post(
      `/field-reports/export/${analysisId}/${format}`,
      { customOptions }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, `Failed to export in ${format} format`);
  }
};

/**
 * Get the current rate limits for intelligence analysis
 * @returns {Promise<RateLimitInfo>} - Rate limit information
 */
export const getIntelligenceLimits = async (): Promise<RateLimitInfo> => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Use the authenticated API client
      const response = await api.get<RateLimitInfo>('/intelligence/limits');
      return response.data;
    } else {
      // Fall back to public API for unauthenticated users
      const response = await publicApi.get<RateLimitInfo>('/intelligence/limits');
      return response.data;
    }
  } catch (error: unknown) {
    console.error('Failed to fetch rate limits:', error);
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('authToken') !== null;
    
    // Return default values based on auth status
    return {
      limit: isLoggedIn ? 10 : 3,
      used: 0,
      remaining: isLoggedIn ? 10 : 3,
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      isAuthenticated: isLoggedIn,
      planType: isLoggedIn ? 'free' : 'anonymous',
      upgradeAvailable: true
    };
  }
};

/****************************************
 * SIGINT (Signal Intelligence) Services *
 ****************************************/

/**
 * Analyze signal data to extract radar emitter information
 * @param {ArrayBuffer} signalData - Binary signal data for processing
 * @returns {Promise<SigintAnalysisResponse>} - The analysis response
 */
export const analyzeSignalData = async (signalData: ArrayBuffer): Promise<SigintAnalysisResponse> => {
  try {
    console.log('Making signal data analysis request to:', `${API_URL}/signal-intelligence/analyze`);
    console.log('Request data size:', signalData.byteLength);
    
    let headers = {
      'Content-Type': 'application/octet-stream'
    };
    
    const token = localStorage.getItem('authToken');
    if (token) {
      headers = { 
        ...headers,
        Authorization: `Bearer ${token}` 
      };
    }
    
    // Use FormData to handle binary data
    const formData = new FormData();
    const blob = new Blob([signalData], { type: 'application/octet-stream' });
    formData.append('signalData', blob);
    
    // Add metadata as a JSON string
    const metadata = JSON.stringify({
      timestamp: new Date().toISOString(),
      format: 'raw',
      sampleRate: 44100,
      bits: 16
    });
    formData.append('metadata', metadata);
    
    const response = await publicApi.post<SigintAnalysisResponse>(
      '/signal-intelligence/analyze',
      formData,
      { headers }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to analyze signal data');
  }
};

/**
 * Get predicted locations for a specific radar emitter
 * @param {string} emitterId - ID of the emitter to predict locations for
 * @param {object} options - Prediction options including timeframe
 * @returns {Promise<any>} - The predicted locations
 */
export const getPredictedEmitterLocations = async (
  emitterId: string,
  options: {
    timeframe: number;
    intervals: number;
    confidenceLevel: number;
  }
): Promise<any> => {
  try {
    // This endpoint requires authentication
    const response = await api.post(
      `/signal-intelligence/emitters/${emitterId}/predict`,
      options
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to predict emitter locations');
  }
};

/**
 * Get detailed characteristics for a specific radar emitter
 * @param {string} emitterId - ID of the emitter to get details for
 * @returns {Promise<any>} - The emitter characteristics
 */
export const getEmitterCharacteristics = async (
  emitterId: string
): Promise<any> => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await publicApi.get(
      `/signal-intelligence/emitters/${emitterId}/characteristics`,
      { headers }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get emitter characteristics');
  }
};

/**
 * Get a time series of signal data for a specific emitter
 * @param {string} emitterId - ID of the emitter
 * @param {object} options - Options for the time series data
 * @returns {Promise<any>} - The time series data
 */
export const getEmitterTimeSeries = async (
  emitterId: string,
  options: {
    startTime: string;
    endTime: string;
    resolution: string;
  }
): Promise<any> => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await publicApi.get(
      `/signal-intelligence/emitters/${emitterId}/timeseries`,
      { 
        params: options,
        headers 
      }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get emitter time series data');
  }
};

/****************************************
 * Fusion Intelligence Services        *
 ****************************************/

interface FusionOptions {
  humintAnalysisId: string;
  sigintAnalysisId: string;
  options?: {
    correlationThreshold?: number;
    enhanceWithLLM?: boolean;
    maxEntities?: number;
    focusArea?: {
      northEast: [number, number];
      southWest: [number, number];
    };
  };
}

/**
 * Perform intelligence fusion between HUMINT and SIGINT sources
 * @param {FusionOptions} fusionOptions - Options for the fusion operation
 * @returns {Promise<FusionAnalysisResponse>} - The fusion analysis response
 */
export const performIntelligenceFusion = async (
  fusionOptions: FusionOptions
): Promise<FusionAnalysisResponse> => {
  try {
    console.log('Making intelligence fusion request to:', `${API_URL}/fusion/analyze`);
    console.log('Request data:', {
      humintId: fusionOptions.humintAnalysisId,
      sigintId: fusionOptions.sigintAnalysisId,
      options: fusionOptions.options
    });
    
    let headers = {};
    const token = localStorage.getItem('authToken');
    if (token) {
      headers = { Authorization: `Bearer ${token}` };
    }
    
    const response = await publicApi.post<FusionAnalysisResponse>(
      '/fusion/analyze',
      fusionOptions,
      { headers }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to perform intelligence fusion');
  }
};

/**
 * Get detailed correlation information between specific HUMINT and SIGINT entities
 * @param {string} humintEntityId - ID of the HUMINT entity
 * @param {string} sigintEntityId - ID of the SIGINT entity
 * @returns {Promise<any>} - Detailed correlation information
 */
export const getCorrelationDetails = async (
  humintEntityId: string,
  sigintEntityId: string
): Promise<any> => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await publicApi.get(
      `/fusion/correlations`,
      { 
        params: { humintEntityId, sigintEntityId },
        headers 
      }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get correlation details');
  }
};

/**
 * Get detailed information about a fused entity
 * @param {string} fusedEntityId - ID of the fused entity
 * @returns {Promise<any>} - Detailed fused entity information
 */
export const getFusedEntityDetails = async (
  fusedEntityId: string
): Promise<any> => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await publicApi.get(
      `/fusion/entities/${fusedEntityId}`,
      { headers }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get fused entity details');
  }
};

/**
 * Update the confidence or other attributes of a correlation
 * @param {string} correlationId - ID of the correlation to update
 * @param {object} updates - The updates to apply
 * @returns {Promise<any>} - The updated correlation
 */
export const updateCorrelation = async (
  correlationId: string,
  updates: {
    manualConfidence?: number;
    notes?: string;
    verified?: boolean;
  }
): Promise<any> => {
  try {
    // This endpoint requires authentication
    const response = await api.patch(
      `/fusion/correlations/${correlationId}`,
      updates
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update correlation');
  }
};

/**
 * Generate a narrative explanation for a correlation
 * @param {string} correlationId - ID of the correlation
 * @returns {Promise<any>} - Narrative explanation
 */
export const generateCorrelationExplanation = async (
  correlationId: string
): Promise<any> => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await publicApi.get(
      `/fusion/correlations/${correlationId}/explain`,
      { headers }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to generate correlation explanation');
  }
};