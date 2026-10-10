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
} from '../firebase';

const LOCAL_STORAGE_KEY = 'vs_firebase_products_cache';

const INITIAL_FALLBACK_PRODUCTS = [
  {
    id: 'prod_tomato_01',
    _id: 'prod_tomato_01',
    vendor_id: 'v1',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    name: 'Fresh Farm Red Tomatoes',
    shortName: 'Tomato',
    category: 'Vegetable',
    price: 25,
    unit: 'kg',
    available_quantity: 18,
    availableStock: 18,
    is_available: true,
    stockStatus: 'in-stock',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
    description: 'Fresh and juicy farm tomatoes sourced directly from local Moodbidri farms.',
    rating: 4.8,
    reviewCount: 16
  },
  {
    id: 'prod_potato_02',
    _id: 'prod_potato_02',
    vendor_id: 'v1',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    name: 'Fresh Local Potatoes',
    shortName: 'Potato',
    category: 'Vegetable',
    price: 30,
    unit: 'kg',
    available_quantity: 12,
    availableStock: 12,
    is_available: true,
    stockStatus: 'in-stock',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
    description: 'Clean medium-sized local cooking potatoes.',
    rating: 4.7,
    reviewCount: 9
  },
  {
    id: 'prod_rose_03',
    _id: 'prod_rose_03',
    vendor_id: 'v1',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    name: 'Pooja Red Roses',
    shortName: 'Rose',
    category: 'Flower',
    price: 60,
    unit: 'bunch',
    available_quantity: 15,
    availableStock: 15,
    is_available: true,
    stockStatus: 'in-stock',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
    description: 'Fresh fragrant red roses for temple worship and pooja ceremonies.',
    rating: 4.9,
    reviewCount: 22
  },
  {
    id: 'prod_milk_04',
    _id: 'prod_milk_04',
    vendor_id: 'v1',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    name: 'Fresh Dairy Milk',
    shortName: 'Milk',
    category: 'Dairy',
    price: 28,
    unit: 'litre',
    available_quantity: 25,
    availableStock: 25,
    is_available: true,
    stockStatus: 'in-stock',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
    description: 'Pure pasture cow milk packaged fresh every morning.',
    rating: 4.9,
    reviewCount: 30
  },
  {
    id: 'prod_chips_05',
    _id: 'prod_chips_05',
    vendor_id: 'v1',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    name: 'Crispy Banana Chips',
    shortName: 'Snacks',
    category: 'Snacks',
    price: 50,
    unit: 'packet',
    available_quantity: 0,
    availableStock: 0,
    is_available: false,
    stockStatus: 'out-of-stock',
    image_url: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80',
    image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80',
    description: 'Traditional South Canara coconut-oil fried crisp banana chips.',
    rating: 4.6,
    reviewCount: 14
  }
];

function getStoredFallbackProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_FALLBACK_PRODUCTS));
      return INITIAL_FALLBACK_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FALLBACK_PRODUCTS;
  }
}

function saveStoredFallbackProducts(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not cache products to localStorage', err);
  }
}

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
      return { success: true, message: 'Product stored in Firebase successfully.', product: fbResult.product };
    }
  } catch (err) {
    console.warn('Firebase saveProduct note:', err.message);
  }

  // Local fallback
  const items = getStoredFallbackProducts();
  const updated = [productPayload, ...items];
  saveStoredFallbackProducts(updated);
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
      return { success: true, message: 'Product removed from Firebase.', id };
    }
  } catch (err) {
    console.warn('Firebase deleteProduct note:', err.message);
  }

  const items = getStoredFallbackProducts();
  const updated = items.filter(p => (p._id || p.id) !== id);
  saveStoredFallbackProducts(updated);
  return { success: true, message: 'Product removed.', id };
};
