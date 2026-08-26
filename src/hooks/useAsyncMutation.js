import { useState, useCallback, useRef } from 'react';
import { cacheManager } from '../utils/cacheManager';

/**
 * Custom hook to safely execute asynchronous mutations (orders, payments, edits, deletes)
 * Prevents double-submissions, manages loading spinners, handles errors, and invalidates caches.
 * 
 * @param {Function} mutationFn - Async function performing the mutation
 * @param {Object} [options]
 * @param {string|string[]} [options.invalidateKeys] - Cache keys to invalidate upon success
 * @param {Function} [options.onSuccess] - Callback when mutation succeeds
 * @param {Function} [options.onError] - Callback when mutation errors
 * @param {Function} [options.showToast] - Optional toast notifier
 * @returns {{ mutate: Function, mutateAsync: Function, isPending: boolean, error: any, data: any, reset: Function }}
 */
export const useAsyncMutation = (mutationFn, options = {}) => {
  const {
    invalidateKeys,
    onSuccess,
    onError,
    showToast
  } = options;

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Mutex lock to prevent duplicate concurrent triggers (double-click protection)
  const isExecutingRef = useRef(false);

  const reset = useCallback(() => {
    setIsPending(false);
    setError(null);
    setData(null);
    isExecutingRef.current = false;
  }, []);

  const mutateAsync = useCallback(async (...args) => {
    // Prevent double-submissions if already in-flight
    if (isExecutingRef.current) {
      console.warn('Mutation already in progress. Ignoring duplicate trigger.');
      return;
    }

    isExecutingRef.current = true;
    setIsPending(true);
    setError(null);

    try {
      const result = await mutationFn(...args);
      setData(result);

      // Invalidate relevant cache keys
      if (invalidateKeys) {
        cacheManager.invalidate(invalidateKeys, result);
      }

      if (onSuccess) {
        onSuccess(result, ...args);
      }

      return result;
    } catch (err) {
      const formattedError = err?.message || 'An unexpected error occurred. Please try again.';
      setError(formattedError);

      if (onError) {
        onError(err, ...args);
      }

      if (showToast) {
        showToast(`⚠️ ${formattedError}`, 'danger');
      }

      throw err;
    } finally {
      setIsPending(false);
      isExecutingRef.current = false;
    }
  }, [mutationFn, invalidateKeys, onSuccess, onError, showToast]);

  const mutate = useCallback((...args) => {
    mutateAsync(...args).catch((err) => {
      console.error('Unhandled mutation error:', err);
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isPending,
    error,
    data,
    reset
  };
};
