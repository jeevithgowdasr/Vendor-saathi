import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  GeoPoint,
  Timestamp
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

// Read configuration strictly from environment variables (.env / GitHub Secrets / Vercel)
export const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID")
};

// Initialize Firebase safely with try/catch
let app = null;
let auth = null;
let db = null;
let storage = null;
let messaging = null;
let googleProvider = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  try {
    storage = getStorage(app);
  } catch (sErr) {
    console.warn("Firebase Storage init note (using local cache):", sErr.message);
  }
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
  } catch (mErr) {
    console.warn("Firebase Messaging init note (using local notifications):", mErr.message);
  }
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (initErr) {
  console.warn("Firebase initialization note (operating in offline/local state mode):", initErr.message);
}

// Safe onAuthStateChanged wrapper
const safeOnAuthStateChanged = (authInstance, nextOrObserver, error, completed) => {
  try {
    if (authInstance) {
      return onAuthStateChanged(authInstance, nextOrObserver, error, completed);
    }
  } catch (err) {
    console.warn("Firebase onAuthStateChanged notice:", err.message);
  }
  return () => {};
};

export { 
  app,
  auth,
  db,
  storage,
  messaging,
  googleProvider,
  safeOnAuthStateChanged as onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
};

/**
 * Save or update User Profile to Firebase Firestore
 */
export const saveUserProfileToFirebase = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid || `user_${Date.now()}`);
    const payload = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    await setDoc(userRef, payload, { merge: true });
    return { success: true };
  } catch (error) {
    console.warn("Firestore saveUserProfile note (using local cache):", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch User Profile from Firebase Firestore
 */
export const getUserProfileFromFirebase = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { success: true, data: snap.data() };
    }
    return { success: false, data: null };
  } catch (error) {
    console.warn("Firestore getUserProfile note:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Save customer order to Firebase Firestore in real-time
 */
export const saveOrderToFirebase = async (orderData) => {
  try {
    const orderRef = doc(db, "orders", orderData.id || `VS-${Date.now()}`);
    const payload = {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(orderRef, payload, { merge: true });
    return { success: true, orderId: orderData.id };
  } catch (error) {
    console.warn("Firestore saveOrder warning (using local fallback):", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update order delivery status in Firebase Firestore
 */
export const updateOrderStatusInFirebase = async (orderId, newStatus, extraData = {}) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...extraData
    });
    return { success: true };
  } catch (error) {
    console.warn("Firestore updateOrderStatus warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to all real-time orders from Firestore (for customer & general sync)
 */
export const subscribeToOrders = (callback) => {
  try {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    return onSnapshot(ordersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      callback(orders);
    }, (error) => {
      console.warn("Firestore order subscription warning:", error.message);
    });
  } catch (error) {
    console.warn("subscribeToOrders initialization error:", error.message);
    return () => {};
  }
};

/**
 * Listen to specific Vendor's incoming orders from Firestore (for Vendor App)
 */
export const subscribeToVendorOrders = (vendorId, callback) => {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("vendorId", "==", vendorId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(ordersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      callback(orders);
    }, (error) => {
      console.warn("subscribeToVendorOrders warning:", error.message);
    });
  } catch (error) {
    console.warn("subscribeToVendorOrders init error:", error.message);
    return () => {};
  }
};

/**
 * Update Vendor Live GPS Location & Delivery Rider state in Firestore
 */
export const updateVendorLiveLocation = async (vendorId, coords) => {
  try {
    const vendorRef = doc(db, "vendors", vendorId);
    await setDoc(vendorRef, {
      locationCoords: coords,
      lastSeen: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.warn("updateVendorLiveLocation warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update Vendor Store Status (Open / Busy / Closed) in Firestore
 */
export const updateVendorStoreStatus = async (vendorId, storeState) => {
  try {
    const vendorRef = doc(db, "vendors", vendorId);
    await setDoc(vendorRef, {
      status: storeState.status || (storeState.isOpen ? 'online' : 'offline'),
      isOpen: storeState.isOpen ?? true,
      statusLabel: storeState.statusLabel || (storeState.isOpen ? '🟢 Open Now' : '🔴 Closed'),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.warn("updateVendorStoreStatus warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send real-time chat message to Firestore
 */
export const sendChatMessageToFirebase = async (vendorId, message) => {
  try {
    const chatCol = collection(db, "vendors", vendorId, "chats");
    await addDoc(chatCol, {
      ...message,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.warn("Firestore sendChatMessage warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to vendor chat messages in real-time
 */
export const subscribeToVendorChat = (vendorId, callback) => {
  try {
    const chatCol = collection(db, "vendors", vendorId, "chats");
    const chatQuery = query(chatCol, orderBy("createdAt", "asc"));
    return onSnapshot(chatQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    }, (err) => {
      console.warn("subscribeToVendorChat error:", err.message);
    });
  } catch (error) {
    console.warn("subscribeToVendorChat init error:", error.message);
    return () => {};
  }
};

/**
 * Post customer review to Firestore
 */
export const saveReviewToFirebase = async (reviewData) => {
  try {
    const reviewCol = collection(db, "reviews");
    await addDoc(reviewCol, {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.warn("Firestore saveReview warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Save or create Product in Firebase Firestore
 */
export const saveProductToFirebase = async (productData) => {
  try {
    const prodId = productData.id || productData._id || `p_${Date.now()}`;
    const productRef = doc(db, "products", prodId);
    const vendorId = productData.vendor_id || productData.vendorId || "v1";
    const qty = Number(productData.available_quantity !== undefined ? productData.available_quantity : (productData.availableStock || 10));
    const isAvail = productData.is_available !== undefined ? Boolean(productData.is_available) : (qty > 0);
    const img = productData.image_url || productData.image || "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80";

    const payload = {
      id: prodId,
      _id: prodId,
      vendor_id: vendorId,
      vendorId: vendorId,
      vendorName: productData.vendorName || "Local Merchant",
      name: productData.name,
      shortName: productData.shortName || productData.name.split(' ')[0],
      category: productData.category,
      price: Number(productData.price),
      unit: productData.unit,
      available_quantity: qty,
      availableStock: qty,
      is_available: isAvail,
      stockStatus: isAvail ? (qty <= 2 && qty > 0 ? 'low-stock' : 'in-stock') : 'out-of-stock',
      image_url: img,
      image: img,
      description: productData.description || "",
      updatedAt: serverTimestamp()
    };

    if (!productData.createdAt && !productData.created_at) {
      payload.createdAt = serverTimestamp();
      payload.created_at = new Date().toISOString();
    }

    await setDoc(productRef, payload, { merge: true });
    return { success: true, product: { ...payload, id: prodId } };
  } catch (error) {
    console.warn("Firestore saveProduct warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch all products for a specific vendor from Firebase Firestore
 */
export const getVendorProductsFromFirebase = async (vendorId, { category, search } = {}) => {
  try {
    let q;
    if (vendorId) {
      q = query(
        collection(db, "products"),
        where("vendor_id", "==", vendorId)
      );
    } else {
      q = query(collection(db, "products"));
    }

    const snap = await getDocs(q);
    let products = [];
    snap.forEach((d) => {
      products.push({ id: d.id, ...d.data() });
    });

    // Also check if any products were stored with vendorId alias
    if (vendorId && products.length === 0) {
      const qAlt = query(collection(db, "products"), where("vendorId", "==", vendorId));
      const snapAlt = await getDocs(qAlt);
      snapAlt.forEach((d) => {
        products.push({ id: d.id, ...d.data() });
      });
    }

    if (category && category !== 'All' && category !== 'all') {
      const catLower = category.toLowerCase();
      products = products.filter(p => p.category?.toLowerCase() === catLower);
    }

    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => 
        p.name?.toLowerCase().includes(s) || 
        p.category?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
      );
    }

    return { success: true, count: products.length, products };
  } catch (error) {
    console.warn("Firestore getVendorProducts warning:", error.message);
    return { success: false, error: error.message, products: [] };
  }
};

/**
 * Fetch single product details from Firebase Firestore
 */
export const getProductFromFirebase = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    const snap = await getDoc(productRef);
    if (snap.exists()) {
      return { success: true, product: { id: snap.id, ...snap.data() } };
    }
    return { success: false, message: "Product not found in Firestore" };
  } catch (error) {
    console.warn("Firestore getProduct warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update product in Firebase Firestore
 */
export const updateProductInFirebase = async (productId, updates) => {
  try {
    const productRef = doc(db, "products", productId);
    const payload = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    if (updates.available_quantity !== undefined) {
      payload.availableStock = Number(updates.available_quantity);
    }
    if (updates.image_url) {
      payload.image = updates.image_url;
    }
    await updateDoc(productRef, payload);
    return { success: true, product: { id: productId, ...payload } };
  } catch (error) {
    console.warn("Firestore updateProduct warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Quick toggle for product in-stock / out-of-stock in Firebase Firestore
 */
export const toggleProductAvailabilityInFirebase = async (productId, is_available) => {
  try {
    const productRef = doc(db, "products", productId);
    const stockStatus = is_available ? "in-stock" : "out-of-stock";
    await updateDoc(productRef, {
      is_available,
      stockStatus,
      updatedAt: serverTimestamp()
    });
    return { success: true, is_available, stockStatus };
  } catch (error) {
    console.warn("Firestore toggleProductAvailability warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Delete product from Firebase Firestore
 */
export const deleteProductFromFirebase = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    return { success: true, id: productId };
  } catch (error) {
    console.warn("Firestore deleteProduct warning:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for vendor products from Firebase Firestore
 */
export const subscribeToVendorProducts = (vendorId, callback) => {
  try {
    const q = query(
      collection(db, "products"),
      where("vendor_id", "==", vendorId)
    );
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      callback(items);
    }, (err) => {
      console.warn("subscribeToVendorProducts snapshot warning:", err.message);
    });
  } catch (error) {
    console.warn("subscribeToVendorProducts error:", error.message);
    return () => {};
  }
};

/**
 * Real-time listener for all active products from Firebase Firestore
 */
export const subscribeToAllProducts = (callback) => {
  try {
    const q = query(collection(db, "products"));
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      callback(items);
    }, (err) => {
      console.warn("subscribeToAllProducts snapshot warning:", err.message);
    });
  } catch (error) {
    console.warn("subscribeToAllProducts error:", error.message);
    return () => {};
  }
};

// =============================================================================
// SCHEDULES / PLANNED VISITS FIRESTORE MANAGEMENT
// =============================================================================

/**
 * Format Firestore Timestamp safely into JS Date / ISO string
 */
export const formatFirestoreTimestamp = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  return null;
};

/**
 * Create a new planned visit schedule in Firebase Firestore
 */
export const createScheduleInFirebase = async (scheduleData) => {
  try {
    const schedulesCol = collection(db, "schedules");
    const scheduleDocRef = scheduleData.id ? doc(db, "schedules", scheduleData.id) : doc(schedulesCol);
    const scheduleId = scheduleDocRef.id;

    // Build GeoPoint safely
    const coords = scheduleData.area?.coordinates || { latitude: 13.0682, longitude: 74.9961 };
    const geoPoint = coords instanceof GeoPoint 
      ? coords 
      : new GeoPoint(Number(coords.latitude || coords.lat || 13.0682), Number(coords.longitude || coords.lng || 74.9961));

    // Build Arrival & Departure Timestamps safely
    const arrivalDate = scheduleData.expectedArrivalTime instanceof Date 
      ? scheduleData.expectedArrivalTime 
      : new Date(scheduleData.expectedArrivalTime);
    const departureDate = scheduleData.expectedDepartureTime instanceof Date 
      ? scheduleData.expectedDepartureTime 
      : new Date(scheduleData.expectedDepartureTime);

    const arrivalTimestamp = Timestamp.fromDate(arrivalDate);
    const departureTimestamp = Timestamp.fromDate(departureDate);

    const payload = {
      id: scheduleId,
      documentId: scheduleId,
      vendorId: scheduleData.vendorId || "v1",
      vendorName: scheduleData.vendorName || "Local Merchant",
      vendorCategory: scheduleData.vendorCategory || "Produce & Groceries",
      date: scheduleData.date || arrivalDate.toISOString().split('T')[0],
      area: {
        areaName: scheduleData.area?.areaName || "Vijayanagar",
        coordinates: geoPoint,
        serviceRadiusKm: Number(scheduleData.area?.serviceRadiusKm || 2.0)
      },
      expectedArrivalTime: arrivalTimestamp,
      expectedDepartureTime: departureTimestamp,
      availableProductIds: Array.isArray(scheduleData.availableProductIds) ? scheduleData.availableProductIds : [],
      status: scheduleData.status || "scheduled",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(scheduleDocRef, payload);
    return {
      success: true,
      schedule: {
        ...payload,
        expectedArrivalTime: arrivalDate.toISOString(),
        expectedDepartureTime: departureDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.warn("Firestore createSchedule error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch all planned schedules for a vendor from Firebase Firestore
 */
export const getVendorSchedulesFromFirebase = async (vendorId, { status, date } = {}) => {
  try {
    const schedulesCol = collection(db, "schedules");
    let q;

    if (vendorId) {
      q = query(
        schedulesCol,
        where("vendorId", "==", vendorId),
        orderBy("expectedArrivalTime", "asc")
      );
    } else {
      q = query(schedulesCol, orderBy("expectedArrivalTime", "asc"));
    }

    const snap = await getDocs(q);
    let schedules = [];
    snap.forEach((d) => {
      const data = d.data();
      schedules.push({
        id: d.id,
        documentId: d.id,
        ...data,
        expectedArrivalDate: formatFirestoreTimestamp(data.expectedArrivalTime),
        expectedDepartureDate: formatFirestoreTimestamp(data.expectedDepartureTime)
      });
    });

    if (status && status !== 'all') {
      schedules = schedules.filter(s => s.status === status);
    }

    if (date) {
      schedules = schedules.filter(s => s.date === date);
    }

    return { success: true, count: schedules.length, schedules };
  } catch (error) {
    console.warn("Firestore getVendorSchedules warning:", error.message);
    return { success: false, error: error.message, schedules: [] };
  }
};

/**
 * Fetch a single schedule by ID from Firebase Firestore
 */
export const getScheduleFromFirebase = async (scheduleId) => {
  try {
    const scheduleRef = doc(db, "schedules", scheduleId);
    const snap = await getDoc(scheduleRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        success: true,
        schedule: {
          id: snap.id,
          documentId: snap.id,
          ...data,
          expectedArrivalDate: formatFirestoreTimestamp(data.expectedArrivalTime),
          expectedDepartureDate: formatFirestoreTimestamp(data.expectedDepartureTime)
        }
      };
    }
    return { success: false, message: "Schedule not found in Firestore" };
  } catch (error) {
    console.warn("Firestore getSchedule error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing planned visit schedule in Firebase Firestore
 */
export const updateScheduleInFirebase = async (scheduleId, updates) => {
  try {
    const scheduleRef = doc(db, "schedules", scheduleId);
    const payload = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    if (updates.expectedArrivalTime) {
      const arrDate = updates.expectedArrivalTime instanceof Date ? updates.expectedArrivalTime : new Date(updates.expectedArrivalTime);
      payload.expectedArrivalTime = Timestamp.fromDate(arrDate);
    }

    if (updates.expectedDepartureTime) {
      const depDate = updates.expectedDepartureTime instanceof Date ? updates.expectedDepartureTime : new Date(updates.expectedDepartureTime);
      payload.expectedDepartureTime = Timestamp.fromDate(depDate);
    }

    if (updates.area?.coordinates) {
      const c = updates.area.coordinates;
      payload["area.coordinates"] = c instanceof GeoPoint ? c : new GeoPoint(Number(c.latitude || c.lat), Number(c.longitude || c.lng));
    }

    await updateDoc(scheduleRef, payload);
    return { success: true, id: scheduleId, updates: payload };
  } catch (error) {
    console.warn("Firestore updateSchedule error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update the execution status of a planned visit ("scheduled" | "in_transit" | "arrived" | "completed" | "cancelled")
 */
export const updateScheduleStatusInFirebase = async (scheduleId, newStatus) => {
  try {
    const scheduleRef = doc(db, "schedules", scheduleId);
    await updateDoc(scheduleRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    return { success: true, id: scheduleId, status: newStatus };
  } catch (error) {
    console.warn("Firestore updateScheduleStatus error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a planned visit schedule in Firebase Firestore
 */
export const cancelScheduleInFirebase = async (scheduleId) => {
  return updateScheduleStatusInFirebase(scheduleId, "cancelled");
};

/**
 * Delete a schedule document from Firebase Firestore
 */
export const deleteScheduleFromFirebase = async (scheduleId) => {
  try {
    const scheduleRef = doc(db, "schedules", scheduleId);
    await deleteDoc(scheduleRef);
    return { success: true, id: scheduleId };
  } catch (error) {
    console.warn("Firestore deleteSchedule error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for vendor's planned schedules from Firebase Firestore
 */
export const subscribeToVendorSchedules = (vendorId, callback) => {
  try {
    const schedulesCol = collection(db, "schedules");
    const q = query(
      schedulesCol,
      where("vendorId", "==", vendorId),
      orderBy("expectedArrivalTime", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const schedules = [];
      snapshot.forEach((d) => {
        const data = d.data();
        schedules.push({
          id: d.id,
          documentId: d.id,
          ...data,
          expectedArrivalDate: formatFirestoreTimestamp(data.expectedArrivalTime),
          expectedDepartureDate: formatFirestoreTimestamp(data.expectedDepartureTime)
        });
      });
      callback(schedules);
    }, (err) => {
      console.warn("subscribeToVendorSchedules snapshot warning:", err.message);
    });
  } catch (error) {
    console.warn("subscribeToVendorSchedules error:", error.message);
    return () => {};
  }
};

/**
 * Real-time listener for all upcoming community visits from Firebase Firestore
 */
export const subscribeToUpcomingSchedules = (callback) => {
  try {
    const schedulesCol = collection(db, "schedules");
    const q = query(
      schedulesCol,
      where("status", "in", ["scheduled", "in_transit", "arrived"]),
      orderBy("expectedArrivalTime", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const schedules = [];
      snapshot.forEach((d) => {
        const data = d.data();
        schedules.push({
          id: d.id,
          documentId: d.id,
          ...data,
          expectedArrivalDate: formatFirestoreTimestamp(data.expectedArrivalTime),
          expectedDepartureDate: formatFirestoreTimestamp(data.expectedDepartureTime)
        });
      });
      callback(schedules);
    }, (err) => {
      console.warn("subscribeToUpcomingSchedules snapshot warning:", err.message);
    });
  } catch (error) {
    console.warn("subscribeToUpcomingSchedules error:", error.message);
    return () => {};
  }
};

/**
 * Log detected conflict and resolution decision to Firebase Firestore
 */
export const logConflictToFirebase = async (conflictData) => {
  try {
    const conflictsCol = collection(db, "conflicts");
    const docRef = await addDoc(conflictsCol, {
      ...conflictData,
      resolvedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    console.warn("Firestore logConflict warning:", err.message);
    return { success: false, error: err.message };
  }
};

// =============================================================================
// MODULE 3: FIREBASE STORAGE — PRODUCT IMAGES
// =============================================================================

/**
 * Upload product image to Firebase Storage with resilient fallback to base64 DataURL
 */
export const uploadProductImageToStorage = async (file, vendorId = 'v1') => {
  try {
    if (storage && file && file.name) {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileRef = storageRef(storage, `products/${vendorId}/${Date.now()}_${sanitizedName}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    }
  } catch (storageErr) {
    console.warn("Firebase Storage upload note (using resilient client FileReader):", storageErr.message);
  }

  // Resilient fallback for local testing / offline storage
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve({ success: true, url: e.target.result });
    reader.onerror = () => resolve({ success: false, url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80" });
    reader.readAsDataURL(file);
  });
};

// =============================================================================
// MODULE 5: FIREBASE CLOUD MESSAGING (FCM) CLIENT LISTENERS
// =============================================================================

/**
 * Request notification permission and register FCM device token for user
 */
export const requestFCMNotificationPermission = async (userId) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, reason: 'NOT_SUPPORTED' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'PERMISSION_DENIED' };
    }

    if (messaging) {
      const currentToken = await getToken(messaging, {
        vapidKey: getEnvVar("VITE_FIREBASE_VAPID_KEY") || undefined
      });

      if (currentToken && userId) {
        await setDoc(doc(db, "users", userId), {
          fcmToken: currentToken,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return { success: true, token: currentToken };
      }
    }
    return { success: true, token: 'browser_notification_enabled' };
  } catch (fcmErr) {
    console.warn("FCM getToken note:", fcmErr.message);
    return { success: false, error: fcmErr.message };
  }
};

/**
 * Real-time listener for incoming FCM foreground notifications
 */
export const onFCMMessageListener = (callback) => {
  if (!messaging) return () => {};
  try {
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (err) {
    console.warn("onMessage listener error:", err.message);
    return () => {};
  }
};

// =============================================================================
// MODULE 8: LIVE GEOLOCATION TELEMETRY & GEOFENCING
// =============================================================================

/**
 * Stream vendor live GPS coordinates to Firestore schedules/{scheduleId}.liveCoordinates
 */
export const streamVendorLiveLocation = (scheduleId, onLocationUpdate, onError) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError?.(new Error("Geolocation is not supported on this device."));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const geoPoint = new GeoPoint(latitude, longitude);

      try {
        if (scheduleId) {
          const scheduleRef = doc(db, "schedules", scheduleId);
          await updateDoc(scheduleRef, {
            liveCoordinates: geoPoint,
            lastTelemetryAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn("Schedule telemetry update notice:", e.message);
      }

      onLocationUpdate?.({
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp: position.timestamp
      });
    },
    (err) => {
      console.warn("Geolocation watchPosition notice:", err.message);
      onError?.(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000
    }
  );

  return watchId;
};

/**
 * Stop GPS telemetry stream
 */
export const stopVendorLiveLocationStream = (watchId) => {
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// =============================================================================
// MODULE 7: ADDITIONAL ITEM REQUESTS LIFECYCLE
// =============================================================================

/**
 * Customer requests an additional item while vendor is 'on_the_way' or 'nearby'
 */
export const requestAdditionalItemInFirebase = async (orderId, additionalItem) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return { success: false, error: "Order not found" };
    }

    const currentOrder = orderSnap.data();
    const currentItems = currentOrder.items || [];

    const newItem = {
      productId: additionalItem.id || additionalItem.productId || `addon_${Date.now()}`,
      name: additionalItem.name,
      price: Number(additionalItem.price),
      unit: additionalItem.unit || 'unit',
      quantity: Number(additionalItem.quantity || 1),
      isAdditionalRequest: true,
      requestStatus: 'pending',
      requestedAt: new Date().toISOString()
    };

    const updatedItems = [...currentItems, newItem];

    await updateDoc(orderRef, {
      items: updatedItems,
      hasPendingAddon: true,
      updatedAt: serverTimestamp()
    });

    return { success: true, item: newItem };
  } catch (err) {
    console.warn("requestAdditionalItemInFirebase error:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Vendor accepts or rejects customer's additional item request
 */
export const respondToAdditionalItemInFirebase = async (orderId, productId, decision) => {
  // decision: 'accepted' | 'rejected'
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return { success: false, error: "Order not found" };

    const currentOrder = orderSnap.data();
    let currentItems = currentOrder.items || [];
    let priceDelta = 0;

    currentItems = currentItems.map(item => {
      if ((item.productId === productId || item.id === productId) && item.isAdditionalRequest) {
        if (decision === 'accepted') {
          priceDelta = Number(item.price) * Number(item.quantity || 1);
        }
        return { ...item, requestStatus: decision };
      }
      return item;
    });

    const newTotal = (currentOrder.totalAmount || currentOrder.total || 0) + priceDelta;
    const hasRemainingPending = currentItems.some(i => i.isAdditionalRequest && i.requestStatus === 'pending');

    await updateDoc(orderRef, {
      items: currentItems,
      totalAmount: newTotal,
      total: newTotal,
      hasPendingAddon: hasRemainingPending,
      updatedAt: serverTimestamp()
    });

    return { success: true, decision, newTotal };
  } catch (err) {
    console.warn("respondToAdditionalItemInFirebase error:", err.message);
    return { success: false, error: err.message };
  }
};

// =============================================================================
// MODULE 9: RATINGS & REVIEWS
// =============================================================================

/**
 * Submit order rating and review to ratings collection
 */
export const submitOrderRatingToFirebase = async ({ orderId, vendorId, customerId, customerName, score, feedbackText }) => {
  try {
    const ratingsCol = collection(db, "ratings");
    const payload = {
      orderId,
      vendorId,
      customerId,
      customerName: customerName || "Customer",
      score: Number(score),
      feedbackText: feedbackText || "",
      createdAt: serverTimestamp()
    };
    const ratingDoc = await addDoc(ratingsCol, payload);

    // Update order status marked as rated
    if (orderId) {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        isRated: true,
        ratingScore: Number(score),
        ratingId: ratingDoc.id
      }).catch(e => console.warn("Order rating mark note:", e.message));
    }

    return { success: true, ratingId: ratingDoc.id };
  } catch (err) {
    console.warn("submitOrderRatingToFirebase warning:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch ratings for vendor
 */
export const getVendorRatingsFromFirebase = async (vendorId) => {
  try {
    const ratingsCol = collection(db, "ratings");
    const q = query(ratingsCol, where("vendorId", "==", vendorId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const ratings = [];
    snap.forEach(d => ratings.push({ id: d.id, ...d.data() }));
    return { success: true, ratings };
  } catch (err) {
    console.warn("getVendorRatingsFromFirebase notice:", err.message);
    return { success: false, ratings: [] };
  }
};

// =============================================================================
// MODULE 10: ADMIN MANAGEMENT & CATEGORY CONTROLS
// =============================================================================

/**
 * Fetch all registered users for Admin Panel
 */
export const getAllUsersFromFirebase = async () => {
  try {
    const usersCol = collection(db, "users");
    const snap = await getDocs(usersCol);
    const users = [];
    snap.forEach(d => users.push({ uid: d.id, id: d.id, ...d.data() }));
    return { success: true, users };
  } catch (err) {
    console.warn("getAllUsersFromFirebase notice:", err.message);
    return { success: false, users: [] };
  }
};

/**
 * Update user status (active | blocked | pending) in Firebase Firestore
 */
export const updateUserStatusInFirebase = async (userId, newStatus) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status: newStatus,
      statusUpdatedAt: serverTimestamp()
    });
    return { success: true, userId, status: newStatus };
  } catch (err) {
    console.warn("updateUserStatusInFirebase warning:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch all platform categories from Firestore
 */
export const getCategoriesFromFirebase = async () => {
  try {
    const catCol = collection(db, "categories");
    const snap = await getDocs(catCol);
    const categories = [];
    snap.forEach(d => categories.push({ categoryId: d.id, id: d.id, ...d.data() }));
    return { success: true, categories };
  } catch (err) {
    console.warn("getCategoriesFromFirebase notice:", err.message);
    return { success: false, categories: [] };
  }
};

/**
 * Save or update category in Firestore
 */
export const saveCategoryToFirebase = async (categoryData) => {
  try {
    const catId = categoryData.categoryId || categoryData.id || `cat_${Date.now()}`;
    const catRef = doc(db, "categories", catId);
    const payload = {
      categoryId: catId,
      name: categoryData.name,
      icon: categoryData.icon || "🛒",
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      updatedAt: serverTimestamp()
    };
    await setDoc(catRef, payload, { merge: true });
    return { success: true, category: payload };
  } catch (err) {
    console.warn("saveCategoryToFirebase warning:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Delete category from Firestore
 */
export const deleteCategoryFromFirebase = async (categoryId) => {
  try {
    const catRef = doc(db, "categories", categoryId);
    await deleteDoc(catRef);
    return { success: true, id: categoryId };
  } catch (err) {
    console.warn("deleteCategoryFromFirebase warning:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch all complaints for Admin Panel
 */
export const getAllComplaintsFromFirebase = async () => {
  try {
    const compCol = collection(db, "complaints");
    const snap = await getDocs(compCol);
    const complaints = [];
    snap.forEach(d => complaints.push({ complaintId: d.id, id: d.id, ...d.data() }));
    return { success: true, complaints };
  } catch (err) {
    console.warn("getAllComplaintsFromFirebase notice:", err.message);
    return { success: false, complaints: [] };
  }
};

/**
 * Resolve complaint in Firestore
 */
export const resolveComplaintInFirebase = async (complaintId, resolutionNote) => {
  try {
    const compRef = doc(db, "complaints", complaintId);
    await updateDoc(compRef, {
      status: 'resolved',
      resolutionNote: resolutionNote || 'Resolved by Administrator',
      resolvedAt: serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    console.warn("resolveComplaintInFirebase warning:", err.message);
    return { success: false, error: err.message };
  }
};

export default app;




