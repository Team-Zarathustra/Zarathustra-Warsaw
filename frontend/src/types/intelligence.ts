export type QualityScore = 'high' | 'medium' | 'low' | 'fallback';

export type AnalysisStep = 
  | 'IDLE'
  | 'PROCESSING'
  | 'ANALYZING'
  | 'VALIDATING'
  | 'COMPLETE';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  name: string;
  coordinates?: Coordinates;
  accuracy?: 'precise' | 'approximate' | 'unknown';
}

export interface TacticalObservation {
  text: string;
  category?: 'movement' | 'position' | 'engagement' | 'equipment' | 'terrain' | 'weather';
  entities?: {
    force?: 'enemy' | 'friendly' | 'civilian' | 'unknown';
    size?: string;
    equipment?: string;
    status?: 'active' | 'damaged' | 'destroyed' | 'withdrawing' | 'advancing';
  };
  location?: Location;
  time?: string;
  confidence?: QualityScore;
}

export interface ThreatAssessment {
  description: string;
  category?: 'kinetic' | 'explosive' | 'indirect' | 'air' | 'cbrn' | 'electronic' | 'cyber' | 'ambush';
  severity?: 'high' | 'medium' | 'low';
  immediacy?: 'immediate' | 'near-term' | 'potential';
  location?: Location | string;
  time?: string;
  confidence?: QualityScore;
}

export interface ResourceStatus {
  type: string;
  category?: 'equipment' | 'supplies' | 'personnel' | 'medical' | 'support';
  status?: 'operational' | 'limited' | 'critical' | 'depleted';
  quantity?: string;
  description: string;
  confidence?: QualityScore;
}

export interface ControlZone {
  name: string;
  controllingForce: string;
  boundaries?: string;
  confidence?: QualityScore;
}

export interface CommunicationsIncident {
  type: 'jamming' | 'interference' | 'interception' | 'cyber' | 'other';
  description: string;
  system?: string;
  time?: string;
  duration?: string;
  impact?: string;
  suspectedSource?: string;
  confidence?: QualityScore;
}

export interface ReliabilityAssessment {
  overallReliability: QualityScore;
  factors?: {
    hasFirsthandObservations: boolean;
    containsUncertainLanguage: boolean;
    includesSourceAttribution: boolean;
    containsSpecificDetails: boolean;
    hasConflictingInformation: boolean;
  };
  firsthandObservations?: Array<{text: string; indicator: string}>;
  secondhandInformation?: Array<{text: string; source?: string}>;
  uncertainInformation?: Array<{text: string; indicator: string}>;
  confidence: QualityScore;
}

export interface KeyIntelligence {
  item: string;
  category?: 'threat' | 'movement' | 'discovery' | 'opportunity' | 'emergency';
  timeframe?: 'immediate' | 'hours' | 'day';
  location?: string;
  recommendedAction?: string;
  importance?: 'high' | 'medium' | 'low';
  urgency?: 'immediate' | 'near-term' | 'routine';
  confidence?: QualityScore;
}

export interface IntelligenceData {
  summary: string;
  enemyForces?: Array<{
    type?: string;
    size?: string;
    location?: string;
    activity?: string;
    coordinates?: [number, number] | null;
    time?: string | null;
    confidence?: QualityScore;
  }>;
  friendlyForces?: Array<{
    type?: string;
    activity?: string;
    confidence?: QualityScore;
  }>;
  threats?: ThreatAssessment[];
  locations?: Array<{
    name: string;
    coordinates?: [number, number];
    description?: string;
    relatedActivity?: string;
    confidence?: QualityScore;
  }>;
  controlZones?: ControlZone[];
  civilianSituation?: {
    populationStatus?: string;
    displacementActivity?: string;
    humanitarianConcerns?: string[];
    civilianInfrastructure?: Array<{
      type: string;
      status: 'operational' | 'damaged' | 'destroyed';
      impact: string;
      confidence?: QualityScore;
    }>;
    confidence?: QualityScore;
  };
  resourceStatus?: {
    personnel?: {
      status?: string;
      casualties?: string;
      confidence?: QualityScore;
    };
    equipment?: Array<{
      type: string;
      status: 'operational' | 'limited' | 'damaged' | 'destroyed';
      quantity?: string;
      confidence?: QualityScore;
    }>;
    supplies?: {
      status?: string;
      shortages?: string[];
      confidence?: QualityScore;
    };
  };
  keyIntelligence?: KeyIntelligence[];
  communicationsElectronic?: {
    status?: {
      description: string;
      operational: boolean;
      limitations: string[];
      confidence?: QualityScore;
    };
    incidents?: CommunicationsIncident[];
    enemyCommunications?: Array<{
      description: string;
      method?: string;
      content?: string;
      confidence?: QualityScore;
    }>;
    confidence?: QualityScore;
  };
  reliabilityAssessment?: ReliabilityAssessment;
}

export interface AnalysisResponse {
  reportId: string;
  intelligence: IntelligenceData;
  timestamp: string;
  language?: string;
  qualityScores?: {
    [key: string]: QualityScore;
  };
  analysisId?: string;
  extractionMethod?: string;
  predictions?: Prediction[];
  groupedPredictions?: {
    immediate: Prediction[];
    short: Prediction[];
    medium: Prediction[];
    long: Prediction[];
  };
  predictionSummary?: string;
}

export interface RateLimitInfo {
  total: number;
  remaining: number;
  resetsAt?: string;
  limit?: number;
  planType?: string;
  isAuthenticated?: boolean;
  upgradeAvailable?: boolean;
}

export interface Prediction {
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
}

export interface FieldReportAnalysisRequest {
  reportText: string;
  reportMetadata?: {
    reportId?: string;
    type?: string;
    timestamp?: string;
    unitId?: string;
    language?: string;
  };
  extractionOptions?: {
    comprehensive?: boolean;
    extractionTypes?: string[];
    includePredictions?: boolean;
    predictionTypes?: string[];
  };
}

export interface AdaptedIntelligence {
    reportId: string;
    analysisId?: string;
    summary: string;
    urgentIntelligence?: string;
    tacticalObservations: TacticalObservation[];
    threats: ThreatAssessment[];
    enemyForces: string[];
    friendlyForces: ResourceStatus[];
    locations: string[];
    resourceStatus: string[];
    
    personnelStatus?: {
      status?: string;
      casualties?: string;
      confidence?: QualityScore;
    } | null;
    
    suppliesStatus?: {
      status?: string;
      shortages?: string[];
      confidence?: QualityScore;
    } | null;
    
    communicationsStatus?: string[];
    
    electronicWarfare?: Array<{
      type: string;
      description: string;
      location: string;
      confidence: QualityScore;
    }>;
    
    civilianSituation?: {
      populations: any[];
      infrastructure: any[];
      sentiment: any;
      confidence: QualityScore;
    } | null;
    
    controlZones?: Array<{
      name: string;
      controlledBy: string;
      description: string;
      boundaryPoints: any[];
      confidence: QualityScore;
    }>;
    
    weather?: {
      current: string;
      forecast: string;
      impact: string;
      confidence: QualityScore;
    } | null;
    
    terrain?: {
      description: string;
      impact: string;
      confidence: QualityScore;
    } | null;
    
    reliability: {
      confidence: string;
      assessment: string;
      factors?: Record<string, boolean>;
      firsthandObservations?: any[];
      secondhandInformation?: any[];
      uncertainInformation?: any[];
    };
  }

  export interface AdaptedAnalysisResponse {
    reportId: string;
    analysisId?: string;
    intelligence: AdaptedIntelligence;
    timestamp: string;
    language?: string;
    qualityScores?: {
      [key: string]: QualityScore;
    };
    predictions?: Prediction[];
    predictionSummary?: string;
    groupedPredictions?: {
      immediate: Prediction[];
      short: Prediction[];
      medium: Prediction[];
      long: Prediction[];
    };
  }