import { QualityScore, Coordinates, Location } from './intelligence';

export interface RadarEmission {
  id: string;
  timestamp: string;
  frequency: number;
  bandwidth: number;
  powerLevel: number;
  signalType: string;
  confidence: QualityScore;
}

export interface EmitterClassification {
  type: string;
  model?: string;
  confidence: QualityScore;
  capabilities?: string[];
}

export interface EmitterLocation {
  timestamp: string;
  coordinates: Coordinates;
  altitude?: number;
  accuracy: number;
  confidence: QualityScore;
}

export interface EmitterMovement {
  startTime: string;
  endTime: string;
  startCoordinates: Coordinates;
  endCoordinates: Coordinates;
  speed?: number;
  direction?: number;
  confidence: QualityScore;
}

export interface RadarEmitter {
  id: string;
  firstDetected: string;
  lastDetected: string;
  classification: EmitterClassification;
  emissions: RadarEmission[];
  locations: EmitterLocation[];
  movements: EmitterMovement[];
  predictedLocations?: EmitterLocation[];
  associatedHumint?: string[];
  confidence: QualityScore;
}

export interface SigintAnalysisResponse {
  analysisId: string;
  timestamp: string;
  emitters: RadarEmitter[];
  coverage: {
    startTime: string;
    endTime: string;
    region: {
      northEast: Coordinates;
      southWest: Coordinates;
    };
  };
}

export interface FusionOptions {
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

export interface CorrelationStrength {
  value: number;
  factors: {
    spatial: number;
    temporal: number;
    semantic: number;
  };
}

export interface EntityCorrelation {
  humintEntityId: string;
  sigintEmitterId: string;
  strength: CorrelationStrength;
  correlationType: 'confirmed' | 'probable' | 'possible';
  notes?: string;
}

export interface FusedEntity {
  id: string;
  type: 'emitter' | 'force' | 'installation' | 'other';
  humintSources: string[];
  sigintSources: string[];
  combinedConfidence: QualityScore;
  location?: Location;
  lastUpdated: string;
  correlations: EntityCorrelation[];
}

export interface FusionAnalysisResponse {
  fusionId: string;
  timestamp: string;
  humintAnalysisId: string;
  sigintAnalysisId: string;
  fusedEntities: FusedEntity[];
}

export interface LayerControl {
  id: string;
  label: string;
  type: 'humint' | 'sigint' | 'fusion' | 'prediction';
  isVisible: boolean;
  icon?: string;
}

export interface MapTimelineControl {
  currentTime: string;
  startTime: string;
  endTime: string;
  isPlaying: boolean;
  playbackSpeed: number;
}