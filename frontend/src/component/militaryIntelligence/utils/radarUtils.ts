// Utility functions for processing radar emitter data
// These should be placed in a separate utility file like radarUtils.ts

/**
 * Processes SIGINT data to extract radar emitter information
 * @param sigintData The raw SIGINT analysis data
 * @returns Processed radar information for mapping
 */
export const processRadarEmitters = (sigintData: any) => {
    if (!sigintData || !sigintData.emitters || !Array.isArray(sigintData.emitters)) {
      return {
        emitters: [],
        coverageAreas: [],
        transmissionPaths: []
      };
    }
    
    const emitters = sigintData.emitters.map((emitter: any) => {
      // Find the most recent location
      const latestLocation = emitter.locations && emitter.locations.length > 0 ? 
        [...emitter.locations].sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0] : null;
      
      // Process location data
      let coordinates = null;
      let accuracy = 500; // Default accuracy in meters
      
      if (latestLocation && latestLocation.location) {
        // Fix for truncated coordinates (Ukraine is around 47-50°N)
        let lat = latestLocation.location.latitude;
        const lng = latestLocation.location.longitude;
        
        // If a lat value is less than 10 but should be in Ukraine, add 40
        if (lat < 10 && lng > 30 && lng < 41) {
          lat = 40 + lat;
        }
        
        coordinates = { lat, lng };
        accuracy = latestLocation.accuracy || accuracy;
      }
      
      // Process movement data
      const movements = (emitter.movements || []).map((movement: any) => {
        if (!movement.path || !Array.isArray(movement.path)) return null;
        
        return {
          path: movement.path.map((point: any) => {
            if (!point.location) return null;
            
            // Fix for truncated coordinates
            let lat = point.location.latitude;
            const lng = point.location.longitude;
            
            if (lat < 10 && lng > 30 && lng < 41) {
              lat = 40 + lat;
            }
            
            return { lat, lng, timestamp: point.timestamp };
          }).filter(Boolean),
          speed: movement.speed,
          direction: movement.direction,
          startTime: movement.startTime,
          endTime: movement.endTime
        };
      }).filter(Boolean);
      
      // Process emission data
      const emissions = (emitter.emissions || []).map((emission: any) => {
        // Simplified emission data for visualization
        return {
          id: emission.id,
          timestamp: emission.timestamp,
          signalType: emission.signalType,
          frequency: emission.frequency,
          pulseCharacteristics: emission.pulseCharacteristics,
          confidence: emission.confidence
        };
      });
      
      // Create predicted locations
      const predictedLocations = (emitter.predictedLocations || []).map((prediction: any) => {
        if (!prediction.location) return null;
        
        // Fix for truncated coordinates
        let lat = prediction.location.latitude;
        const lng = prediction.location.longitude;
        
        if (lat < 10 && lng > 30 && lng < 41) {
          lat = 40 + lat;
        }
        
        return {
          coordinates: { lat, lng },
          timestamp: prediction.timestamp,
          confidence: prediction.confidence,
          uncertaintyRadius: prediction.uncertaintyRadius || 300
        };
      }).filter(Boolean);
      
      // Create historical path
      const historicalPath = (emitter.locations || [])
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((location: any) => {
          if (!location.location) return null;
          
          // Fix for truncated coordinates
          let lat = location.location.latitude;
          const lng = location.location.longitude;
          
          if (lat < 10 && lng > 30 && lng < 41) {
            lat = 40 + lat;
          }
          
          return { lat, lng, timestamp: location.timestamp };
        }).filter(Boolean);
      
      // Return processed emitter data
      return {
        id: emitter.id,
        type: emitter.classification || 'unknown',
        coordinates,
        accuracy,
        classification: emitter.classification,
        platformType: emitter.platformAssessment?.type || 'unknown',
        platformModel: emitter.platformAssessment?.model,
        mobility: emitter.platformAssessment?.mobility,
        firstDetected: emitter.firstDetected,
        lastDetected: emitter.lastDetected,
        confidence: emitter.confidence || 'medium',
        emissions,
        movements,
        historicalPath,
        predictedLocations,
        
        // Add characteristic data if available
        frequency: emitter.characteristics?.frequency 
          ? `${emitter.characteristics.frequency.min}-${emitter.characteristics.frequency.max} MHz` 
          : null,
        modulation: emitter.characteristics?.modulation 
          ? emitter.characteristics.modulation.join(', ') 
          : null
      };
    });
    
    // Generate coverage areas based on emitter distribution
    const coverageAreas = generateCoverageAreas(sigintData);
    
    // Generate transmission paths (for comms or data links)
    const transmissionPaths = generateTransmissionPaths(sigintData);
    
    return {
      emitters,
      coverageAreas,
      transmissionPaths
    };
  };
  
  /**
   * Generate coverage areas based on emitter density
   * @param sigintData The SIGINT analysis data
   * @returns Array of coverage areas
   */
  function generateCoverageAreas(sigintData: any) {
    if (!sigintData || !sigintData.emitters || !Array.isArray(sigintData.emitters)) {
      return [];
    }
    
    const coverageAreas: any[] = [];
    
    // If coverage area is explicitly provided, use it
    if (sigintData.coverage && sigintData.coverage.region) {
      const { northEast, southWest } = sigintData.coverage.region;
      
      if (northEast && southWest) {
        // Create a bounds object for the coverage area
        coverageAreas.push({
          id: 'primary-coverage',
          type: 'primary',
          bounds: [
            [northEast.latitude, northEast.longitude],
            [southWest.latitude, southWest.longitude]
          ],
          confidence: 'high'
        });
      }
    }
    
    // For each air defense element in EOB, create coverage areas
    if (sigintData.electronicOrderOfBattle && sigintData.electronicOrderOfBattle.airDefenseElements) {
      sigintData.electronicOrderOfBattle.airDefenseElements.forEach((element: any, index: number) => {
        if (!element.location) return;
        
        // Create circular coverage area based on system type and range
        const radius = getSystemRange(element.systemName, element.type);
        
        coverageAreas.push({
          id: `air-defense-${index}`,
          type: 'air-defense',
          center: [element.location.latitude, element.location.longitude],
          radius,
          systemName: element.systemName,
          systemType: element.type,
          confidence: element.confidence || 'medium'
        });
      });
    }
    
    return coverageAreas;
  }
  
  /**
   * Get estimated range for a given air defense system
   * @param systemName The name of the air defense system
   * @param systemType The type of the system
   * @returns Estimated range in meters
   */
  function getSystemRange(systemName: string, systemType: string): number {
    // Default range for unknown systems
    let range = 20000; // 20km
    
    // Check system type
    const type = systemType?.toLowerCase() || '';
    const name = systemName?.toLowerCase() || '';
    
    if (type.includes('long') || name.includes('s-300') || name.includes('s-400')) {
      range = 200000; // 200km for long-range systems
    } else if (type.includes('medium') || name.includes('buk') || name.includes('kub')) {
      range = 50000; // 50km for medium-range systems
    } else if (type.includes('short') || name.includes('tor') || name.includes('osa')) {
      range = 15000; // 15km for short-range systems
    } else if (type.includes('manpad') || name.includes('igla') || name.includes('stinger')) {
      range = 5000; // 5km for MANPADS
    }
    
    return range;
  }
  
  /**
   * Generate transmission paths (data links, comms, etc.)
   * @param sigintData The SIGINT analysis data
   * @returns Array of transmission paths
   */
  function generateTransmissionPaths(sigintData: any) {
    if (!sigintData || !sigintData.emitters || !Array.isArray(sigintData.emitters)) {
      return [];
    }
    
    const transmissionPaths: any[] = [];
    
    // For each communication link, create a path
    if (sigintData.communications && Array.isArray(sigintData.communications)) {
      sigintData.communications.forEach((comm: any, index: number) => {
        if (!comm.source || !comm.destination) return;
        
        transmissionPaths.push({
          id: `comms-${index}`,
          type: comm.type || 'data-link',
          source: [comm.source.latitude, comm.source.longitude],
          destination: [comm.destination.latitude, comm.destination.longitude],
          strength: comm.signalStrength || 'medium',
          encryption: comm.encrypted || false,
          bandwidth: comm.bandwidth,
          confidence: comm.confidence || 'medium'
        });
      });
    }
    
    return transmissionPaths;
  }
  
  /**
   * Processes EOB data to extract military units and deployments
   * @param sigintData The raw SIGINT analysis data
   * @returns Processed EOB data for mapping
   */
  export const processElectronicOrderOfBattle = (sigintData: any) => {
    if (!sigintData || !sigintData.electronicOrderOfBattle) {
      return {
        airDefense: [],
        groundForces: [],
        navalForces: [],
        airForces: [],
        unknown: []
      };
    }
    
    const eob = sigintData.electronicOrderOfBattle;
    
    // Process air defense elements
    const airDefense = (eob.airDefenseElements || []).map((element: any) => {
      if (!element.location) return null;
      
      // Fix for truncated coordinates if needed
      let lat = element.location.latitude;
      const lng = element.location.longitude;
      
      if (lat < 10 && lng > 30 && lng < 41) {
        lat = 40 + lat;
      }
      
      return {
        id: element.id || `air-defense-${Math.random().toString(36).substring(2, 11)}`,
        name: element.systemName || 'Unknown Air Defense',
        type: element.type || 'sam',
        coordinates: { lat, lng },
        range: getSystemRange(element.systemName, element.type),
        quantity: element.quantity || 1,
        confidence: element.confidence || 'medium',
        lastUpdated: element.lastUpdated || new Date().toISOString()
      };
    }).filter(Boolean);
    
    // Process ground force elements
    const groundForces = (eob.groundForceElements || []).map((element: any) => {
      if (!element.location) return null;
      
      // Fix for truncated coordinates if needed
      let lat = element.location.latitude;
      const lng = element.location.longitude;
      
      if (lat < 10 && lng > 30 && lng < 41) {
        lat = 40 + lat;
      }
      
      return {
        id: element.id || `ground-${Math.random().toString(36).substring(2, 11)}`,
        name: element.unitName || 'Unknown Ground Unit',
        type: element.unitType || 'mechanized',
        echelon: element.echelonSize || 'unknown',
        equipment: element.equipmentType || 'unknown',
        coordinates: { lat, lng },
        confidence: element.confidence || 'medium',
        lastUpdated: element.lastUpdated || new Date().toISOString()
      };
    }).filter(Boolean);
    
    // Process naval force elements
    const navalForces = (eob.navalElements || []).map((element: any) => {
      if (!element.location) return null;
      
      // Fix for truncated coordinates if needed
      let lat = element.location.latitude;
      const lng = element.location.longitude;
      
      if (lat < 10 && lng > 30 && lng < 41) {
        lat = 40 + lat;
      }
      
      return {
        id: element.id || `naval-${Math.random().toString(36).substring(2, 11)}`,
        name: element.vesselName || 'Unknown Vessel',
        type: element.type || 'surface',
        class: element.class || 'unknown',
        coordinates: { lat, lng },
        heading: element.heading,
        speed: element.speed,
        confidence: element.confidence || 'medium',
        lastUpdated: element.lastUpdated || new Date().toISOString()
      };
    }).filter(Boolean);
    
    // Process air force elements
    const airForces = (eob.airElements || []).map((element: any) => {
      if (!element.location) return null;
      
      // Fix for truncated coordinates if needed
      let lat = element.location.latitude;
      const lng = element.location.longitude;
      
      if (lat < 10 && lng > 30 && lng < 41) {
        lat = 40 + lat;
      }
      
      return {
        id: element.id || `air-${Math.random().toString(36).substring(2, 11)}`,
        platform: element.platformType || 'Unknown Aircraft',
        type: element.type || 'fixed-wing',
        mission: element.mission || 'unknown',
        quantity: element.quantity || 1,
        coordinates: { lat, lng },
        altitude: element.altitude,
        heading: element.heading,
        speed: element.speed,
        confidence: element.confidence || 'medium',
        lastUpdated: element.lastUpdated || new Date().toISOString()
      };
    }).filter(Boolean);
    
    // Process unknown elements
    const unknown = (eob.unknownElements || []).map((element: any) => {
      if (!element.location) return null;
      
      // Fix for truncated coordinates if needed
      let lat = element.location.latitude;
      const lng = element.location.longitude;
      
      if (lat < 10 && lng > 30 && lng < 41) {
        lat = 40 + lat;
      }
      
      return {
        id: element.id || `unknown-${Math.random().toString(36).substring(2, 11)}`,
        signatureType: element.signatureType || 'Unknown',
        coordinates: { lat, lng },
        firstDetected: element.firstDetected,
        confidence: element.confidence || 'low',
        lastUpdated: element.lastUpdated || new Date().toISOString()
      };
    }).filter(Boolean);
    
    return {
      airDefense,
      groundForces,
      navalForces,
      airForces,
      unknown
    };
  };