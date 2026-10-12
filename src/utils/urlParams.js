/**
 * URL Query Parameter Utilities
 * Ensures safe encoding and decoding of special characters ('?', '&', '/', '%', spaces, unicode)
 * to prevent route corruptions or URL parsing crashes.
 */

/**
 * Safely encodes an object of parameters into a URL query string
 * @param {Record<string, any>} params
 * @returns {string} Encoded query string (e.g., "query=Fresh%20Tomato&category=veg")
 */
export const encodeQueryParams = (params = {}) => {
  if (!params || typeof params !== 'object') return '';
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object') {
        searchParams.set(key, JSON.stringify(value));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Safely decodes a URL query string or hash into a typed parameter dictionary
 * @param {string} searchOrHashString
 * @returns {Record<string, any>} Parsed parameters
 */
export const decodeQueryParams = (searchOrHashString = '') => {
  if (!searchOrHashString || typeof searchOrHashString !== 'string') return {};

  try {
    let cleanQuery = searchOrHashString;
    
    // Extract query part if full hash or URL was passed (e.g. "#product-listing?search=xyz" or "?search=xyz")
    if (cleanQuery.includes('?')) {
      cleanQuery = cleanQuery.substring(cleanQuery.indexOf('?'));
    } else if (!cleanQuery.startsWith('?')) {
      return {};
    }

    const searchParams = new URLSearchParams(cleanQuery);
    const params = {};

    searchParams.forEach((value, key) => {
      // Check if value is serialized JSON
      if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
        try {
          params[key] = JSON.parse(value);
        } catch {
          params[key] = value;
        }
      } else if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else if (!isNaN(Number(value)) && value.trim() !== '' && !value.startsWith('0') && value.length < 15) {
        params[key] = Number(value);
      } else {
        params[key] = value;
      }
    });

    return params;
  } catch (err) {
    console.warn('Error decoding URL query params, falling back to empty object:', err);
    return {};
  }
};

/**
 * Builds a hash path with encoded parameters
 * @param {string} viewName
 * @param {Record<string, any>} params
 * @returns {string} E.g., "#product-listing?category=fruits&search=banana"
 */
export const buildHashRoute = (viewName, params = {}) => {
  const queryString = encodeQueryParams(params);
  return `#${viewName}${queryString}`;
};

/**
 * Parses hash path into view and parameters
 * @param {string} hash
 * @returns {{ view: string, params: Record<string, any> }}
 */
export const parseHashRoute = (hash = '') => {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { view: 'home', params: {} };

  const [viewPart, queryPart] = clean.split('?');
  let rawView = (viewPart || 'home').toLowerCase().replace(/^\//, '');

  const params = queryPart ? decodeQueryParams(`?${queryPart}`) : {};

  // Normalize requested prompt aliases
  let view = rawView;
  if (rawView === 'vendor/dashboard' || rawView === 'vendor-dashboard' || rawView === 'vendor') {
    view = 'vendor-portal';
  } else if (rawView === 'vendor/products' || rawView === 'vendor-products') {
    view = 'vendor-portal';
    params.tab = 'inventory';
  } else if (rawView === 'vendor/register' || rawView === 'vendor-register') {
    view = 'login';
    params.role = 'vendor';
    params.mode = 'register';
  } else if (rawView === 'vendor/login' || rawView === 'vendor-login') {
    view = 'login';
    params.role = 'vendor';
    params.mode = 'signin';
  } else if (rawView === 'customer/register' || rawView === 'customer-register' || rawView === 'register') {
    view = 'login';
    params.role = 'customer';
    params.mode = 'register';
  } else if (rawView === 'customer/login' || rawView === 'customer-login' || rawView === 'login') {
    view = 'login';
    params.role = 'customer';
    params.mode = 'signin';
  } else if (rawView === 'customer/explore' || rawView === 'customer-explore' || rawView === 'explore') {
    view = 'nearby-vendors';
  } else if (rawView === 'admin/panel' || rawView === 'admin-panel' || rawView === 'admin') {
    view = 'admin-panel';
  }

  return { view, params };
};

