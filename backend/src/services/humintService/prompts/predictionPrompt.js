import { createBaseSystemPrompt } from './basePrompt.js';

/**
 * Creates a prompt for AI to enhance prediction explanations
 * @param {Object} prediction - The raw prediction object
 * @param {Object} intelligence - The extracted intelligence
 * @returns {string} - Formatted prompt
 */
export function createPredictionExplanationPrompt(prediction, intelligence) {
  const systemPrompt = createBaseSystemPrompt();
  
  // Format the evidence events
  const evidenceEvents = prediction.evidenceEvents.map((event, index) => 
    `Event ${index + 1}: ${event.description} (${event.type}) at ${event.location || 'unknown location'}`
  ).join('\n');
  
  return `${systemPrompt}

TASK:
Enhance the explanation of the following military prediction based on pattern analysis.

PREDICTION DETAILS:
Type: ${prediction.name}
Timeframe: ${prediction.formattedTimeframe}
Confidence: ${prediction.confidenceFormatted} (${prediction.confidenceLevel})
Pattern: ${prediction.patternName}
Historical instances: ${prediction.historicalInstances}

EVIDENCE EVENTS:
${evidenceEvents}

ADDITIONAL INTELLIGENCE:
Summary: ${intelligence.summary || 'Not available'}

FORMAT YOUR RESPONSE AS FOLLOWS:
1. A brief tactical explanation of why this prediction is likely (3-4 sentences)
2. The key indicators from the evidence that support this prediction
3. Potential tactical implications if this prediction occurs
4. Any factors that might alter the timeframe or probability

Maintain a professional, analytical tone appropriate for military intelligence. Only include information that is supported by the evidence or general military principles.`;
}

/**
 * Creates a prompt for generating alternative predictions
 * @param {Array} predictions - Current predictions
 * @param {Object} intelligence - Extracted intelligence
 * @returns {string} - Formatted prompt
 */
export function createAlternativePredictionsPrompt(predictions, intelligence) {
  const systemPrompt = createBaseSystemPrompt();
  
  // Format current predictions
  const currentPredictions = predictions.slice(0, 3).map((pred, index) => 
    `${index + 1}. ${pred.name} (${pred.confidenceFormatted} confidence, ${pred.formattedTimeframe})`
  ).join('\n');
  
  return `${systemPrompt}

TASK:
Generate 2-3 alternative predictions that might not be captured by pattern analysis.

CURRENT PREDICTIONS:
${currentPredictions}

INTELLIGENCE SUMMARY:
${intelligence.summary || 'Not available'}

Consider potential "black swan" events or non-standard tactics that might not follow typical patterns.

FORMAT YOUR RESPONSE AS JSON:
{
  "alternativePredictions": [
    {
      "name": "Name of the prediction",
      "description": "Detailed description of what might occur",
      "timeframe": "Estimated timeframe",
      "confidence": "low|speculative|possible",
      "rationale": "Brief explanation of why this might occur despite not matching standard patterns"
    }
  ]
}

Focus on plausible alternatives that military planners should consider, not extreme outliers. Base your alternatives on the available intelligence but bring in creative tactical thinking.`;
}