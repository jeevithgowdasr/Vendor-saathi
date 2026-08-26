import { useState, useMemo, useEffect } from 'react';

/**
 * Custom hook for client-side pagination with automatic page reset upon filter/search changes.
 * 
 * @param {any[]} items - Full array of items to paginate
 * @param {Object} [options]
 * @param {number} [options.pageSize=6] - Number of items per page
 * @param {number} [options.initialPage=1] - Starting page number
 * @param {any[]} [options.resetDependencies=[]] - Array of values (search, filter, category) that trigger page reset to 1
 * @returns {{
 *   currentPage: number,
 *   pageSize: number,
 *   totalPages: number,
 *   totalItems: number,
 *   paginatedItems: any[],
 *   startIndex: number,
 *   endIndex: number,
 *   hasPrevPage: boolean,
 *   hasNextPage: boolean,
 *   goToPage: (page: number) => void,
 *   nextPage: () => void,
 *   prevPage: () => void,
 *   resetPage: () => void
 * }}
 */
export const usePagination = (items = [], options = {}) => {
  const {
    pageSize = 6,
    initialPage = 1,
    resetDependencies = []
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Automatically reset to Page 1 when search filters, categories, or dependencies change
  useEffect(() => {
    setCurrentPage(1);
  }, resetDependencies);

  // Ensure current page does not exceed totalPages when list shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    return safeItems.slice(startIndex, endIndex);
  }, [safeItems, startIndex, endIndex]);

  const goToPage = (page) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    goToPage,
    nextPage,
    prevPage,
    resetPage
  };
};
