import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced search with automatic AbortController cancellation
 * Cancels obsolete in-flight search requests when the user continues typing.
 * 
 * @param {string} query - The search query input
 * @param {Function} asyncSearchFn - (query: string, signal: AbortSignal) => Promise<any[]>
 * @param {Object} [options]
 * @param {number} [options.delay=300] - Debounce delay in ms
 * @param {any[]} [options.initialResults=[]] - Initial items
 * @returns {{ results: any[], isSearching: boolean, searchError: any, cancel: Function }}
 */
export const useDebouncedSearch = (query, asyncSearchFn, options = {}) => {
  const { delay = 300, initialResults = [] } = options;

  const [results, setResults] = useState(initialResults);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Abort prior search request if still active
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query || !query.trim()) {
      setIsSearching(false);
      setSearchError(null);
      setResults(initialResults);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await asyncSearchFn(query.trim(), controller.signal);
        // Only update if not aborted
        if (!controller.signal.aborted) {
          setResults(Array.isArray(data) ? data : []);
          setIsSearching(false);
        }
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          // Request was cancelled intentionally, do nothing
          return;
        }
        setSearchError(err?.message || 'Failed to complete search query.');
        setIsSearching(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delay]);

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSearching(false);
    }
  };

  return {
    results,
    isSearching,
    searchError,
    cancel
  };
};
