// services/claudeService.js
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_API_KEY } from "../../config.js";
import { logger } from '../api/logger/logger.js';

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

class CircuitBreaker {
  constructor() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 60000;
    this.lastFailureTime = null;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF-OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF-OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold || this.state === 'HALF-OPEN') {
      this.state = 'OPEN';
      logger.warn('Circuit breaker OPENED for Claude API', {
        failureCount: this.failureCount,
        lastFailureTime: new Date(this.lastFailureTime).toISOString()
      });
    }
  }
  
  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    logger.info('Circuit breaker RESET for Claude API');
  }
}

const claudeCircuitBreaker = new CircuitBreaker();

export const callClaudeAPI = async (prompt, model) => {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key is not set. Please check your environment variables.');
  }

  try {
    return await claudeCircuitBreaker.execute(async () => {
    logger.info('Calling Claude API with:', {
      modelName: model,
      promptLength: prompt.length
    });

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4096,
      system: 'You are an expert business analyst specializing in extracting actionable sales intelligence from company websites.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content.reduce((acc, block) => {
      if (block.type === 'text') {
        return acc + block.text;
      }
      return acc;
    }, '').trim();

    logger.info('Claude response:', { content });

    return { content };
  });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Claude API call failed:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`API call failed: ${errorMessage}`);
  }
};