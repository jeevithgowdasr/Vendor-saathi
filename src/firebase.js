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
let googleProvider = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
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

export default app;



