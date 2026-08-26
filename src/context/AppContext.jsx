import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS as INITIAL_PRODUCTS_DATA } from '../data/products';
import { VENDORS as INITIAL_VENDORS_DATA } from '../data/vendors';
import { CATEGORIES } from '../data/categories';
import { 
  auth, 
  db, 
  saveOrderToFirebase, 
  updateOrderStatusInFirebase, 
  subscribeToOrders, 
  saveUserProfileToFirebase,
  getUserProfileFromFirebase,
  onAuthStateChanged,
  signOut
} from '../firebase';
import { 
  playSuccessChime, 
  playOrderNotificationSound, 
  playStatusUpdateSound, 
  playPopSound 
} from '../utils/audio';
import {
  createAuthSession,
  validateAuthSession,
  clearAllAuthStorage,
  STORAGE_KEYS
} from '../utils/auth';
import { 
  buildHashRoute, 
  parseHashRoute, 
  encodeQueryParams, 
  decodeQueryParams 
} from '../utils/urlParams';
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager';

const AppContext = createContext();

const INITIAL_LOCATION = {
  name: 'Mijar, Moodbidri',
  village: 'Mijar',
  town: 'Moodbidri',
  district: 'Dakshina Kannada',
  pincode: '574225',
  lat: 13.0682,
  lng: 74.9961,
  accuracy: 12,
  source: 'GPS_INITIAL'
};

const DEFAULT_USER = {
  isLoggedIn: false,
  authToken: null,
  tokenExpiresAt: null,
  sessionIssuedAt: null,
  uid: '',
  name: '',
  phone: '',
  email: '',
  village: 'Mijar',
  town: 'Moodbidri',
  district: 'Dakshina Kannada',
  pincode: '574225',
  address: '',
  landmark: '',
  preferredLanguage: 'en',
  role: 'customer', // 'customer' | 'vendor'
  authProvider: '',
  photoURL: '',
  gpsLocation: {
    lat: 13.06824,
    lng: 74.99612,
    accuracy: 10,
    village: 'Mijar',
    town: 'Moodbidri',
    district: 'Dakshina Kannada',
    pincode: '574225',
    formattedAddress: 'Mijar Village, Moodbidri - 574225',
    source: 'LIVE_GPS_VERIFIED',
    capturedAt: new Date().toISOString()
  },
  addresses: []
};

// Initial cart from single vendor (Ramesh Grocery)
const INITIAL_CART = [
  { product: INITIAL_PRODUCTS_DATA[0], quantity: 2 }, // Tomato 2kg (₹50)
  { product: INITIAL_PRODUCTS_DATA[1], quantity: 1 }, // Potato 1kg (₹30)
  { product: INITIAL_PRODUCTS_DATA[3], quantity: 1 }  // Green Chilli 250g (₹40)
];

const INITIAL_ORDERS = [
  {
    id: 'VS10245',
    date: '12 May 2026, 10:30 AM',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    vendorPhone: '+91 98451 23456',
    vendorDistance: '1.8 km',
    items: [
      { id: 'p1', name: 'Fresh Farm Red Tomatoes', price: 25, unit: 'kg', quantity: 2, image: INITIAL_PRODUCTS_DATA[0].image },
      { id: 'p2', name: 'Fresh Local Potatoes', price: 30, unit: 'kg', quantity: 1, image: INITIAL_PRODUCTS_DATA[1].image },
      { id: 'p4', name: 'Spicy Green Chillies', price: 40, unit: '250 g', quantity: 1, image: INITIAL_PRODUCTS_DATA[3].image }
    ],
    subtotal: 120,
    deliveryFee: 20,
    discount: 0,
    total: 140,
    paymentMethod: 'Cash on Delivery',
    status: 'Out for Delivery',
    deliveryAddress: 'Bhavana Bai, Mijar Village, Moodbidri, Karnataka - 574225',
    deliveryContact: '+91 9876543210',
    estimatedDelivery: '20–30 min',
    riderLocation: { lat: 13.0100, lng: 74.9820, progress: 0.65 },
    timeline: [
      { status: 'Placed', label: 'Order Placed', time: '10:30 AM', completed: true },
      { status: 'Accepted', label: 'Vendor Accepted', time: '10:35 AM', completed: true },
      { status: 'Preparing', label: 'Preparing Fresh Produce', time: '10:45 AM', completed: true },
      { status: 'Out for Delivery', label: 'Out for Delivery with Rider', time: '11:00 AM', completed: true },
      { status: 'Delivered', label: 'Delivered to Doorstep', time: 'Expected by 11:30 AM', completed: false }
    ]
  },
  {
    id: 'VS10215',
    date: '10 May 2026, 09:45 AM',
    vendorId: 'v2',
    vendorName: 'Suresh Provision Store',
    vendorPhone: '+91 98452 34567',
    vendorDistance: '3.4 km',
    items: [
      { id: 'p5', name: 'Byadgi Dry Red Chilli', price: 180, unit: 'kg', quantity: 1, image: INITIAL_PRODUCTS_DATA[4].image }
    ],
    subtotal: 180,
    deliveryFee: 20,
    discount: 0,
    total: 200,
    paymentMethod: 'UPI',
    status: 'Delivered',
    deliveryAddress: 'Bhavana Bai, Mijar - 574225',
    deliveryContact: '+91 9876543210',
    estimatedDelivery: 'Delivered',
    riderLocation: { lat: 13.0125, lng: 74.9850, progress: 1.0 },
    timeline: [
      { status: 'Placed', label: 'Order Placed', time: '09:45 AM', completed: true },
      { status: 'Accepted', label: 'Vendor Accepted', time: '09:48 AM', completed: true },
      { status: 'Preparing', label: 'Preparing Fresh Produce', time: '09:55 AM', completed: true },
      { status: 'Out for Delivery', label: 'Out for Delivery with Rider', time: '10:05 AM', completed: true },
      { status: 'Delivered', label: 'Delivered to Doorstep', time: '10:25 AM', completed: true }
    ]
  }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', title: '🚚 Order Out for Delivery', body: 'Your order #VS10245 is out for delivery with Ramesh Grocery.', time: '5 mins ago', read: false },
  { id: 'n2', title: '🎉 Special Offer', body: 'Get 10% OFF on all local organic vegetables today with coupon FRESH10!', time: '2 hours ago', read: false }
];

export const AppProvider = ({ children }) => {
  // Read initial route from URL hash if present
  const getInitialStateFromUrl = () => {
    const parsed = parseHashRoute(window.location.hash);
    return {
      view: parsed.view || 'home',
      params: parsed.params || {}
    };
  };

  const initialRoute = getInitialStateFromUrl();
  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [currentViewParams, setCurrentViewParams] = useState(initialRoute.params);
  const [selectedCategory, setSelectedCategory] = useState(initialRoute.params.category || null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialRoute.params.search || initialRoute.params.query || '');
  
  // Dynamic Products and Vendors catalog
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DYNAMIC_PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS_DATA;
    } catch (e) {
      return INITIAL_PRODUCTS_DATA;
    }
  });

  const [vendors, setVendors] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DYNAMIC_VENDORS);
      return saved ? JSON.parse(saved) : INITIAL_VENDORS_DATA;
    } catch (e) {
      return INITIAL_VENDORS_DATA;
    }
  });

  const [currentLocation, setCurrentLocation] = useState(INITIAL_LOCATION);
  
  // User state with initial session token validation
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        const validation = validateAuthSession(parsed);
        if (validation.isValid) {
          return parsed;
        } else {
          // Stored session is invalid or expired
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          return DEFAULT_USER;
        }
      }
    } catch (e) {
      console.warn('User load from localStorage note:', e);
    }
    return DEFAULT_USER;
  });

  const [cart, setCart] = useState(INITIAL_CART);
  const [wishlist, setWishlist] = useState(['p1', 'p5']);
  
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYNC_ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch (e) {
      return INITIAL_ORDERS;
    }
  });

  const [activeOrderId, setActiveOrderId] = useState('VS10245');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  
  // Modals & Drawers state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState('google'); // 'google' | 'otp' | 'email' | 'register' | 'vendor'
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isVendorSimOpen, setIsVendorSimOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isVendorChatOpen, setIsVendorChatOpen] = useState(false);
  const [isVendorSwitchModalOpen, setIsVendorSwitchModalOpen] = useState(false);
  const [pendingVendorConflict, setPendingVendorConflict] = useState(null);
  
  // Language & Multi-lingual Voice Feature Assistance state
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('vendorsaathi_language') || 'en';
  });
  const [selectedVoiceFeature, setSelectedVoiceFeature] = useState('gps-route');
  const [isVoiceAssistanceOpen, setIsVoiceAssistanceOpen] = useState(false);

  // Active simulated rider GPS location for real-time tracking
  const [activeRiderLocation, setActiveRiderLocation] = useState({
    lat: 13.0110,
    lng: 74.9835,
    progress: 0.55
  });

  const [reviewOrder, setReviewOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      playSuccessChime();
    } else if (type === 'info') {
      playPopSound();
    }
    setTimeout(() => setToast(null), 3800);
  }, []);

  // SECURE LOGOUT: Completely clears tokens, cookies, localStorage, sessionStorage, and resets state
  const secureLogout = useCallback(async () => {
    try {
      // 1. Terminate Firebase session if connected
      if (auth) {
        await signOut(auth).catch(err => console.warn('Firebase signOut note:', err));
      }

      // 2. Wipe all storage
      clearAllAuthStorage();

      // 3. Reset in-memory global state
      setUser(DEFAULT_USER);
      setCart([]);
      setWishlist([]);
      setIsAuthModalOpen(false);
      setIsCartDrawerOpen(false);
      setIsVendorSimOpen(false);
      setIsVendorChatOpen(false);

      // 4. Invalidate browser history to prevent Back Button restoration of protected pages
      if (window.history && window.history.replaceState) {
        window.history.replaceState({ view: 'home' }, '', '#home');
      }

      showToast('🔒 Signed out securely. Session destroyed.', 'info');
      setCurrentView('home');
      setCurrentViewParams({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Logout error:', err);
      setUser(DEFAULT_USER);
      setCurrentView('home');
    }
  }, [showToast]);

  // Session Expiration Watcher & Cross-Tab Logout Listener
  useEffect(() => {
    const checkSessionValidity = () => {
      if (user?.isLoggedIn) {
        const validation = validateAuthSession(user);
        if (!validation.isValid) {
          showToast('⏰ Your session has expired. Please sign in again.', 'danger');
          secureLogout();
        }
      }
    };

    // Check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionValidity();
      }
    };

    // Cross-tab synchronization
    const handleStorageEvent = (e) => {
      if (e.key === 'vendorsaathi_auth_broadcast') {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload?.type === 'LOGOUT') {
            setUser(DEFAULT_USER);
            setCurrentView('home');
          }
        } catch (err) {}
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageEvent);

    // Periodic check every 60 seconds
    const intervalId = setInterval(checkSessionValidity, 60000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(intervalId);
    };
  }, [user, secureLogout, showToast]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const remoteProfile = await getUserProfileFromFirebase(firebaseUser.uid);
        
        setUser(prev => {
          const fallbackName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : prev.name) || 'Customer';
          const session = createAuthSession({ role: prev.role || 'customer', uid: firebaseUser.uid, email: firebaseUser.email });

          const updated = {
            ...prev,
            isLoggedIn: true,
            authToken: prev.authToken || session.authToken,
            tokenExpiresAt: prev.tokenExpiresAt || session.tokenExpiresAt,
            sessionIssuedAt: prev.sessionIssuedAt || session.sessionIssuedAt,
            uid: firebaseUser.uid,
            name: fallbackName,
            email: firebaseUser.email || prev.email || 'customer@vendorsaathi.com',
            phone: firebaseUser.phoneNumber || (remoteProfile?.data?.phone) || prev.phone || '+91 9876543210',
            photoURL: firebaseUser.photoURL || prev.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName)}&backgroundColor=059669,10b981,047857`,
            authProvider: 'google',
            ...(remoteProfile?.data || {})
          };
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
          return updated;
        });
      }
    });

    // Listen to Firebase Firestore Orders in real time
    const unsubscribeOrders = subscribeToOrders((firebaseOrders) => {
      if (firebaseOrders && firebaseOrders.length > 0) {
        setOrders(prev => {
          const merged = [...firebaseOrders];
          prev.forEach(localOrder => {
            if (!merged.some(o => o.id === localOrder.id)) {
              merged.push(localOrder);
            }
          });
          localStorage.setItem(STORAGE_KEYS.SYNC_ORDERS, JSON.stringify(merged));
          return merged;
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (typeof unsubscribeOrders === 'function') unsubscribeOrders();
    };
  }, []);

  // Sync user state to localStorage and registry by email
  const updateUserProfile = (newUserData) => {
    setUser(prev => {
      // Ensure valid auth session tokens are present if user is marked logged in
      let sessionData = {};
      if (newUserData.isLoggedIn && (!prev.authToken || !newUserData.authToken)) {
        sessionData = createAuthSession(newUserData);
      }

      const merged = { ...prev, ...sessionData, ...newUserData };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(merged));
      
      if (merged.email) {
        const cleanEmail = merged.email.trim().toLowerCase();
        localStorage.setItem(`vendorsaathi_user_db_${cleanEmail}`, JSON.stringify(merged));
      }
      
      if (merged.uid) {
        saveUserProfileToFirebase(merged.uid, merged);
      }

      // Automatically sync active app GPS location with user's registered GPS
      if (merged.gpsLocation && merged.gpsLocation.lat && merged.gpsLocation.lng) {
        setCurrentLocation({
          name: `${merged.village || merged.gpsLocation.village || 'Mijar'}, ${merged.town || merged.gpsLocation.town || 'Moodbidri'}`,
          village: merged.village || merged.gpsLocation.village || 'Mijar',
          town: merged.town || merged.gpsLocation.town || 'Moodbidri',
          district: merged.district || merged.gpsLocation.district || 'Dakshina Kannada',
          pincode: merged.pincode || merged.gpsLocation.pincode || '574225',
          lat: merged.gpsLocation.lat,
          lng: merged.gpsLocation.lng,
          accuracy: merged.gpsLocation.accuracy || 10,
          source: 'REGISTERED_USER_GPS'
        });
      }

      cacheManager.invalidate(CACHE_KEYS.USER_PROFILE, merged);
      return merged;
    });
  };

  const changeLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem('vendorsaathi_language', langCode);
  };

  const openVoiceAssistanceForFeature = (featureId) => {
    if (featureId) setSelectedVoiceFeature(featureId);
    setIsVoiceAssistanceOpen(true);
  };

  // Synchronized navigation with safe URL query parameter encoding
  const navigateTo = useCallback((view, params = {}) => {
    playPopSound();
    if (params.category !== undefined) setSelectedCategory(params.category);
    if (params.search !== undefined) setSearchQuery(params.search);
    if (params.query !== undefined) setSearchQuery(params.query);
    if (params.vendor !== undefined) {
      if (typeof params.vendor === 'string') {
        const found = (vendors || INITIAL_VENDORS_DATA).find(v => v.id === params.vendor);
        setSelectedVendor(found || null);
      } else {
        setSelectedVendor(params.vendor);
      }
    }
    if (params.product !== undefined) setSelectedProduct(params.product);
    if (params.orderId !== undefined) setActiveOrderId(params.orderId);

    setCurrentView(view);
    setCurrentViewParams(params);

    // Update browser URL hash with safe parameter encoding
    const targetHash = buildHashRoute(view, params);
    if (window.location.hash !== targetHash) {
      window.history.pushState({ view, params }, '', targetHash);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vendors]);

  // Handle browser back/forward buttons with safe decoding
  useEffect(() => {
    const handlePopState = (e) => {
      const parsed = parseHashRoute(window.location.hash);
      const targetView = e.state?.view || parsed.view || 'home';
      const targetParams = e.state?.params || parsed.params || {};
      
      // If user is not logged in, prevent back button from accessing protected view
      if (!user?.isLoggedIn && ['checkout', 'payment', 'order-confirmation', 'order-tracking', 'my-orders', 'profile', 'vendor-portal'].includes(targetView)) {
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '#home');
        return;
      }

      if (targetParams.category !== undefined) setSelectedCategory(targetParams.category);
      if (targetParams.search !== undefined) setSearchQuery(targetParams.search);

      setCurrentView(targetView);
      setCurrentViewParams(targetParams);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Vendor updates product stock / price in real-time
  const updateVendorProduct = (productId, updates) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === productId ? { ...p, ...updates } : p);
      localStorage.setItem(STORAGE_KEYS.DYNAMIC_PRODUCTS, JSON.stringify(updated));
      cacheManager.invalidate(CACHE_KEYS.PRODUCTS, updated);
      return updated;
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCT_SYNC, JSON.stringify({ productId, updates, timestamp: Date.now() }));
    window.dispatchEvent(new Event('storage'));
    showToast('📦 Product catalog updated in real-time!', 'info');
  };

  // Vendor updates store status (online/busy/offline)
  const updateVendorStore = (vendorId, updates) => {
    setVendors(prev => {
      const updated = prev.map(v => v.id === vendorId ? { ...v, ...updates } : v);
      localStorage.setItem(STORAGE_KEYS.DYNAMIC_VENDORS, JSON.stringify(updated));
      cacheManager.invalidate(CACHE_KEYS.VENDORS, updated);
      return updated;
    });
    localStorage.setItem(STORAGE_KEYS.VENDOR_SYNC, JSON.stringify({ vendorId, updates, timestamp: Date.now() }));
    window.dispatchEvent(new Event('storage'));
  };

  // Add to Cart with Single Vendor Constraint Enforcement
  const addToCart = (product, quantity = 1) => {
    if (cart.length > 0) {
      const currentCartVendorId = cart[0].product.vendorId;
      if (currentCartVendorId !== product.vendorId) {
        setPendingVendorConflict({
          currentVendorName: cart[0].product.vendorName,
          newVendorName: product.vendorName,
          newProduct: product,
          newQuantity: quantity
        });
        setIsVendorSwitchModalOpen(true);
        return;
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, { product, quantity }];
      }
      return updated;
    });
    showToast(`Added ${quantity} ${product.unit} of ${product.shortName || product.name} to cart 🛒`);
  };

  const clearCartAndAddVendorProduct = () => {
    if (!pendingVendorConflict) return;
    const { newProduct, newQuantity } = pendingVendorConflict;
    setCart([{ product: newProduct, quantity: newQuantity }]);
    setIsVendorSwitchModalOpen(false);
    setPendingVendorConflict(null);
    showToast(`Cleared cart & added ${newProduct.shortName} from ${newProduct.vendorName} 🎉`);
  };

  const updateCartQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from Wishlist', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Added to Wishlist ❤️');
        return [...prev, productId];
      }
    });
  };

  const placeOrder = (orderData) => {
    const newOrderId = `VS${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${timeString}`;

    const calculatedSubtotal = orderData.subtotal ?? cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const calculatedDeliveryFee = orderData.deliveryFee ?? (calculatedSubtotal > 300 || calculatedSubtotal === 0 ? 0 : 20);
    const calculatedDiscount = orderData.discount || 0;
    const calculatedTotal = orderData.total ?? (calculatedSubtotal + calculatedDeliveryFee - calculatedDiscount);

    const newOrder = {
      id: newOrderId,
      date: dateString,
      vendorId: orderData.vendorId || cart[0]?.product.vendorId || 'v1',
      vendorName: orderData.vendorName || cart[0]?.product.vendorName || 'Ramesh Grocery',
      vendorPhone: orderData.vendorPhone || '+91 98451 23456',
      vendorDistance: '1.8 km',
      items: orderData.items || cart.map(i => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        unit: i.product.unit,
        quantity: i.quantity,
        image: i.product.image
      })),
      subtotal: calculatedSubtotal,
      deliveryFee: calculatedDeliveryFee,
      discount: calculatedDiscount,
      total: calculatedTotal,
      paymentMethod: orderData.paymentMethod || 'UPI (Instant QR)',
      paymentStatus: orderData.paymentStatus || (orderData.upiRefId ? `Paid via UPI (UTR #${orderData.upiRefId})` : 'Pending Doorstep Payment'),
      upiRefId: orderData.upiRefId || null,
      upiVpa: orderData.upiVpa || null,
      upiApp: orderData.upiApp || null,
      status: 'Placed',
      deliveryAddress: orderData.deliveryAddress || user.address || 'Mijar, Moodbidri, Karnataka - 574225',
      deliveryContact: orderData.deliveryContact || user.phone || '+91 9876543210',
      customerGPS: orderData.customerGPS || user.gpsLocation || { lat: 13.06824, lng: 74.99612, accuracy: 10 },
      estimatedDelivery: '20–30 min',
      riderLocation: { lat: 13.0682, lng: 74.9961, progress: 0.15 },
      timeline: [
        { status: 'Placed', label: 'Order Placed', time: timeString, completed: true },
        { status: 'Accepted', label: 'Vendor Accepted', time: 'Pending', completed: false },
        { status: 'Preparing', label: 'Preparing Fresh Produce', time: 'Pending', completed: false },
        { status: 'Out for Delivery', label: 'Out for Delivery with Rider', time: 'Pending', completed: false },
        { status: 'Delivered', label: 'Delivered to Doorstep', time: 'Pending', completed: false }
      ]
    };

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem(STORAGE_KEYS.SYNC_ORDERS, JSON.stringify(updated));
      cacheManager.invalidate([CACHE_KEYS.ORDERS, CACHE_KEYS.CART], updated);
      return updated;
    });

    setActiveOrderId(newOrderId);
    clearCart();
    
    // Sync to Firebase Firestore in background
    saveOrderToFirebase(newOrder);

    // Broadcast for cross-window vendor companion app sync
    localStorage.setItem(STORAGE_KEYS.NEW_ORDER_SYNC, JSON.stringify({
      order: newOrder,
      timestamp: Date.now()
    }));
    window.dispatchEvent(new Event('storage'));

    playOrderNotificationSound();
    showToast(`Order #${newOrderId} placed & transmitted to Vendor! 🎉`);
    navigateTo('order-confirmation', { orderId: newOrderId });
  };

  const updateOrderStatus = (orderId, newStatus, extraData = {}) => {
    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id !== orderId) return order;

        const statuses = ['Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];
        const currentIdx = statuses.indexOf(newStatus);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const updatedTimeline = order.timeline.map((step, idx) => {
          if (idx <= currentIdx) {
            return { ...step, completed: true, time: step.time === 'Pending' ? now : step.time };
          }
          return step;
        });

        return {
          ...order,
          status: newStatus,
          timeline: updatedTimeline,
          ...extraData
        };
      });

      localStorage.setItem(STORAGE_KEYS.SYNC_ORDERS, JSON.stringify(updated));
      cacheManager.invalidate(CACHE_KEYS.ORDERS, updated);
      return updated;
    });

    // Sync status change to Firebase Firestore
    updateOrderStatusInFirebase(orderId, newStatus, extraData);
    playStatusUpdateSound();
  };

  const cancelOrder = (orderId) => {
    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id !== orderId) return order;
        return { ...order, status: 'Cancelled' };
      });
      localStorage.setItem(STORAGE_KEYS.SYNC_ORDERS, JSON.stringify(updated));
      cacheManager.invalidate(CACHE_KEYS.ORDERS, updated);
      return updated;
    });
    
    // Sync cancellation to Firebase
    updateOrderStatusInFirebase(orderId, 'Cancelled');
    showToast(`Order #${orderId} has been cancelled`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        currentViewParams,
        navigateTo,
        secureLogout,
        selectedCategory,
        setSelectedCategory,
        selectedVendor,
        setSelectedVendor,
        selectedProduct,
        setSelectedProduct,
        searchQuery,
        setSearchQuery,
        products,
        updateVendorProduct,
        vendors,
        updateVendorStore,
        currentLocation,
        setCurrentLocation,
        user,
        setUser,
        updateUserProfile,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        wishlist,
        toggleWishlist,
        orders,
        activeOrderId,
        setActiveOrderId,
        activeRiderLocation,
        setActiveRiderLocation,
        placeOrder,
        updateOrderStatus,
        cancelOrder,
        notifications,
        setNotifications,
        isLocationModalOpen,
        setIsLocationModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalInitialTab,
        setAuthModalInitialTab,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isVendorSimOpen,
        setIsVendorSimOpen,
        isReviewModalOpen,
        setIsReviewModalOpen,
        isVoiceSearchOpen,
        setIsVoiceSearchOpen,
        isVendorChatOpen,
        setIsVendorChatOpen,
        isVendorSwitchModalOpen,
        setIsVendorSwitchModalOpen,
        selectedLanguage,
        changeLanguage,
        selectedVoiceFeature,
        setSelectedVoiceFeature,
        isVoiceAssistanceOpen,
        setIsVoiceAssistanceOpen,
        openVoiceAssistanceForFeature,
        pendingVendorConflict,
        clearCartAndAddVendorProduct,
        reviewOrder,
        setReviewOrder,
        toast,
        showToast,
        CATEGORIES
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
