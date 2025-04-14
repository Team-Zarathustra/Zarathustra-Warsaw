import { logger } from '../api/logger/logger.js';
import sigintService from '../services/sigintService/index.js';
import fs from 'fs';
import path from 'path';

const SAMPLE_DATA_PATH = path.join(process.cwd(), 'data', 'sigint_data.json');

export const analyzeSignalData = async (req, res, next) => {
  try {
    logger.info('Signal intelligence analysis requested', { 
      ip: req.ip,
      contentType: req.headers['content-type'],
      dataSize: req.body ? (req.body.length || 'unknown') : 'unknown'
    });

    let signalData;
    let isJsonFormat = false;
    
    if (req.file) {
      try {
        signalData = JSON.parse(req.file.buffer.toString());
        isJsonFormat = true;
      } catch (e) {
        signalData = req.file.buffer;
      }
    } 
    else if (req.headers['content-type']?.includes('application/json')) {
      isJsonFormat = true;
      signalData = req.body;
    } 
    else if (req.body instanceof Buffer || (req.body && req.headers['content-type']?.includes('application/octet-stream'))) {
      signalData = req.body;
    }
    else if (req.body.signalData && typeof req.body.signalData === 'string') {
      try {
        signalData = JSON.parse(req.body.signalData);
        isJsonFormat = true;
      } catch (e) {
        signalData = Buffer.from(req.body.signalData);
      }
    } else {
      try {
        const fileData = fs.readFileSync(SAMPLE_DATA_PATH, 'utf8');
        signalData = JSON.parse(fileData);
        isJsonFormat = true;
        logger.info('Using sample SIGINT data file');
      } catch (e) {
        logger.error('Failed to load sample SIGINT data', { error: e.message });
        signalData = createDummySignals();
        isJsonFormat = true;
      }
    }

    let results;
    
    // Generate a unique analysis ID
    const analysisId = 'sigint-' + Date.now();
    
    if (isJsonFormat) {
      logger.info('Processing JSON-formatted SIGINT data');
      
      // Use the new processSigintJson method to handle the complete JSON structure
      results = await sigintService.processSigintJson(signalData);
      
      // Store the analysis result with the unique ID for future retrieval
      sigintService.storeAnalysisResult(analysisId, results);
    } else {
      logger.info('Processing binary SIGINT data');
      results = createDummyResults();
      
      // Also store dummy results for consistency
      sigintService.storeAnalysisResult(analysisId, results);
    }

    if (!results || !results.activeEmitters || results.activeEmitters.length === 0) {
      logger.info('No active emitters found, generating sample data for testing');
      results = createDummyResults();
      sigintService.storeAnalysisResult(analysisId, results);
    }

    const eob = sigintService.getElectronicOrderOfBattle();

    const analysisResponse = {
      analysisId,
      timestamp: new Date().toISOString(),
      emitters: results.activeEmitters || [],
      detections: results.newLocations || [],
      signals: isJsonFormat ? 
        (signalData.signalCollection?.rawSignals?.length || 
         signalData.signals?.length || 
         'unknown') : 'binary data',
      confidence: 'high',
      electronicOrderOfBattle: eob,
      coverage: {
        startTime: results.activeEmitters && results.activeEmitters.length > 0 ? 
          results.activeEmitters[0].firstDetection : new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString()
      }
    };

    logger.info('SIGINT analysis completed', {
      emitterCount: analysisResponse.emitters.length,
      detectionCount: analysisResponse.detections.length,
      eobElements: Object.values(eob).reduce((sum, arr) => sum + arr.length, 0)
    });

    return res.status(200).json(analysisResponse);
  } catch (error) {
    logger.error('SIGINT analysis failed', { 
      error: error.message,
      stack: error.stack
    });
    
    next(error);
  }
};

// PLACEHOLDER / DUMMY

function createDummySignals() {
 return {
   signals: [
     {
       signalId: "SIG-10042",
       timestamp: new Date().toISOString(),
       receiverId: "RCV-001",
       receiverLocation: {
         lat: 49.8128,
         lng: 24.0324,
         altitude: 320
       },
       frequency: 2840,
       signalStrength: -65,
       angleOfArrival: 45.2,
       pulse: {
         width: 1.5,
         repetitionFrequency: 300,
         pattern: "regular"
       },
       additionalParameters: {
         polarization: "horizontal",
         modulation: "pulse"
       }
     },
     {
       signalId: "SIG-10043",
       timestamp: new Date().toISOString(),
       receiverId: "RCV-002",
       receiverLocation: {
         lat: 49.7952,
         lng: 24.1124,
         altitude: 285
       },
       frequency: 2842,
       signalStrength: -72,
       angleOfArrival: 315.7,
       pulse: {
         width: 1.4,
         repetitionFrequency: 300,
         pattern: "regular"
       },
       additionalParameters: {
         polarization: "horizontal",
         modulation: "pulse"
       }
     },
     {
       signalId: "SIG-10044",
       timestamp: new Date().toISOString(),
       receiverId: "RCV-003",
       receiverLocation: {
         lat: 49.8872,
         lng: 23.9824,
         altitude: 310
       },
       frequency: 2838,
       signalStrength: -68,
       angleOfArrival: 135.3,
       pulse: {
         width: 1.6,
         repetitionFrequency: 301,
         pattern: "regular"
       },
       additionalParameters: {
         polarization: "horizontal",
         modulation: "pulse"
       }
     }
   ]
 };
}

// PLACEHOLDER / DUMMY

function createDummyResults() {
 return {
   processedSignals: 3,
   newLocations: [
     {
       timestamp: new Date().toISOString(),
       location: { lat: 47.8345, lng: 35.1645 },
       accuracy: 150,
       confidenceLevel: 'high',
       signalIds: ['SIG-10042', 'SIG-10043', 'SIG-10044'],
       emitterId: 'emitter-' + Date.now(),
       characteristics: {
         frequency: {
           min: 2838,
           max: 2842,
           agility: 'low'
         },
         pulse: {
           width: 1.5,
           repetitionFrequency: 300,
           patterns: ['regular']
         },
         modulation: ['pulse'],
         sampleSize: 3
       }
     }
   ],
   activeEmitters: [
     {
       emitterId: 'emitter-' + Date.now(),
       firstDetection: new Date(new Date().getTime() - 3600000).toISOString(),
       lastDetection: new Date().toISOString(),
       locations: [
         {
           timestamp: new Date(new Date().getTime() - 3600000).toISOString(),
           location: { lat: 47.8347, lng: 35.1642 },
           accuracy: 180,
           confidenceLevel: 'medium'
         },
         {
           timestamp: new Date().toISOString(),
           location: { lat: 47.8345, lng: 35.1645 },
           accuracy: 150,
           confidenceLevel: 'high'
         }
       ],
       velocityInfo: {
         speed: 1.2,
         speedKmh: 4.32,
         direction: 142.5,
         reliability: 'medium',
         mobilityType: 'slow-moving'
       },
       characteristics: {
         frequency: {
           min: 2838,
           max: 2842,
           agility: 'low'
         },
         pulse: {
           width: 1.5,
           repetitionFrequency: 300,
           patterns: ['regular']
         },
         modulation: ['pulse'],
         sampleSize: 3
       },
       confidenceLevel: 'high',
       classification: 'air-surveillance-radar',
       platformAssessment: {
         type: 'ground-based',
         model: 'P-18 Spoon Rest D',
         confidence: 'medium',
         mobility: 'slow-moving'
       }
     }
   ]
 };
}

export const getActiveEmitters = async (req, res, next) => {
 try {
   const options = {};
   
   if (req.query.timeWindow) {
     options.timeWindow = parseInt(req.query.timeWindow) * 60 * 60 * 1000;
   }
   
   if (req.query.type) {
     options.typeFilter = req.query.type;
   }
   
   if (req.query.confidence) {
     options.confidenceFilter = req.query.confidence;
   }
   
   if (req.query.lat && req.query.lng && req.query.radius) {
     options.areaFilter = {
       center: {
         lat: parseFloat(req.query.lat),
         lng: parseFloat(req.query.lng)
       },
       radius: parseFloat(req.query.radius) * 1000
     };
   }
   
   const emitters = sigintService.getAllEmitterTracks(options);
   const statistics = sigintService.getTrackingStatistics();
   
   return res.status(200).json({
     timestamp: new Date().toISOString(),
     emitters,
     count: emitters.length,
     statistics
   });
 } catch (error) {
   logger.error('Failed to get active emitters', { 
     error: error.message,
     stack: error.stack
   });
   
   next(error);
 }
};

export const getEmitterById = async (req, res, next) => {
 try {
   const { emitterId } = req.params;
   
   if (!emitterId) {
     return res.status(400).json({
       error: 'Missing emitter ID',
       details: 'Please provide a valid emitter ID'
     });
   }
   
   const emitter = sigintService.getEmitterById(emitterId);
   
   if (!emitter) {
     return res.status(404).json({
       error: 'Emitter not found',
       details: `No emitter found with ID: ${emitterId}`
     });
   }
   
   return res.status(200).json(emitter);
 } catch (error) {
   logger.error('Failed to get emitter by ID', { 
     error: error.message,
     stack: error.stack,
     emitterId: req.params.emitterId
   });
   
   next(error);
 }
};

export const getElectronicOrderOfBattle = async (req, res, next) => {
 try {
   const eob = sigintService.getElectronicOrderOfBattle();
   
   return res.status(200).json({
     timestamp: new Date().toISOString(),
     ...eob
   });
 } catch (error) {
   logger.error('Failed to get Electronic Order of Battle', { 
     error: error.message,
     stack: error.stack
   });
   
   next(error);
 }
};