import { logger } from '../../../api/logger/logger.js';

/**
 * Classify radar emitter types based on signal characteristics
 * @param {Object} characteristics - Emitter characteristics
 * @returns {Object} - Classification results with confidence
 */
export function classifyEmitter(characteristics) {
  try {
    // Require frequency info at minimum
    if (!characteristics || !characteristics.frequency || 
        !characteristics.frequency.min || !characteristics.frequency.max) {
      return {
        classification: 'unknown',
        confidence: 'low',
        platformType: 'unknown',
        possibleModels: []
      };
    }
    
    // Calculate mid frequency for classification
    const midFreq = (characteristics.frequency.min + characteristics.frequency.max) / 2;
    
    // Define radar bands with their typical uses
    const radarBands = [
      { name: 'VHF', min: 30, max: 300, type: 'early-warning-radar' },
      { name: 'UHF', min: 300, max: 1000, type: 'early-warning-radar' },
      { name: 'L', min: 1000, max: 2000, type: 'long-range-surveillance' },
      { name: 'S', min: 2000, max: 4000, type: 'surveillance-radar' },
      { name: 'C', min: 4000, max: 8000, type: 'tracking-radar' },
      { name: 'X', min: 8000, max: 12000, type: 'fire-control-radar' },
      { name: 'Ku', min: 12000, max: 18000, type: 'high-resolution-radar' },
      { name: 'K', min: 18000, max: 27000, type: 'weather-radar' },
      { name: 'Ka', min: 27000, max: 40000, type: 'airport-surveillance' }
    ];
    
    // Find the radar band
    const band = radarBands.find(band => midFreq >= band.min && midFreq <= band.max);
    
    // If no band match, return unknown
    if (!band) {
      // Handle communication frequencies
      if (midFreq < 30) {
        return {
          classification: 'hf-communications',
          confidence: 'medium',
          platformType: 'communications',
          possibleModels: ['HF Radio Network']
        };
      }
      
      return {
        classification: 'unknown',
        confidence: 'low',
        platformType: 'unknown',
        possibleModels: []
      };
    }
    
    // Start with the band's basic classification
    let classification = band.type;
    let confidence = 'medium';
    let platformType = 'radar';
    let possibleModels = [];
    
    // Refine classification based on other parameters
    // VHF Band - Early Warning Radars
    if (band.name === 'VHF') {
      possibleModels = ['P-18 Spoon Rest', 'P-12 Spoon Rest'];
      platformType = 'ground-based';
      
      // Check for pulse characteristics specific to P-18
      if (characteristics.pulse && 
          characteristics.pulse.repetitionFrequency > 250 && 
          characteristics.pulse.repetitionFrequency < 350) {
        possibleModels = ['P-18 Spoon Rest'];
        confidence = 'high';
      }
    }
    // L Band - Long Range Surveillance
    else if (band.name === 'L') {
      possibleModels = ['P-37 Bar Lock', '96L6E'];
      platformType = 'ground-based';
      
      if (characteristics.frequency.agility === 'high') {
        classification = 'phased-array-radar';
        possibleModels = ['96L6E'];
        confidence = 'high';
      }
    }
    // S Band - Surveillance Radars
    else if (band.name === 'S') {
      possibleModels = ['S-300 Tin Shield', 'SNAR-10', 'P-19 Flat Face'];
      
      // Check for ground surveillance
      if (characteristics.pulse && characteristics.pulse.width < 2) {
        classification = 'ground-surveillance-radar';
        possibleModels = ['SNAR-10', 'PSNR-5'];
        platformType = 'mobile';
      }
    }
    // X Band - Fire Control & Targeting
    else if (band.name === 'X') {
      classification = 'fire-control-radar';
      possibleModels = ['9S35 Fire Dome', '1L219 Zoopark-1', '9S32 Grill Pan'];
      platformType = 'mobile';
      
      // Check for counter-battery radar
      if (characteristics.pulse && 
          characteristics.pulse.repetitionFrequency > 1000 &&
          characteristics.frequency.agility === 'high') {
        classification = 'counter-battery-radar';
        possibleModels = ['1L219 Zoopark-1', 'SNAR-10'];
        confidence = 'high';
      }
    }
    
    // Special handling for communications
    if (midFreq < 1000 && midFreq > 30) {
      // VHF/UHF frequencies are often used for communications
      if (characteristics.modulation && 
          (characteristics.modulation.includes('FM') || 
           characteristics.modulation.includes('AM'))) {
        classification = midFreq < 300 ? 'vhf-tactical-communications' : 'uhf-tactical-communications';
        platformType = 'communications';
        possibleModels = midFreq < 300 ? ['R-123M', 'R-111'] : ['R-168', 'R-159'];
        confidence = 'medium';
      }
    }
    
    return {
      classification,
      confidence,
      platformType,
      possibleModels
    };
  } catch (error) {
    logger.error('Error in emitter classification', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      classification: 'unknown',
      confidence: 'low',
      platformType: 'unknown',
      possibleModels: []
    };
  }
}

/**
 * Determine if signals likely belong to the same emitter
 * @param {Object} emitterA - First emitter characteristics
 * @param {Object} emitterB - Second emitter characteristics
 * @returns {Object} - Match assessment with score and confidence
 */
export function assessEmitterMatch(emitterA, emitterB) {
  try {
    // Require basic frequency info
    if (!emitterA?.frequency || !emitterB?.frequency ||
        !emitterA.frequency.min || !emitterB.frequency.min) {
      return { 
        match: false, 
        score: 0, 
        confidence: 'low',
        reason: 'Insufficient frequency data'
      };
    }
    
    // Calculate scores for different characteristics
    let scores = {};
    
    // Frequency match (most important)
    const freqOverlap = calculateFrequencyOverlap(
      emitterA.frequency.min, emitterA.frequency.max,
      emitterB.frequency.min, emitterB.frequency.max
    );
    scores.frequency = freqOverlap;
    
    // Pulse characteristics match
    if (emitterA.pulse && emitterB.pulse) {
      // Pulse width match
      if (emitterA.pulse.width && emitterB.pulse.width) {
        const pulseWidthDiff = Math.abs(emitterA.pulse.width - emitterB.pulse.width);
        const avgWidth = (emitterA.pulse.width + emitterB.pulse.width) / 2;
        scores.pulseWidth = pulseWidthDiff < (avgWidth * 0.2) ? 0.9 : 
                           pulseWidthDiff < (avgWidth * 0.4) ? 0.6 : 0.2;
      }
      
      // PRF match
      if (emitterA.pulse.repetitionFrequency && emitterB.pulse.repetitionFrequency) {
        const prfDiff = Math.abs(
          emitterA.pulse.repetitionFrequency - emitterB.pulse.repetitionFrequency
        );
        const avgPRF = (emitterA.pulse.repetitionFrequency + emitterB.pulse.repetitionFrequency) / 2;
        scores.prf = prfDiff < (avgPRF * 0.1) ? 0.9 : 
                    prfDiff < (avgPRF * 0.2) ? 0.6 : 0.2;
      }
      
      // Pattern match
      if (emitterA.pulse.patterns && emitterB.pulse.patterns) {
        const patternMatch = emitterA.pulse.patterns.some(p => emitterB.pulse.patterns.includes(p));
        scores.pattern = patternMatch ? 0.9 : 0.2;
      }
    }
    
    // Modulation match
    if (emitterA.modulation && emitterB.modulation) {
      const modMatch = emitterA.modulation.some(m => emitterB.modulation.includes(m));
      scores.modulation = modMatch ? 0.9 : 0.2;
    }
    
    // Calculate overall score with different weights
    const weights = {
      frequency: 0.6,   // Frequency is most important
      pulseWidth: 0.1,
      prf: 0.15,
      pattern: 0.05,
      modulation: 0.1
    };
    
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const [key, score] of Object.entries(scores)) {
      if (score !== undefined) {
        weightedScore += score * (weights[key] || 0);
        totalWeight += weights[key] || 0;
      }
    }
    
    // If we don't have enough data, lower confidence
    const confidence = 
      Object.keys(scores).length >= 3 ? 'high' :
      Object.keys(scores).length >= 2 ? 'medium' : 'low';
    
    // Normalize score
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // Determine match with threshold
    const isMatch = finalScore >= 0.7;
    
    // Generate reason for the assessment
    let reason = isMatch ? 'Characteristics match: ' : 'Insufficient match: ';
    reason += Object.entries(scores)
      .map(([key, score]) => `${key} (${(score*100).toFixed(0)}%)`)
      .join(', ');
    
    return {
      match: isMatch,
      score: finalScore,
      confidence,
      reason
    };
  } catch (error) {
    logger.error('Error in emitter match assessment', {
      error: error.message,
      stack: error.stack
    });
    
    return { 
      match: false, 
      score: 0, 
      confidence: 'low',
      reason: `Error in assessment: ${error.message}`
    };
  }
}

/**
 * Calculate overlap between two frequency ranges
 * @param {number} min1 - Minimum of first range
 * @param {number} max1 - Maximum of first range
 * @param {number} min2 - Minimum of second range
 * @param {number} max2 - Maximum of second range
 * @returns {number} - Overlap score between 0-1
 */
function calculateFrequencyOverlap(min1, max1, min2, max2) {
  // Handle missing values
  if ([min1, max1, min2, max2].some(v => v === undefined || v === null)) {
    return 0;
  }
  
  // Ensure min <= max
  [min1, max1] = min1 <= max1 ? [min1, max1] : [max1, min1];
  [min2, max2] = min2 <= max2 ? [min2, max2] : [max2, min2];
  
  // Calculate overlap
  const overlapStart = Math.max(min1, min2);
  const overlapEnd = Math.min(max1, max2);
  
  if (overlapStart > overlapEnd) {
    // No overlap
    // Calculate how close the ranges are
    const gap = overlapStart - overlapEnd;
    const minWidth = Math.min(max1 - min1, max2 - min2);
    
    // If gap is small relative to the width of the narrower range
    if (gap < minWidth * 0.2) {
      return 0.5; // Close but not overlapping
    }
    return 0;
  }
  
  // Calculate overlap as proportion of the wider range
  const range1 = max1 - min1;
  const range2 = max2 - min2;
  const maxRange = Math.max(range1, range2);
  
  if (maxRange === 0) {
    // Avoid division by zero
    return min1 === min2 ? 1 : 0;
  }
  
  const overlap = overlapEnd - overlapStart;
  return overlap / maxRange;
}