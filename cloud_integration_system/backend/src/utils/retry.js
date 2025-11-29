/**
 * Retry Utility
 * Implements exponential backoff retry logic
 */

const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    baseDelay = parseInt(process.env.RETRY_DELAY_MS) || 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    shouldRetry = (error) => true
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`, {
        error: error.message,
        attempt
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with jitter (adds randomness to prevent thundering herd)
 */
async function retryWithJitter(fn, options = {}) {
  return retryWithBackoff(fn, {
    ...options,
    baseDelay: (options.baseDelay || 1000) * (0.5 + Math.random())
  });
}

module.exports = {
  retryWithBackoff,
  retryWithJitter,
  sleep
};
