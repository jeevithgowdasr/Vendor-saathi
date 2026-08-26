/**
 * Client Cache & Invalidation Manager
 * Coordinates reactive invalidation and state synchronization across views and windows.
 */

export const CACHE_KEYS = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  VENDORS: 'vendors',
  USER_PROFILE: 'user_profile',
  CART: 'cart',
  WISHLIST: 'wishlist',
  NOTIFICATIONS: 'notifications'
};

class CacheManager {
  constructor() {
    this.listeners = new Map(); // key -> Set<callback>
    this.cacheStore = new Map(); // key -> { data, timestamp }
    this.initCrossTabSync();
  }

  initCrossTabSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('vendorsaathi_cache_inv_')) {
          const cacheKey = e.key.replace('vendorsaathi_cache_inv_', '');
          this.notifyListeners(cacheKey, { isCrossTab: true });
        }
      });
    }
  }

  /**
   * Subscribe a component or hook to cache invalidations
   * @param {string} key - Cache key from CACHE_KEYS
   * @param {Function} callback - Callback invoked upon invalidation
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Invalidate a cache key to trigger immediate refetch/refresh across subscribers
   * @param {string|string[]} keys - One or more cache keys
   * @param {any} [freshData] - Optional updated data to seed the cache with
   */
  invalidate(keys, freshData = null) {
    const keyList = Array.isArray(keys) ? keys : [keys];

    keyList.forEach(key => {
      if (freshData !== null) {
        this.cacheStore.set(key, { data: freshData, timestamp: Date.now() });
      } else {
        this.cacheStore.delete(key);
      }

      this.notifyListeners(key, { freshData });

      // Broadcast invalidation across tabs/windows via localStorage trigger
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`vendorsaathi_cache_inv_${key}`, JSON.stringify({ timestamp: Date.now() }));
        }
      } catch (err) {
        console.warn('Cache cross-tab broadcast note:', err);
      }
    });
  }

  notifyListeners(key, payload = {}) {
    const set = this.listeners.get(key);
    if (set) {
      set.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in cache listener for key "${key}":`, err);
        }
      });
    }
  }

  get(key) {
    const entry = this.cacheStore.get(key);
    return entry ? entry.data : null;
  }

  set(key, data) {
    this.cacheStore.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cacheStore.clear();
  }
}

export const cacheManager = new CacheManager();
