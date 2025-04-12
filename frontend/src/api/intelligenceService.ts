import api from "@/util/authUtils";
import { AxiosError } from 'axios';
import axios from 'axios';

import {
  AnalysisResponse,
  FieldReportAnalysisRequest,
  RateLimitInfo,
  QualityScore
} from '@/types/intelligence';

import {
  SigintAnalysisResponse,
  FusionAnalysisResponse,
  FusionOptions
} from '@/types/sigintTypes';

const API_URL = import.meta.env.VITE_API_URL;
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
    const responseData = error.response?.data as Record<string, any>;
    const errorMessage = responseData?.error || responseData?.message || defaultMessage;
    
    throw new APIError(
      errorMessage,
      status,
      error.response?.data
    );
  }
  console.error('Non-Axios error:', error);
  throw new APIError(defaultMessage, 500);
}

function generateQualityScores(analysis: AnalysisResponse) {
  const { intelligence } = analysis;
  const scores: { [key: string]: QualityScore } = {};
  
  scores.overall = intelligence.reliabilityAssessment?.overallReliability || 'medium';
  
  scores.summary = intelligence.summary ? 'high' : 'fallback';
  
  scores.enemyForces = intelligence.enemyForces && intelligence.enemyForces.length > 0 
    ? 'high' 
    : 'fallback';
  
  scores.friendlyForces = intelligence.friendlyForces && intelligence.friendlyForces.length > 0 
    ? 'medium' 
    : 'fallback';
  
  scores.threats = intelligence.threats && intelligence.threats.length > 0 
    ? 'high' 
    : 'fallback';
  
  scores.geospatialInformation = intelligence.locations && intelligence.locations.length > 0 
    ? 'high' 
    : 'fallback';
  
  scores.civilianSituation = intelligence.civilianSituation?.populationStatus 
    ? 'medium' 
    : 'fallback';
  
  scores.resourceStatus = (
    intelligence.resourceStatus?.equipment && 
    intelligence.resourceStatus.equipment.length > 0
  ) ? 'medium' : 'fallback';
  
  scores.reliability = intelligence.reliabilityAssessment?.overallReliability || 'medium';
  
  return scores;
}

export const analyzeFieldReport = async (data: FieldReportAnalysisRequest): Promise<AnalysisResponse> => {
  try {
    console.log('Making field report analysis request to:', `${API_URL}/field-reports/analyze`);
    console.log('Request data:', { 
      reportLength: data.reportText.length,
      reportMetadata: data.reportMetadata,
      extractionTypes: data.extractionOptions?.extractionTypes
    });
    
    const response = await publicApi.post<AnalysisResponse>(
      '/field-reports/analyze', 
      {
        reportText: data.reportText,
        reportMetadata: data.reportMetadata || {},
        extractionOptions: data.extractionOptions || {}
      }
    );
    
    if (!response.data.qualityScores) {
      response.data.qualityScores = generateQualityScores(response.data);
    }
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to analyze field report');
  }
};

export const validateMultipleReports = async (
  reports: Array<FieldReportAnalysisRequest>,
  validationOptions: any = {}
): Promise<any> => {
  try {
    const response = await publicApi.post(
      '/field-reports/analyze-multiple',
      { reports, validationOptions }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to validate multiple reports');
  }
};

export const exportMilitaryFormat = async (
  analysisId: string,
  format: string,
  customOptions: any = {}
): Promise<any> => {
  try {
    const response = await publicApi.post(
      `/field-reports/export/${analysisId}/${format}`,
      { customOptions }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, `Failed to export in ${format} format`);
  }
};

export const getIntelligenceLimits = async (): Promise<RateLimitInfo> => {
  try {
    const response = await publicApi.get<RateLimitInfo>('/intelligence/limits');
    return response.data;
  } catch (error: unknown) {
    console.error('Failed to fetch rate limits:', error);
    
    return {
      limit: 3,
      remaining: 3,
      total: 3,
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      isAuthenticated: false,
      planType: 'anonymous',
      upgradeAvailable: true
    };
  }
};

export const analyzeSignalData = async (signalData: ArrayBuffer): Promise<SigintAnalysisResponse> => {
  try {
    console.log('Making signal data analysis request to:', `${API_URL}/signal-intelligence/analyze`);
    console.log('Request data size:', signalData.byteLength);
    
    const formData = new FormData();
    const blob = new Blob([signalData], { type: 'application/octet-stream' });
    formData.append('signalData', blob);
    
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
      { 
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to analyze signal data');
  }
};

export const getPredictedEmitterLocations = async (
  emitterId: string,
  options: {
    timeframe: number;
    intervals: number;
    confidenceLevel: number;
  }
): Promise<any> => {
  try {
    const response = await publicApi.post(
      `/signal-intelligence/emitters/${emitterId}/predict`,
      options
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to predict emitter locations');
  }
};

export const getEmitterCharacteristics = async (
  emitterId: string
): Promise<any> => {
  try {
    const response = await publicApi.get(
      `/signal-intelligence/emitters/${emitterId}/characteristics`
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get emitter characteristics');
  }
};

export const getEmitterTimeSeries = async (
  emitterId: string,
  options: {
    startTime: string;
    endTime: string;
    resolution: string;
  }
): Promise<any> => {
  try {
    const response = await publicApi.get(
      `/signal-intelligence/emitters/${emitterId}/timeseries`,
      { params: options }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get emitter time series data');
  }
};

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
    
    const response = await publicApi.post<FusionAnalysisResponse>(
      '/fusion/analyze',
      fusionOptions
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to perform intelligence fusion');
  }
};

export const getCorrelationDetails = async (
  humintEntityId: string,
  sigintEntityId: string
): Promise<any> => {
  try {
    const response = await publicApi.get(
      `/fusion/correlations`,
      { params: { humintEntityId, sigintEntityId } }
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get correlation details');
  }
};

export const getFusedEntityDetails = async (
  fusedEntityId: string
): Promise<any> => {
  try {
    const response = await publicApi.get(
      `/fusion/entities/${fusedEntityId}`
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get fused entity details');
  }
};

export const updateCorrelation = async (
  correlationId: string,
  updates: {
    manualConfidence?: number;
    notes?: string;
    verified?: boolean;
  }
): Promise<any> => {
  try {
    const response = await publicApi.patch(
      `/fusion/correlations/${correlationId}`,
      updates
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update correlation');
  }
};

export const generateCorrelationExplanation = async (
  correlationId: string
): Promise<any> => {
  try {
    const response = await publicApi.get(
      `/fusion/correlations/${correlationId}/explain`
    );
    
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to generate correlation explanation');
  }
};