import { createBaseSystemPrompt, createResponseFormatInstruction } from './basePrompt.js';

/**
 * Creates a targeted extraction prompt for military field reports
 * @param {string} reportText - Raw text of the field report
 * @param {string} extractionType - Type of intelligence to extract
 * @param {Object} options - Additional options
 * @returns {string} - Formatted prompt for AI model
 */
export function createMilitaryExtractionPrompt(reportText, extractionType, options = {}) {
  // Get base system prompt
  const systemPrompt = createBaseSystemPrompt(options.language);
  
  // Create specific extraction instructions based on type
  let extractionInstructions = '';
  let responseFormat = '';
  
  switch (extractionType) {
    case 'tacticalObservations':
      extractionInstructions = `Extract all tactical observations from this field report. Look for:
- Enemy forces movements, positions, and activities
- Friendly forces positions and activities (if mentioned)
- Vehicle and equipment sightings with types, quantities, and conditions
- Tactical actions like ambushes, engagements, or patrols
- Terrain conditions that impact military operations
- Visibility conditions and weather impacting operations`;
      
      responseFormat = `{
  "tacticalObservations": {
    "observations": [
      {
        "text": "Full text of the observation",
        "category": "movement|position|engagement|equipment|terrain|weather",
        "entities": {
          "force": "enemy|friendly|civilian|unknown",
          "size": "number of personnel or vehicles if mentioned",
          "equipment": "types of equipment observed",
          "status": "active|damaged|destroyed|withdrawing|advancing"
        },
        "location": {
          "coordinates": ["latitude", "longitude"],
          "name": "location name or description",
          "accuracy": "precise|approximate|unknown"
        },
        "time": "ISO timestamp or time description",
        "confidence": "high|medium|low"
      }
    ],
    "summary": "Brief summary of key tactical observations",
    "confidence": "high|medium|low"
  }
}`;
      break;
      
    case 'threats':
      extractionInstructions = `Extract information about threats mentioned in this field report. Look for:
- Current or potential enemy threats
- Observed or suspected weapons systems
- Ambush or attack risks
- IEDs or mines
- Indirect fire threats (artillery, mortars)
- Air threats
- CBRN (Chemical, Biological, Radiological, Nuclear) threats
- Electronic warfare or cyber threats`;
      
      responseFormat = `{
  "threats": {
    "identified": [
      {
        "description": "Description of the threat",
        "category": "kinetic|explosive|indirect|air|cbrn|electronic|cyber|ambush",
        "severity": "high|medium|low",
        "immediacy": "immediate|near-term|potential",
        "location": {
          "coordinates": ["latitude", "longitude"],
          "name": "location name",
          "accuracy": "precise|approximate|unknown"
        },
        "time": "ISO timestamp or time description",
        "affectedUnits": ["units affected by this threat"],
        "confidence": "high|medium|low"
      }
    ],
    "summary": "Brief summary of key threats",
    "confidence": "high|medium|low"
  }
}`;
      break;
      
    case 'resources':
      extractionInstructions = `Extract information about military resources mentioned in this field report. Look for:
- Friendly force equipment status
- Supply levels (ammunition, fuel, food, water)
- Medical resources and casualties
- Vehicle and equipment maintenance needs
- Resource requests or shortages
- Available support assets (air, artillery, etc.)`;
      
      responseFormat = `{
  "resources": {
    "status": [
      {
        "category": "equipment|supplies|personnel|medical|support",
        "item": "specific resource mentioned",
        "quantity": "amount mentioned",
        "condition": "operational|limited|critical|depleted",
        "location": "where these resources are located",
        "notes": "additional resource information",
        "confidence": "high|medium|low"
      }
    ],
    "shortages": ["specific resources in short supply"],
    "requests": ["specific resource requests mentioned"],
    "confidence": "high|medium|low"
  }
}`;
      break;
      
    case 'civilianStatus':
      extractionInstructions = `Extract information about civilian status and humanitarian situation. Look for:
- Civilian population movements or displacements
- Humanitarian needs or concerns
- Civilian casualties or injuries
- Infrastructure damage affecting civilians
- Civil-military interactions
- Civilian sentiment towards military forces`;
      
      responseFormat = `{
  "civilianStatus": {
    "populations": [
      {
        "description": "description of civilian group or situation",
        "size": "estimated number if mentioned",
        "location": "location of this civilian population",
        "status": "stable|displaced|returning|at-risk",
        "needs": ["specific humanitarian needs mentioned"],
        "confidence": "high|medium|low"
      }
    ],
    "infrastructure": [
      {
        "type": "type of civilian infrastructure",
        "status": "operational|damaged|destroyed|limited",
        "location": "location of this infrastructure",
        "impact": "description of impact on civilian population",
        "confidence": "high|medium|low"
      }
    ],
    "sentiment": "description of civilian sentiment if mentioned",
    "confidence": "high|medium|low"
  }
}`;
      break;
      
    case 'geospatialInformation':
      extractionInstructions = `Extract all geospatial information from this field report. Look for:
- Specific locations mentioned with coordinates if available
- Routes and movement corridors
- Terrain features impacting mobility or operations
- Control zones and boundaries
- Key landmarks and reference points
- Areas of operation or interest`;
      
      responseFormat = `{
  "geospatialInformation": {
    "locations": [
      {
        "name": "location name",
        "coordinates": ["latitude", "longitude"],
        "type": "position|area|route|terrain-feature|boundary|landmark",
        "description": "description of this location",
        "controllingForce": "force controlling this location if mentioned",
        "timeObserved": "when this location was observed",
        "confidence": "high|medium|low"
      }
    ],
    "routes": [
      {
        "start": "starting point",
        "end": "ending point",
        "waypoints": ["intermediate points on the route"],
        "status": "open|contested|blocked|unknown",
        "confidence": "high|medium|low"
      }
    ],
    "controlZones": [
      {
        "name": "zone name or description",
        "controllingForce": "force controlling this zone",
        "boundaries": "description of the zone boundaries",
        "confidence": "high|medium|low"
      }
    ],
    "confidence": "high|medium|low"
  }
}`;
      break;
      
    case 'communicationsElectronic':
      extractionInstructions = `Extract information about communications and electronic warfare activities. Look for:
- Communication system status
- Electronic warfare activities (jamming, interference)
- Signals intelligence information
- Communication challenges or failures
- Enemy communications observed
- Cyber activities or threats`;
      
      responseFormat = `{
  "communicationsElectronic": {
    "status": {
      "description": "overall communications status",
      "operational": boolean,
      "limitations": ["specific communication limitations"],
      "confidence": "high|medium|low"
    },
    "incidents": [
      {
        "type": "jamming|interference|interception|cyber|other",
        "description": "description of the incident",
        "system": "affected system",
        "time": "when it occurred",
        "duration": "how long it lasted",
        "impact": "operational impact of this incident",
        "suspectedSource": "suspected source if mentioned",
        "confidence": "high|medium|low"
      }
    ],
    "enemyCommunications": [
      {
        "description": "description of observed enemy communications",
        "method": "communication method used",
        "content": "content if mentioned",
        "confidence": "high|medium|low"
      }
    ],
    "confidence": "high|medium|low"
  }
}`;
      break;
      
    case 'reliability':
      extractionInstructions = `Assess the reliability of information in this field report. Look for:
- Indicators of firsthand versus secondhand information
- Confidence markers and qualifying language
- Contradictions or inconsistencies
- Specificity of details (timestamps, coordinates, unit designations)
- Source attributions
- Uncertainty indicators (possibly, reportedly, etc.)
- Wording that suggests speculation versus observation`;
      
      responseFormat = `{
  "reliability": {
    "assessment": {
      "overallReliability": "high|medium|low",
      "factors": {
        "hasFirsthandObservations": boolean,
        "containsUncertainLanguage": boolean,
        "includesSourceAttribution": boolean,
        "containsSpecificDetails": boolean,
        "hasConflictingInformation": boolean
      },
      "confidence": "high|medium|low"
    },
    "firsthandObservations": [
      {"text": "quoted text from report", "indicator": "language indicating firsthand observation"}
    ],
    "secondhandInformation": [
      {"text": "quoted text from report", "source": "attributed source if mentioned"}
    ],
    "uncertainInformation": [
      {"text": "quoted text from report", "indicator": "uncertainty indicator used"}
    ],
    "conflictingInformation": [
      {
        "statement1": "first conflicting statement",
        "statement2": "second conflicting statement",
        "conflict": "nature of the conflict"
      }
    ]
  }
}`;
      break;
      
    case 'urgentIntelligence':
      extractionInstructions = `Extract the most urgent and time-sensitive intelligence from this field report. Focus on imminent threats, critical developments, and high-priority information that would require immediate attention or action. Look for:
- Imminent attacks or threats
- Significant enemy movements
- Critical discoveries
- Emergency situations
- Time-sensitive opportunities
- Information explicitly marked as urgent`;
      
      responseFormat = `{
  "urgentIntelligence": {
    "items": [
      {
        "description": "description of the urgent intelligence item",
        "category": "threat|movement|discovery|opportunity|emergency",
        "timeframe": "immediate|hours|day",
        "location": "location information if available",
        "recommendedAction": "implied or stated action needed",
        "confidence": "high|medium|low"
      }
    ],
    "priority": "critical|high|medium|low",
    "confidence": "high|medium|low"
  }
}`;
      break;
      
    default:
      // Generic extraction as fallback
      extractionInstructions = `Extract information related to ${extractionType} from this field report.`;
      responseFormat = `{
  "${extractionType}": {
    "data": "extracted information",
    "confidence": "high|medium|low"
  }
}`;
  }
  
  // Add report metadata context if available
  const reportMetadata = options.reportMetadata || {};
  const metadataContext = Object.keys(reportMetadata).length > 0 ? 
    `\nREPORT METADATA:
Report ID: ${reportMetadata.reportId || 'Unknown'}
Source Type: ${reportMetadata.type || 'Field Report'}
Timestamp: ${reportMetadata.timestamp || 'Unknown'}
Reporting Unit: ${reportMetadata.unitId || 'Unknown'}` : '';
  
  // Create response format instruction
  const formatInstruction = createResponseFormatInstruction(responseFormat);
  
  // Combine all components into final prompt
  return `${systemPrompt}

EXTRACTION TASK:
${extractionInstructions}
${formatInstruction}${metadataContext}

FIELD REPORT:
${reportText}`;
}

/**
 * Creates a comprehensive unified extraction prompt for all intelligence aspects
 * @param {string|Object} reportContent - Raw text or preprocessed report content
 * @param {string} reportId - Unique identifier for the report
 * @param {string} context - Additional context information
 * @param {string} language - Report language
 * @returns {string} - Complete prompt for AI model
 */
export function createUnifiedMilitaryPrompt(reportContent, reportId, context = '', language = 'en') {
  // Get base system prompt
  const systemPrompt = createBaseSystemPrompt(language);
  
  // Format report content as text
  const reportText = typeof reportContent === 'string' ? 
    reportContent : reportContent.rawTextContent || JSON.stringify(reportContent);
  
  // Create context section if provided
  const contextInfo = context ? `
ADDITIONAL CONTEXT:
${context}

Based on this context, focus particularly on information that relates to the situation described above.
` : '';

  // Define the JSON response format for comprehensive extraction
  const responseFormat = `{
  "reportAnalysis": {
    "summary": "Brief summary of the key points in the report",
    "reportingQuality": "high|medium|low",
    "reliability": "high|medium|low",
    "informationTimeliness": "current|recent|outdated"
  },
  
  "tacticalSituation": {
    "enemyForces": [
      {
        "type": "Force type (infantry, armor, artillery, etc.)",
        "size": "Estimated size or quantity",
        "location": "Location description",
        "activity": "What they are doing",
        "coordinates": "Coordinates if available",
        "time": "Time of observation",
        "confidence": "high|medium|low"
      }
    ],
    "friendlyForces": [
      {
        "type": "Force type",
        "activity": "What friendly forces are doing (if mentioned)",
        "confidence": "high|medium|low"
      }
    ]
  },
  
  "threats": [
    {
      "description": "Description of threat",
      "type": "Type of threat",
      "severity": "high|medium|low",
      "location": "Location of threat",
      "confidence": "high|medium|low"
    }
  ],
  
  "geospatialInformation": {
    "locations": [
      {
        "name": "Location name",
        "coordinates": "Coordinates if available",
        "description": "Description of the location",
        "relatedActivity": "Activity occurring at this location",
        "confidence": "high|medium|low"
      }
    ],
    "controlZones": [
      {
        "area": "Area description",
        "controllingForce": "Force controlling this area",
        "confidence": "high|medium|low"
      }
    ]
  },
  
  "civilianSituation": {
    "populationStatus": "Status of civilian population if mentioned",
    "displacementActivity": "Any civilian movement mentioned",
    "humanitarianConcerns": ["List of humanitarian issues mentioned"],
    "civilianInfrastructure": [
      {
        "type": "Type of infrastructure",
        "status": "operational|damaged|destroyed",
        "impact": "Impact on civilian population",
        "confidence": "high|medium|low"
      }
    ],
    "confidence": "high|medium|low"
  },
  
  "resourceStatus": {
    "personnel": {
      "status": "Status of personnel if mentioned",
      "casualties": "Any casualties mentioned",
      "confidence": "high|medium|low"
    },
    "equipment": [
      {
        "type": "Type of equipment",
        "status": "operational|limited|damaged|destroyed",
        "quantity": "Quantity if mentioned",
        "confidence": "high|medium|low"
      }
    ],
    "supplies": {
      "status": "Overall supply status",
      "shortages": ["List of supply shortages mentioned"],
      "confidence": "high|medium|low"
    }
  },
  
  "keyIntelligence": [
    {
      "item": "Key intelligence item",
      "category": "Categorization of this intelligence",
      "importance": "high|medium|low",
      "urgency": "immediate|near-term|routine",
      "confidence": "high|medium|low"
    }
  ],
  
  "reliability": {
    "firsthandObservations": ["List of statements that are firsthand observations"],
    "secondhandInformation": ["List of statements that are secondhand reports"],
    "uncertainInformation": ["List of statements with uncertainty indicators"],
    "overallAssessment": "high|medium|low"
  }
}`;

  // Create the complete prompt
  return `${systemPrompt}
  
${contextInfo}
  
Based only on the provided field report, extract military intelligence into the following structured format:
  
${responseFormat}
  
FIELD REPORT:
${reportText}
  
Remember: Return ONLY valid JSON with no additional text before or after. Ensure your extraction reflects only what is stated or strongly implied in the report. Do not add interpretations or assumptions.`;
}