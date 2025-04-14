// src/api/fieldReport.ts
import api from "@/util/authUtils";
import { AxiosError } from 'axios';
import axios from 'axios';

// Create a separate API instance for public endpoints that doesn't use the auth interceptors
const API_URL = import.meta.env.VITE_API_URL;
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Types
export interface FieldReportRequest {
  reportText: string;
  reportMetadata?: ReportMetadata;
  extractionOptions?: ExtractionOptions;
}

export interface ReportMetadata {
  reportId?: string;
  type?: string;
  unitId?: string;
  timestamp?: string;
  location?: string;
  reportingOfficer?: string;
  context?: string;
  language?: string;
}

export interface ExtractionOptions {
  comprehensive?: boolean;
  extractionTypes?: string[];
  concurrency?: number;
  optimizeGroups?: boolean;
}

export interface Location {
  name?: string;
  coordinates?: [number, number];
  type?: string;
  description?: string;
  controllingForce?: string;
  timeObserved?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface Threat {
  description: string;
  category?: string;
  severity?: 'high' | 'medium' | 'low';
  immediacy?: string;
  location?: string;
  time?: string;
  affectedUnits?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export interface Force {
  type: string;
  size?: string;
  location?: string;
  activity?: string;
  coordinates?: [number, number];
  time?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface Equipment {
  type: string;
  status: string;
  quantity?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface CivilianPopulation {
  description: string;
  size?: string;
  location?: string;
  status?: string;
  needs?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export interface ReliabilityAssessment {
  overallReliability: 'high' | 'medium' | 'low';
  factors?: {
    hasFirsthandObservations?: boolean;
    containsUncertainLanguage?: boolean;
    includesSourceAttribution?: boolean;
    containsSpecificDetails?: boolean;
    hasConflictingInformation?: boolean;
  };
  firsthandObservations?: string[];
  secondhandInformation?: string[];
  uncertainInformation?: string[];
  overallAssessment?: 'high' | 'medium' | 'low';
}

export interface IntelligenceData {
  summary?: string;
  reliability?: 'high' | 'medium' | 'low';
  reportingQuality?: 'high' | 'medium' | 'low';
  informationTimeliness?: string;
  enemyForces?: Force[];
  friendlyForces?: Force[];
  threats?: Threat[];
  locations?: Location[];
  controlZones?: any[];
  civilianSituation?: {
    populationStatus?: string;
    displacementActivity?: string;
    humanitarianConcerns?: string[];
    civilianInfrastructure?: any[];
    populations?: CivilianPopulation[];
    confidence?: 'high' | 'medium' | 'low';
  };
  resourceStatus?: {
    personnel?: {
      status?: string;
      casualties?: string;
      confidence?: 'high' | 'medium' | 'low';
    };
    equipment?: Equipment[];
    supplies?: {
      status?: string;
      shortages?: string[];
      confidence?: 'high' | 'medium' | 'low';
    };
  };
  keyIntelligence?: any[];
  reliabilityAssessment?: ReliabilityAssessment;
  urgentIntelligence?: string;
  communicationsElectronic?: {
    incidents?: any[];
  };
}

export interface AnalysisResponse {
  reportId: string;
  intelligence: IntelligenceData;
  timestamp: string;
  language?: string;
  qualityScores?: {
    [key: string]: 'high' | 'medium' | 'low' | 'fallback';
  };
  analysisId?: string;
  extractionMethod?: string;
  // Add these missing fields
  predictions?: {
    id: string;
    type: string;
    name: string;
    description: string;
    timeframe: {
      min: number;
      max: number;
      unit: string;
    };
    formattedTimeframe: string;
    confidence: number;
    confidenceFormatted: string;
    confidenceLevel: string;
    evidenceEvents: Array<{
      type: string;
      description: string;
      location?: string;
      timestamp?: string;
    }>;
    patternName: string;
    historicalInstances: number;
  }[];
  predictionSummary?: string;
  groupedPredictions?: {
    immediate: any[];
    short: any[];
    medium: any[];
    long: any[];
  };
}

export interface ValidationResult {
  validatedClaims: any[];
  contradictions: any[];
  unmatchedClaims: any[];
  validationTimestamp: string;
  meta: {
    reportCount: number;
    options: any;
  };
}

export interface RateLimitInfo {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  isAuthenticated?: boolean;
  planType?: string;
  upgradeAvailable?: boolean;
}

// API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error handling utilities
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
 * Get the current rate limits for field report analysis
 * @returns {Promise<RateLimitInfo>} - Rate limit information
 */
export const getFieldReportLimits = async (): Promise<RateLimitInfo> => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Use the authenticated API client
      const response = await api.get<RateLimitInfo>('/field-reports/limits');
      return response.data;
    } else {
      // Fall back to public API for unauthenticated users
      const response = await publicApi.get<RateLimitInfo>('/field-reports/limits');
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

/**
 * Generate quality scores based on analysis content
 * @param {AnalysisResponse} analysis - The analysis response
 * @returns {Object} - Quality scores for each intelligence type
 */
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

/**
 * Refresh the rate limit information after login or registration
 * @returns {Promise<RateLimitInfo>} - Updated rate limit information
 */
export const refreshFieldReportLimits = async (): Promise<RateLimitInfo> => {
  try {
    // Use the API client with auth token
    const response = await api.get<RateLimitInfo>('/field-reports/limits');
    return response.data;
  } catch (error: unknown) {
    console.error('Failed to refresh rate limits:', error);
    
    // Return default values for authenticated users
    return {
      limit: 10,  // Default for authenticated users
      used: 0,
      remaining: 10,
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      isAuthenticated: true,
      planType: 'free',
      upgradeAvailable: true
    };
  }
};