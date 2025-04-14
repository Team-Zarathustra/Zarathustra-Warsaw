// utils/errorHandling.js
import { logger } from '../../../api/logger/logger.js';

/**
 * Custom error class for extraction-related errors
 */
export class ExtractionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ExtractionError';
    this.details = details;
  }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Array} args - Arguments to pass to the function
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - The function result
 */
export async function withRetry(fn, args = [], options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    context = 'Unknown operation'
  } = options;
  
  let attempt = 0;
  
  while (true) {
    try {
      return await fn(...args);
    } catch (error) {
      attempt++;
      
      if (attempt > maxRetries) {
        logger.error(`Max retries (${maxRetries}) reached for ${context}`, { 
          error: error.message, 
          attempt,
          context
        });
        
        throw new ExtractionError(`Failed after ${maxRetries} retries: ${error.message}`, {
          originalError: error,
          attempts: attempt,
          context
        });
      }
      
      // Calculate delay with exponential backoff and some jitter
      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt - 1) * (0.75 + Math.random() * 0.5),
        maxDelay
      );
      
      logger.info(`Retrying ${context} (attempt ${attempt} of ${maxRetries}) after ${delay}ms delay`, {
        error: error.message,
        attempt,
        delay,
        context
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Safely executes a function and handles errors
 * @param {Function} fn - The function to execute
 * @param {Array} args - Arguments to pass to the function
 * @param {Object} options - Error handling options
 * @returns {Promise<Object>} - Result with success flag
 */
export async function safeExecute(fn, args = [], options = {}) {
  const {
    context = 'Unknown operation',
    fallback = null,
    logLevel = 'error'
  } = options;
  
  try {
    const result = await fn(...args);
    return { success: true, result };
  } catch (error) {
    // Log the error with the appropriate level
    if (logLevel === 'warn') {
      logger.warn(`Error during ${context}`, { error: error.message });
    } else if (logLevel === 'info') {
      logger.info(`Error during ${context}`, { error: error.message });
    } else {
      logger.error(`Error during ${context}`, { 
        error: error.message,
        stack: error.stack,
        context,
        args: JSON.stringify(args).substring(0, 200)
      });
    }
    
    return { 
      success: false, 
      error: error.message,
      fallback,
      context
    };
  }
}