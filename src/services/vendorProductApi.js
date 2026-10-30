/**
 * Vendor Product Management Service
 * Powered by Firebase Firestore for real-time storage & synchronization,
 * with resilient local caching and optimistic UI updates.
 */

import {
  saveProductToFirebase,
  getVendorProductsFromFirebase,
  getProductFromFirebase,
  updateProductInFirebase,
  toggleProductAvailabilityInFirebase,
  deleteProductFromFirebase
} from '../firebase.js';
import { DEFAULT_PRODUCTS } from '../data/products.js';

const LOCAL_STORAGE_KEY = 'vs_firebase_products_cache';

function getStoredFallbackProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Also check dynamic products storage key
    const dynRaw = localStorage.getItem('vendorsaathi_dynamic_products');
    if (dynRaw) {
      const parsedDyn = JSON.parse(dynRaw);
      if (Array.isArray(parsedDyn) && parsedDyn.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedDyn));
        return parsedDyn;
      }
    }
    // Default seed catalog
    if (DEFAULT_PRODUCTS && DEFAULT_PRODUCTS.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      localStorage.setItem('vendorsaathi_dynamic_products', JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return [];
  } catch {
    return DEFAULT_PRODUCTS || [];
  }
}

function saveStoredFallbackProducts(list) {
  try {
    const safeList = Array.isArray(list) ? list : [];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeList));
    localStorage.setItem('vendorsaathi_dynamic_products', JSON.stringify(safeList));
  } catch (err) {
    console.warn('Could not cache products to localStorage', err);
  }
}

export const broadcastProductChange = (action, productOrId) => {
  try {
    const payload = { action, data: productOrId, timestamp: Date.now() };
    localStorage.setItem('vendorsaathi_product_sync', JSON.stringify(payload));
    
    // In-window direct sync dispatch for instantaneous UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vendorsaathi_catalog_updated', { detail: payload }));
      window.dispatchEvent(new Event('storage'));
    }

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('vendorsaathi_catalog_channel');
      channel.postMessage(payload);
      channel.close();
    }
  } catch (e) {
    console.warn('Product sync broadcast notice:', e);
  }
};

/**
 * Fetch all products for vendor from Firebase Firestore
 * Falls back to local cache if offline or during Firebase initialization
 */
export const fetchVendorProducts = async (tokenOrVendorId, { category, search } = {}) => {
  try {
    // 1. Try Firebase Firestore
    const vendorId = tokenOrVendorId || 'v1';
    const fbResult = await getVendorProductsFromFirebase(vendorId, { category, search });
    
    if (fbResult.success && fbResult.products && fbResult.products.length > 0) {
      saveStoredFallbackProducts(fbResult.products);
      return fbResult;
    }

    // If Firebase returned empty collection, seed initial products to Firebase so they are stored
    const cached = getStoredFallbackProducts();
    if (fbResult.success && fbResult.products.length === 0 && cached.length > 0) {
      // Seed first time to Firebase Firestore in background
      Promise.all(cached.map(p => saveProductToFirebase({ ...p, vendor_id: vendorId }))).catch(() => {});
      return { success: true, count: cached.length, products: cached };
    }

    return fbResult;
  } catch (error) {
    console.warn('Firebase fetch products note:', error.message);
    let items = getStoredFallbackProducts();
    if (category && category !== 'All' && category !== 'all') {
      items = items.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    return { success: true, count: items.length, products: items };
  }
};

/**
 * Fetch single vendor product by ID from Firebase Firestore
 */
export const fetchVendorProductById = async (tokenOrVendorId, id) => {
  try {
    const fbResult = await getProductFromFirebase(id);
    if (fbResult.success && fbResult.product) {
      return fbResult;
    }
  } catch (err) {
    console.warn('Firebase getProduct note:', err.message);
  }

  const items = getStoredFallbackProducts();
  const found = items.find(p => (p._id || p.id) === id);
  if (found) return { success: true, product: found };
  throw new Error('Product not found in Firebase');
};

/**
 * Create a new product in Firebase Firestore
 */
export const createVendorProductApi = async (tokenOrVendorId, productData) => {
  const newId = productData.id || productData._id || `p_${Date.now()}`;
  const vendorId = tokenOrVendorId || productData.vendor_id || productData.vendorId || 'v1';

  const productPayload = {
    ...productData,
    id: newId,
    _id: newId,
    vendor_id: vendorId,
    vendorId: vendorId,
    available_quantity: Number(productData.available_quantity !== undefined ? productData.available_quantity : 10),
    availableStock: Number(productData.available_quantity !== undefined ? productData.available_quantity : 10),
    is_available: productData.is_available !== undefined ? Boolean(productData.is_available) : true,
    stockStatus: productData.is_available !== false ? 'in-stock' : 'out-of-stock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. Save directly to Firebase Firestore
  try {
    const fbResult = await saveProductToFirebase(productPayload);
    if (fbResult.success) {
      // Also update local cache
      const items = getStoredFallbackProducts();
      const updated = [fbResult.product, ...items.filter(p => (p._id || p.id) !== newId)];
      saveStoredFallbackProducts(updated);
      broadcastProductChange('CREATE', fbResult.product);
      return { success: true, message: 'Product stored in Firebase successfully.', product: fbResult.product };
    }
  } catch (err) {
    console.warn('Firebase saveProduct note:', err.message);
  }

  // Local fallback
  const items = getStoredFallbackProducts();
  const updated = [productPayload, ...items];
  saveStoredFallbackProducts(updated);
  broadcastProductChange('CREATE', productPayload);
  return { success: true, message: 'Product saved.', product: productPayload };
};

/**
 * Update product details in Firebase Firestore
 */
export const updateVendorProductApi = async (tokenOrVendorId, id, updates) => {
  try {
    const fbResult = await updateProductInFirebase(id, updates);
    if (fbResult.success) {
      const items = getStoredFallbackProducts();
      const updatedList = items.map(p => {
        if ((p._id || p.id) === id) {
          return { ...p, ...updates, updated_at: new Date().toISOString() };
        }
        return p;
      });
      saveStoredFallbackProducts(updatedList);
      broadcastProductChange('UPDATE', fbResult.product || { id, ...updates });
      return { success: true, message: 'Product updated in Firebase.', product: fbResult.product };
    }
  } catch (err) {
    console.warn('Firebase updateProduct note:', err.message);
  }

  // Local fallback
  const items = getStoredFallbackProducts();
  let updatedItem = null;
  const updatedList = items.map(p => {
    if ((p._id || p.id) === id) {
      updatedItem = { ...p, ...updates, updated_at: new Date().toISOString() };
      return updatedItem;
    }
    return p;
  });
  saveStoredFallbackProducts(updatedList);
  broadcastProductChange('UPDATE', updatedItem || { id, ...updates });
  return { success: true, message: 'Product updated.', product: updatedItem };
};

/**
 * Toggle product availability in Firebase Firestore
 */
export const toggleProductAvailabilityApi = async (tokenOrVendorId, id, is_available) => {
  try {
    const fbResult = await toggleProductAvailabilityInFirebase(id, is_available);
    if (fbResult.success) {
      const items = getStoredFallbackProducts();
      let updatedItem = null;
      const updatedList = items.map(p => {
        if ((p._id || p.id) === id) {
          updatedItem = {
            ...p,
            is_available,
            stockStatus: fbResult.stockStatus,
            updated_at: new Date().toISOString()
          };
          return updatedItem;
        }
        return p;
      });
      saveStoredFallbackProducts(updatedList);
      broadcastProductChange('TOGGLE_AVAILABILITY', updatedItem);
      return {
        success: true,
        is_available,
        stockStatus: fbResult.stockStatus,
        product: updatedItem
      };
    }
  } catch (err) {
    console.warn('Firebase toggleProductAvailability note:', err.message);
  }

  // Local fallback
  const items = getStoredFallbackProducts();
  let updatedItem = null;
  const updatedList = items.map(p => {
    if ((p._id || p.id) === id) {
      const nextAvail = is_available !== undefined ? Boolean(is_available) : !p.is_available;
      updatedItem = {
        ...p,
        is_available: nextAvail,
        stockStatus: nextAvail ? 'in-stock' : 'out-of-stock',
        updated_at: new Date().toISOString()
      };
      return updatedItem;
    }
    return p;
  });
  saveStoredFallbackProducts(updatedList);
  broadcastProductChange('TOGGLE_AVAILABILITY', updatedItem);
  return {
    success: true,
    is_available: updatedItem?.is_available,
    stockStatus: updatedItem?.stockStatus,
    product: updatedItem
  };
};

/**
 * Delete product from Firebase Firestore
 */
export const deleteVendorProductApi = async (tokenOrVendorId, id) => {
  try {
    const fbResult = await deleteProductFromFirebase(id);
    if (fbResult.success) {
      const items = getStoredFallbackProducts();
      const updated = items.filter(p => (p._id || p.id) !== id);
      saveStoredFallbackProducts(updated);
      broadcastProductChange('DELETE', { id });
      return { success: true, message: 'Product removed from Firebase.', id };
    }
  } catch (err) {
    console.warn('Firebase deleteProduct note:', err.message);
  }

  const items = getStoredFallbackProducts();
  const updated = items.filter(p => (p._id || p.id) !== id);
  saveStoredFallbackProducts(updated);
  broadcastProductChange('DELETE', { id });
  return { success: true, message: 'Product removed.', id };
};
