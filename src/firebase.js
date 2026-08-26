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
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp
} from "firebase/firestore";

// Read configuration strictly from environment variables (.env / GitHub Secrets / Vercel)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
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

export default app;
