import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value (e.g. search keyword, filter input)
 * @param {any} value - Value to debounce
 * @param {number} [delay=300] - Debounce delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
