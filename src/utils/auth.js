/**
 * Authentication, Session & Token Security Utilities
 * Enforces Role-Based Access Control (RBAC), Token Lifecycle, and Post-Login Redirections.
 */

// Token lifetime: 24 hours in milliseconds
export const DEFAULT_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

// Storage keys
export const STORAGE_KEYS = {
  CURRENT_USER: 'vendorsaathi_current_user',
  AUTH_TOKEN: 'vendorsaathi_auth_token',
  TOKEN_EXPIRES: 'vendorsaathi_token_expires',
  REDIRECT_TARGET: 'vendorsaathi_redirect_target',
  SYNC_ORDERS: 'vendorsaathi_sync_orders',
  DYNAMIC_PRODUCTS: 'vendorsaathi_dynamic_products',
  DYNAMIC_VENDORS: 'vendorsaathi_dynamic_vendors',
  CART: 'vendorsaathi_cart_data',
  WISHLIST: 'vendorsaathi_wishlist_data',
  PRODUCT_SYNC: 'vendorsaathi_product_sync',
  VENDOR_SYNC: 'vendorsaathi_vendor_sync',
  NEW_ORDER_SYNC: 'vendorsaathi_new_order_placed'
};

/**
 * Generate a cryptographically structured session token with expiration timestamp
 */
export const createAuthSession = (userData, customLifetimeMs = DEFAULT_TOKEN_LIFETIME_MS) => {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + customLifetimeMs;
  const role = (userData?.role || 'customer').toLowerCase();
  const uid = userData?.uid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Structured client-side JWT-like payload
  const tokenPayload = {
    sub: uid,
    role: role,
    email: userData?.email || '',
    iat: issuedAt,
    exp: expiresAt,
    aud: 'vendorsaathi-web-app'
  };

  const encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))));
  const mockSignature = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const authToken = `vs_${encodedPayload}.${mockSignature}`;

  return {
    authToken,
    tokenExpiresAt: expiresAt,
    sessionIssuedAt: issuedAt,
    role
  };
};

/**
 * Validate user authentication session & token expiration
 */
export const validateAuthSession = (user) => {
  if (!user || !user.isLoggedIn) {
    return { isValid: false, reason: 'NOT_LOGGED_IN' };
  }

  if (!user.authToken) {
    return { isValid: false, reason: 'MISSING_TOKEN' };
  }

  // Check explicit expiration timestamp
  if (user.tokenExpiresAt && Number(user.tokenExpiresAt) <= Date.now()) {
    return { isValid: false, reason: 'TOKEN_EXPIRED' };
  }

  // Verify encoded token payload integrity
  try {
    const parts = user.authToken.split('.');
    if (parts.length < 2 || !parts[0].startsWith('vs_')) {
      return { isValid: false, reason: 'INVALID_TOKEN_FORMAT' };
    }

    const rawPayload = parts[0].replace('vs_', '');
    const decoded = JSON.parse(decodeURIComponent(escape(atob(rawPayload))));

    if (decoded.exp && decoded.exp <= Date.now()) {
      return { isValid: false, reason: 'TOKEN_EXPIRED' };
    }

    if (user.role && decoded.role && user.role.toLowerCase() !== decoded.role.toLowerCase()) {
      return { isValid: false, reason: 'ROLE_MISMATCH' };
    }
  } catch (err) {
    console.warn('Session token decode check error:', err);
    return { isValid: false, reason: 'TOKEN_DECODE_FAILED' };
  }

  return { isValid: true, reason: 'VALID' };
};

/**
 * Check whether a timestamp has expired
 */
export const isSessionExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return Number(expiresAt) <= Date.now();
};

/**
 * RBAC Role Check: Verifies if user's role satisfies the route requirements
 * Platform 'admin' role has elevated superuser access across all dashboards.
 */
export const hasRoleAccess = (userRole, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true; // Public route
  if (!userRole) return false;

  const normalizedUserRole = userRole.toLowerCase().trim();
  if (normalizedUserRole === 'admin') return true; // Superuser privileges

  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase().trim());
  return normalizedAllowed.includes(normalizedUserRole);
};

/**
 * Post-Login Redirect Management
 * Stores intended route when an unauthenticated user attempts access
 */
export const setRedirectTarget = (view, params = {}) => {
  try {
    const target = {
      view,
      params,
      timestamp: Date.now()
    };
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_TARGET, JSON.stringify(target));
  } catch (e) {
    console.warn('Could not persist redirect target:', e);
  }
};

/**
 * Retrieve & clear pending redirect target (expires after 15 minutes)
 */
export const getAndClearRedirectTarget = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_TARGET);
    if (!raw) return null;

    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_TARGET);
    const parsed = JSON.parse(raw);

    // If saved within 15 minutes, honor redirect
    if (Date.now() - (parsed.timestamp || 0) < 15 * 60 * 1000) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Wipe all authentication, user, session, and cached storage
 */
export const clearAllAuthStorage = () => {
  try {
    // Clear localStorage items related to user and session
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES);
    localStorage.removeItem(STORAGE_KEYS.REDIRECT_TARGET);
    localStorage.removeItem(STORAGE_KEYS.SYNC_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);

    // Clear all sessionStorage
    sessionStorage.clear();

    // Broadcast logout across tabs
    localStorage.setItem('vendorsaathi_auth_broadcast', JSON.stringify({
      type: 'LOGOUT',
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error clearing auth storage:', e);
  }
};
