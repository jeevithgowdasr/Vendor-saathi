/**
 * Dynamic SEO, OpenGraph & Metadata Manager
 * Updates document.title, description, canonical, and OpenGraph tags dynamically per route.
 */

export const ROUTE_SEO_CONFIG = {
  home: {
    title: '🛒 VendorSaathi — Fresh Groceries Delivered in 20 Mins',
    description: 'Order farm-fresh vegetables, fruits, and daily village essentials directly from local farmers and kirana merchants across Moodbidri.'
  },
  categories: {
    title: 'Produce & Grocery Categories | VendorSaathi',
    description: 'Explore farm-fresh vegetables, organic fruits, dairy, village grains, spices, and seasonal harvest categories.'
  },
  'product-listing': {
    title: 'Fresh Farm Produce Catalog | VendorSaathi',
    description: 'Browse fresh vegetables, fruits, and groceries directly sourced from local village farms with transparent fair pricing.'
  },
  'product-detail': {
    title: 'Product Details | VendorSaathi',
    description: 'View fresh harvest details, farm source, vendor stock, and customer reviews.'
  },
  'nearby-vendors': {
    title: 'Nearby Village Farmers & Kirana Stores | VendorSaathi',
    description: 'Discover verified hyper-local farmers and store vendors in your village with instant delivery.'
  },
  cart: {
    title: 'Your Fresh Cart | VendorSaathi',
    description: 'Review your selected fresh produce items, quantities, and proceed to instant checkout.'
  },
  checkout: {
    title: 'Secure Checkout & Delivery Slots | VendorSaathi',
    description: 'Select instant 20-minute delivery or scheduled delivery slots with UPI or Card payment.'
  },
  'order-tracking': {
    title: 'Live Order GPS Tracking | VendorSaathi',
    description: 'Track your local rider in real-time on live satellite maps as your fresh harvest is dispatched.'
  },
  'my-orders': {
    title: 'My Orders & Order History | VendorSaathi',
    description: 'View active orders, tracking history, previous deliveries, and invoices.'
  },
  wishlist: {
    title: 'My Saved Produce Wishlist | VendorSaathi',
    description: 'Save your favorite organic fruits and vegetables for one-tap ordering.'
  },
  offers: {
    title: 'Today’s Village Harvest Offers & Discounts | VendorSaathi',
    description: 'Save big with daily harvest combos, festival discounts, and free delivery perks.'
  },
  'voice-search': {
    title: 'Multilingual Voice AI Search | VendorSaathi',
    description: 'Speak in English, Kannada, or Hindi to find fresh vegetables and daily kitchen essentials instantly.'
  },
  profile: {
    title: 'Account Settings & GPS Telemetry | VendorSaathi',
    description: 'Manage your delivery address, live GPS location coordinates, and security settings.'
  },
  'vendor-portal': {
    title: 'Vendor Hub & Store Management | VendorSaathi',
    description: 'Real-time vendor portal for inventory publishing, live rider dispatch, and sales telemetry.'
  },
  login: {
    title: 'Sign In to Your Account | VendorSaathi',
    description: 'Sign in securely with Google or OTP to access your orders and fresh produce cart.'
  },
  unauthorized: {
    title: '403 — Unauthorized Access | VendorSaathi',
    description: 'This section requires elevated role permissions.'
  }
};

/**
 * Updates DOM title, meta tags, and OpenGraph tags dynamically
 * @param {string} viewName
 * @param {Object} params
 */
export const updatePageSEO = (viewName = 'home', params = {}) => {
  if (typeof document === 'undefined') return;

  const config = ROUTE_SEO_CONFIG[viewName] || ROUTE_SEO_CONFIG.home;
  let title = config.title;
  let description = config.description;

  // Dynamic customization for specific views
  if (viewName === 'product-detail' && params?.product?.name) {
    title = `${params.product.name} — Fresh Produce | VendorSaathi`;
    description = `Order ${params.product.name} (₹${params.product.price}/${params.product.unit}) fresh from ${params.product.vendorName || 'local farmers'}.`;
  } else if (viewName === 'product-listing' && params?.category) {
    const categoryTitle = params.category.charAt(0).toUpperCase() + params.category.slice(1);
    title = `Fresh ${categoryTitle} — Farm Direct | VendorSaathi`;
  } else if (viewName === 'order-tracking' && params?.orderId) {
    title = `Track Order #${params.orderId} | VendorSaathi`;
  }

  // 1. Update Title
  document.title = title;

  // 2. Helper to set or create meta tag
  const setMetaTag = (selector, attribute, value) => {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      if (selector.startsWith('meta[name=')) {
        element.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
      } else if (selector.startsWith('meta[property=')) {
        element.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
      }
      document.head.appendChild(element);
    }
    element.setAttribute(attribute, value);
  };

  // 3. Update Standard Meta Tags
  setMetaTag('meta[name="description"]', 'content', description);

  // 4. Update OpenGraph Tags
  setMetaTag('meta[property="og:title"]', 'content', title);
  setMetaTag('meta[property="og:description"]', 'content', description);
  setMetaTag('meta[property="og:url"]', 'content', window.location.href);

  // 5. Update Twitter Tags
  setMetaTag('meta[name="twitter:title"]', 'content', title);
  setMetaTag('meta[name="twitter:description"]', 'content', description);

  // 6. Update Canonical Link
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', window.location.origin + window.location.pathname + window.location.hash);
};
