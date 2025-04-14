// types/sigintTypes.ts
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
  accuracy: number; // meters of potential error
  confidence: QualityScore;
}

export interface EmitterMovement {
  startTime: string;
  endTime: string;
  startCoordinates: Coordinates;
  endCoordinates: Coordinates;
  speed?: number; // in km/h
  direction?: number; // in degrees
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
  associatedHumint?: string[]; // References to HUMINT report IDs
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

// Fusion types - connecting HUMINT and SIGINT
export interface CorrelationStrength {
  value: number; // 0.0 to 1.0
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
  humintSources: string[]; // IDs of HUMINT entities
  sigintSources: string[]; // IDs of SIGINT entities
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

// Map visualization types
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

// Types for visualization components
export interface ProcessedRadarEmitter {
  id: string;
  classification: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  accuracy?: number;
  firstDetected: string;
  lastDetected: string;
  type?: string;
  platformType?: string;
  platformModel?: string;
  frequency?: string;
  modulation?: string;
  historicalPath?: [number, number][];
  predictedLocations?: {
    coordinates: {
      lat: number;
      lng: number;
    };
    timestamp: string;
    uncertaintyRadius?: number;
  }[];
}

export interface CoverageArea {
  type?: string;
  bounds?: [[number, number], [number, number]];
  center?: [number, number];
  radius?: number;
  systemName?: string;
}

export interface TransmissionPath {
  source: [number, number];
  destination: [number, number];
  type: string;
  encrypted?: boolean;
}

export interface ProcessedRadarData {
  emitters: ProcessedRadarEmitter[];
  coverageAreas: CoverageArea[];
  transmissionPaths: TransmissionPath[];
}

// Electronic Order of Battle (EOB) types
export interface AirDefenseSystem {
  id: string;
  name: string;
  type: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  range?: number;
  quantity?: number;
}

export interface GroundForceUnit {
  id: string;
  name: string;
  type?: string;
  echelon?: string;
  equipment?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface NavalVessel {
  id: string;
  name: string;
  type?: string;
  class?: string;
  heading?: number;
  speed?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AircraftUnit {
  id: string;
  platform: string;
  type?: string;
  mission?: string;
  altitude?: number;
  heading?: number;
  speed?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ElectronicOrderOfBattle {
  airDefense: AirDefenseSystem[];
  groundForces: GroundForceUnit[];
  navalForces: NavalVessel[];
  airForces: AircraftUnit[];
}