import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = true,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async (fn: () => Promise<void>) => {
    if (retryCount >= maxAttempts) {
      return false;
    }

    try {
      setIsRetrying(true);

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff
        ? delayMs * Math.pow(2, retryCount)
        : delayMs;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Execute the function
      await fn();

      // Reset if successful
      setRetryCount(0);
      setIsRetrying(false);
      return true;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
      throw error;
    }
  }, [retryCount, maxAttempts, delayMs, exponentialBackoff]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxAttempts,
  };
}
