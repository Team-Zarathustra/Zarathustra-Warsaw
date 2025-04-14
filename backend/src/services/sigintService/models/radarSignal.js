/**
 * Class representing a raw radar signal detection
 */
export class RadarSignal {
    constructor(data) {
      this.signalId = data.signalId || `sig-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.timestamp = data.timestamp || new Date().toISOString();
      this.receiverId = data.receiverId;
      this.receiverLocation = data.receiverLocation; // {lat, lng, altitude}
      this.frequency = data.frequency; // MHz
      this.signalStrength = data.signalStrength; // dBm
      this.signatureCharacteristics = data.signatureCharacteristics || {};
      this.angleOfArrival = data.angleOfArrival; // degrees
      this.pulse = data.pulse || {}; // pulse characteristics
      this.additionalParameters = data.additionalParameters || {};
    }
  }
  
  /**
   * Class representing a calculated emitter location
   */
  export class EmitterLocation {
    constructor(data) {
      this.timestamp = data.timestamp || new Date().toISOString();
      this.location = data.location; // {lat, lng, altitude}
      this.accuracy = data.accuracy || 0; // meters
      this.confidenceLevel = data.confidenceLevel || 'medium';
      this.signalIds = data.signalIds || []; // signals used for this calculation
      this.emitterId = data.emitterId; // assigned emitter ID
      this.characteristics = data.characteristics || {}; // derived emitter characteristics
    }
  }
  
  /**
   * Class representing an emitter track
   */
  export class EmitterTrack {
    constructor(data) {
      this.emitterId = data.emitterId;
      this.firstDetection = data.firstDetection;
      this.lastDetection = data.lastDetection;
      this.locations = data.locations || []; // array of EmitterLocation objects
      this.velocityInfo = data.velocityInfo || null;
      this.characteristics = data.characteristics || {}; // consistent characteristics
      this.confidenceLevel = data.confidenceLevel || 'medium';
      this.classification = data.classification || 'unknown'; // emitter type classification
      this.platformAssessment = data.platformAssessment || {
        type: 'unknown',
        model: 'unknown',
        confidence: 'low',
        mobility: 'unknown'
      };
    }
  
    /**
     * Get the most recent location of this emitter
     * @returns {EmitterLocation|null} - Most recent location or null if no locations
     */
    getMostRecentLocation() {
      if (!this.locations || this.locations.length === 0) {
        return null;
      }
      
      return this.locations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
    }
  
    /**
     * Add a new location to this emitter's track
     * @param {EmitterLocation} location - The new location to add
     */
    addLocation(location) {
      if (!this.locations) {
        this.locations = [];
      }
      this.locations.push(location);
      this.lastDetection = location.timestamp;
    }
  }
  
  /**
   * Class representing an Electronic Order of Battle element
   */
  export class EOBElement {
    constructor(data) {
      this.id = data.id;
      this.type = data.type; // SAM, artillery, communications, etc.
      this.components = data.components || []; // Array of emitters that are part of this element
      this.location = data.location; // Approximate center of the element
      this.confidence = data.confidence || 'low';
      this.notes = data.notes || '';
      this.timestamp = data.timestamp || new Date().toISOString();
    }
  }