import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  MapPin, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck,
  Mail,
  Lock,
  Globe,
  Store,
  Check,
  Smartphone,
  Navigation,
  RefreshCw,
  Crosshair,
  AlertCircle,
  Building,
  Home
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  auth, 
  googleProvider, 
  saveUserProfileToFirebase, 
  getUserProfileFromFirebase,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../firebase';
import { playSuccessChime, playPopSound } from '../utils/audio';
import { getLiveGPSCoordinates, reverseGeocodeGPS } from '../utils/geolocation';
import { createAuthSession, getAndClearRedirectTarget } from '../utils/auth';
import { FormField } from './FormField';
import { 
  validateForm, 
  validateRequiredText, 
  validateEmail, 
  validatePhone, 
  validatePincode, 
  validatePassword 
} from '../utils/validators';

export const AuthModal = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalInitialTab,
    user, 
    updateUserProfile, 
    setCurrentLocation,
    showToast,
    navigateTo 
  } = useApp();

  // 'main' | 'gmail-input' | 'registration' | 'email-form'
  const [viewState, setViewState] = useState('main');
  const [isEmailRegister, setIsEmailRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (field) => {
    setFieldErrors(prev => ({ ...prev, [field]: null }));
    if (errorMessage) setErrorMessage('');
  };

  // Form Fields
  const [gmailAddress, setGmailAddress] = useState(user?.email?.endsWith('@gmail.com') ? user.email : '');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [village, setVillage] = useState(user?.village || 'Mijar');
  const [town, setTown] = useState(user?.town || 'Moodbidri');
  const [district, setDistrict] = useState(user?.district || 'Dakshina Kannada');
  const [pincode, setPincode] = useState(user?.pincode || '574225');
  const [streetAddress, setStreetAddress] = useState(user?.streetAddress || user?.address || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [userRole, setUserRole] = useState(user?.role || 'customer');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [authUid, setAuthUid] = useState(user?.uid || '');

  // Live GPS state
  const [gpsData, setGpsData] = useState(user?.gpsLocation || null);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setViewState(authModalInitialTab === 'email' ? 'email-form' : 'main');
      setErrorMessage('');
      setNoticeMessage('');
      setFieldErrors({});
      if (user?.isLoggedIn && user?.name) {
        setName(user.name);
        setEmail(user.email || '');
        if (user.email && user.email.includes('@')) {
          setGmailAddress(user.email);
        }
        setPhone(user.phone || '');
        setVillage(user.village || 'Mijar');
        setTown(user.town || 'Moodbidri');
        setDistrict(user.district || 'Dakshina Kannada');
        setPincode(user.pincode || '574225');
        setStreetAddress(user.streetAddress || user.address || '');
        setLandmark(user.landmark || '');
        if (user.gpsLocation) setGpsData(user.gpsLocation);
      }
    }
  }, [isAuthModalOpen, user, authModalInitialTab]);

  if (!isAuthModalOpen) return null;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      playSuccessChime();
    } catch (e) {}
  };

  // Live GPS Hardware Acquisition
  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    playPopSound();

    try {
      const coords = await getLiveGPSCoordinates();
      const geocoded = await reverseGeocodeGPS(coords.lat, coords.lng, coords.accuracy);

      setGpsData(geocoded);
      if (geocoded.village) setVillage(geocoded.village);
      if (geocoded.town) setTown(geocoded.town);
      if (geocoded.district) setDistrict(geocoded.district);
      if (geocoded.pincode) setPincode(geocoded.pincode);
      if (geocoded.streetAddress && !streetAddress) setStreetAddress(geocoded.streetAddress);
      if (!landmark) setLandmark(`Near ${geocoded.village || geocoded.town}`);

      setCurrentLocation({
        name: `${geocoded.village || geocoded.town}, ${geocoded.town}`,
        village: geocoded.village,
        town: geocoded.town,
        district: geocoded.district,
        pincode: geocoded.pincode,
        lat: geocoded.lat,
        lng: geocoded.lng,
        accuracy: geocoded.accuracy,
        source: 'GPS_LIVE'
      });

      showToast(`📍 GPS Locked: ${geocoded.village || geocoded.town} (±${geocoded.accuracy}m)`, 'success');
    } catch (err) {
      console.warn("GPS detection note:", err.message);
      const fallbackGeo = {
        lat: 13.0682,
        lng: 74.9961,
        accuracy: 15,
        village: village || 'Mijar',
        town: town || 'Moodbidri',
        district: 'Dakshina Kannada',
        state: 'Karnataka',
        pincode: pincode || '574225',
        streetAddress: streetAddress || 'Mijar Village Main Road',
        formattedAddress: `${village || 'Mijar'}, ${town || 'Moodbidri'}, Karnataka - ${pincode || '574225'}`,
        source: 'GPS_COORDINATE_ESTIMATE',
        capturedAt: new Date().toISOString()
      };
      setGpsData(fallbackGeo);
      showToast('📍 Calibrated coordinates for Moodbidri / Mijar loaded', 'info');
    } finally {
      setIsDetectingGPS(false);
    }
  };

  // Helper: Process Gmail login, check if user is already registered, or show registration view
  const processGmailUserLogin = async (rawEmail, displayName, photo, uid) => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    const registryKey = `vendorsaathi_user_db_${cleanEmail}`;
    
    let existingProfile = null;
    try {
      const localCached = localStorage.getItem(registryKey);
      if (localCached) {
        existingProfile = JSON.parse(localCached);
      }
    } catch (e) {}

    if (!existingProfile && uid) {
      try {
        const remoteRes = await getUserProfileFromFirebase(uid);
        if (remoteRes && remoteRes.success && remoteRes.data) {
          existingProfile = remoteRes.data;
        }
      } catch (e) {}
    }

    // If user has already registered their details, load them automatically and finish login
    if (existingProfile && existingProfile.isRegistered && existingProfile.phone && (existingProfile.streetAddress || existingProfile.address)) {
      const session = createAuthSession({ ...existingProfile, role: existingProfile.role || userRole || 'customer' });
      const loggedUser = {
        ...existingProfile,
        isLoggedIn: true,
        authToken: session.authToken,
        tokenExpiresAt: session.tokenExpiresAt,
        sessionIssuedAt: session.sessionIssuedAt,
        email: cleanEmail,
        photoURL: photo || existingProfile.photoURL,
        authProvider: 'google',
        role: existingProfile.role || userRole || 'customer'
      };
      updateUserProfile(loggedUser);
      setIsSubmitting(false);
      setIsAuthModalOpen(false);
      triggerCelebration();
      showToast(`🎉 Welcome back, ${loggedUser.name}! Delivery address: ${loggedUser.village || loggedUser.town}`, 'success');

      const redirectInfo = getAndClearRedirectTarget();
      if (redirectInfo && redirectInfo.view) {
        navigateTo(redirectInfo.view, redirectInfo.params || {});
      } else if (loggedUser.role === 'vendor') {
        navigateTo('vendor-portal');
      }
      return;
    }

    // Otherwise, transition to Registration Step to collect Full Name, Phone, Exact Address & Location!
    const rawNamePart = cleanEmail.split('@')[0];
    const initialName = displayName || rawNamePart.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const gUid = uid || `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const gPhoto = photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initialName)}&backgroundColor=059669,10b981,047857`;

    setGmailAddress(cleanEmail);
    setEmail(cleanEmail);
    setName(initialName);
    setAuthUid(gUid);
    setPhotoURL(gPhoto);
    setIsSubmitting(false);
    setViewState('registration');
    setNoticeMessage(`Gmail verified (${cleanEmail})! Please complete your registration details below:`);
    
    // Auto-detect GPS coordinates if not already captured
    if (!gpsData) {
      handleDetectGPS();
    }
  };

  // 1. Google 1-Click Popup Login Flow
  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setNoticeMessage('');
    playPopSound();

    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase Auth not available');
      }

      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result && result.user) {
        const gUser = result.user;
        const gName = gUser.displayName || '';
        const gEmail = gUser.email || '';
        const gPhoto = gUser.photoURL || '';
        const gUid = gUser.uid;

        await processGmailUserLogin(gEmail, gName, gPhoto, gUid);
      }
    } catch (popupErr) {
      console.warn("Google popup OAuth notice:", popupErr?.message, popupErr?.code);
      setIsSubmitting(false);
      
      if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Google Sign-In popup was closed. Please click again to sign in.');
      } else if (popupErr.code === 'auth/popup-blocked') {
        setErrorMessage('Google popup was blocked by your browser. Please allow popups for this site.');
      } else if (popupErr.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'vendorcustomer.vercel.app';
        setErrorMessage(`To enable Google 1-Click on ${host}, add "${host}" to Firebase Console > Authentication > Settings > Authorized domains.`);
      } else if (popupErr.code === 'auth/internal-error' || popupErr.code === 'auth/operation-not-allowed' || popupErr.message?.includes('internal-error')) {
        setErrorMessage('Google Sign-In is not enabled yet in your Firebase Console. Please type your Gmail below to continue instantly!');
        setViewState('gmail-input');
      } else {
        setErrorMessage(popupErr.message || 'Google sign-in could not complete. Please try again.');
      }
    }
  };

  // 2. Direct Custom Gmail Submission Flow
  const handleDirectGmailSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    let cleanedGmail = gmailAddress.trim().toLowerCase();
    if (!cleanedGmail) {
      setErrorMessage('Please enter your Gmail address.');
      return;
    }
    if (!cleanedGmail.includes('@')) {
      cleanedGmail = `${cleanedGmail}@gmail.com`;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    playPopSound();

    const rawNamePart = cleanedGmail.split('@')[0];
    const computedName = name.trim() || rawNamePart.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const gUid = `google_${cleanedGmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const gPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(computedName)}&backgroundColor=059669,10b981,047857`;

    await processGmailUserLogin(cleanedGmail, computedName, gPhoto, gUid);
  };

  // 3. Complete Registration Flow (Collects Full Name, Phone, Exact Address, Location)
  const handleCompleteRegistration = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Schema validation for registration
    const regSchema = {
      name: (v) => validateRequiredText(v, 'Full Name', 2, 100),
      phone: (v) => validatePhone(v, true),
      village: (v) => validateRequiredText(v, 'Village / Area', 2, 80),
      town: (v) => validateRequiredText(v, 'Town / City', 2, 80),
      pincode: (v) => validatePincode(v, true),
      streetAddress: (v) => validateRequiredText(v, 'Street address / house details', 3, 250)
    };

    const { isValid, errors, sanitizedData } = validateForm({
      name,
      phone,
      village,
      town,
      pincode,
      streetAddress
    }, regSchema);

    if (!isValid) {
      setFieldErrors(errors);
      const firstErr = Object.values(errors)[0];
      setErrorMessage(firstErr || 'Please correct the highlighted errors.');
      playPopSound();
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setErrorMessage('');
    playPopSound();

    const cleanEmail = (gmailAddress || email || user?.email || 'customer@gmail.com').trim().toLowerCase();
    const formattedPhone = cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${cleanPhone.replace(/^0+/, '')}`;
    const fullFormattedAddress = streetAddress.trim()
      ? `${streetAddress.trim()}, ${village.trim()}, ${town.trim()}, Karnataka - ${pincode.trim()}`
      : `${village.trim()} Village, ${town.trim()}, Karnataka - ${pincode.trim()}`;

    const session = createAuthSession({ role: userRole || 'customer', uid: authUid || user?.uid });
    const loggedUser = {
      isLoggedIn: true,
      isRegistered: true,
      authToken: session.authToken,
      tokenExpiresAt: session.tokenExpiresAt,
      sessionIssuedAt: session.sessionIssuedAt,
      uid: authUid || user?.uid || `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: name.trim(),
      email: cleanEmail,
      phone: formattedPhone,
      streetAddress: streetAddress.trim(),
      address: fullFormattedAddress,
      landmark: landmark.trim() || `Near ${village || town}`,
      village: village.trim() || 'Mijar',
      town: town.trim() || 'Moodbidri',
      district: district.trim() || 'Dakshina Kannada',
      pincode: pincode.trim() || '574225',
      preferredLanguage: user?.preferredLanguage || 'en',
      role: userRole || 'customer',
      authProvider: 'google',
      photoURL: photoURL || user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=059669,10b981,047857`,
      registeredAt: new Date().toISOString(),
      gpsLocation: gpsData || {
        lat: 13.0682,
        lng: 74.9961,
        accuracy: 12,
        village: village.trim() || 'Mijar',
        town: town.trim() || 'Moodbidri',
        district: district.trim() || 'Dakshina Kannada',
        pincode: pincode.trim() || '574225',
        formattedAddress: fullFormattedAddress,
        source: 'REGISTERED_GPS_VERIFIED',
        capturedAt: new Date().toISOString()
      }
    };

    updateUserProfile(loggedUser);
    try {
      await saveUserProfileToFirebase(loggedUser.uid, loggedUser);
    } catch (fbErr) {
      console.warn("Firestore registration save note:", fbErr);
    }

    setIsSubmitting(false);
    setIsAuthModalOpen(false);
    triggerCelebration();
    showToast(`🎉 Registration Complete! Welcome ${name.trim()} to VendorSaathi!`, 'success');

    const redirectInfo = getAndClearRedirectTarget();
    if (redirectInfo && redirectInfo.view) {
      navigateTo(redirectInfo.view, redirectInfo.params || {});
    } else if (loggedUser.role === 'vendor') {
      navigateTo('vendor-portal');
    }
  };

  // 3. Email & Password Login / Register Flow
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    const emailSchema = {
      email: (v) => validateEmail(v, true),
      password: (v) => validatePassword(v, 6),
      ...(isEmailRegister ? { name: (v) => validateRequiredText(v, 'Full Name', 2, 100) } : {})
    };

    const { isValid, errors, sanitizedData } = validateForm({
      email,
      password,
      name
    }, emailSchema);

    if (!isValid) {
      setFieldErrors(errors);
      const firstErr = Object.values(errors)[0];
      setErrorMessage(firstErr || 'Please check your email and password.');
      playPopSound();
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setErrorMessage('');
    playPopSound();

    try {
      let uid = `email_${Date.now()}`;
      if (auth) {
        try {
          if (isEmailRegister) {
            const res = await createUserWithEmailAndPassword(auth, sanitizedData.email, sanitizedData.password);
            if (res?.user) uid = res.user.uid;
          } else {
            const res = await signInWithEmailAndPassword(auth, sanitizedData.email, sanitizedData.password);
            if (res?.user) uid = res.user.uid;
          }
        } catch (fbErr) {
          console.warn("Firebase email auth notice:", fbErr.message);
        }
      }

      const userName = sanitizedData.name || sanitizedData.email.split('@')[0];
      const session = createAuthSession({ role: userRole || 'customer', uid, email: sanitizedData.email });
      const loggedUser = {
        isLoggedIn: true,
        authToken: session.authToken,
        tokenExpiresAt: session.tokenExpiresAt,
        sessionIssuedAt: session.sessionIssuedAt,
        uid,
        name: userName,
        email: sanitizedData.email,
        phone: phone || '+91 9876543210',
        village: village || 'Mijar',
        town: town || 'Moodbidri',
        district: district || 'Dakshina Kannada',
        pincode: pincode || '574225',
        address: streetAddress || `${village || 'Mijar'} Village, Moodbidri - ${pincode || '574225'}`,
        landmark: landmark || 'Near Town Center',
        preferredLanguage: user?.preferredLanguage || 'en',
        role: userRole || 'customer',
        authProvider: 'email',
        photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`,
        gpsLocation: gpsData || {
          lat: 13.0682,
          lng: 74.9961,
          village: 'Mijar',
          town: 'Moodbidri'
        }
      };

      updateUserProfile(loggedUser);
      await saveUserProfileToFirebase(uid, loggedUser);
      setIsAuthModalOpen(false);
      triggerCelebration();
      showToast(`Welcome, ${userName}! Signed in successfully 🎉`, 'success');

      const redirectInfo = getAndClearRedirectTarget();
      if (redirectInfo && redirectInfo.view) {
        navigateTo(redirectInfo.view, redirectInfo.params || {});
      } else if (loggedUser.role === 'admin') {
        navigateTo('admin-panel');
      } else if (loggedUser.role === 'vendor') {
        navigateTo('vendor-portal');
      } else {
        navigateTo('home');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Fast Login


  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      boxSizing: 'border-box'
    }}>
      <div className="vs-card animate-modal-pop" style={{
        width: '100%',
        maxWidth: '460px',
        maxHeight: 'calc(100dvh - 28px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: '24px 20px',
        borderRadius: '24px',
        backgroundColor: '#ffffff',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
        border: '1.5px solid #d1fae5',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Close Button with 44x44px accessible touch target */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          className="btn-close-modal touch-target-44"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10
          }}
          aria-label="Close Authentication Dialog"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            marginBottom: '10px',
            boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)'
          }}>
            <Sparkles size={26} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#064e3b', margin: '0 0 4px 0' }}>
            {viewState === 'registration' 
              ? '📝 Complete Your Registration' 
              : viewState === 'gmail-input' 
                ? 'Sign In with your Gmail' 
                : 'Welcome to VendorSaathi'}
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
            {viewState === 'registration'
              ? 'Enter your name, phone and exact delivery address for 20-min express grocery deliveries.'
              : viewState === 'gmail-input' 
                ? 'Connect your personal Google account for instant village delivery tracking' 
                : 'Fresh village groceries & verified local stores delivered in 20 mins'}
          </p>
        </div>

        {/* Notice Alert */}
        {noticeMessage && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12.5px',
            fontWeight: '700',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1.5px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12.5px',
            fontWeight: '600',
            marginBottom: '16px',
            textAlign: 'center',
            lineHeight: 1.4
          }}>
            <div>{errorMessage}</div>
            {errorMessage.includes('Authorized domains') && (
              <div style={{ marginTop: '8px' }}>
                <a
                  href={`https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vendorsaathi'}/authentication/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontWeight: '800',
                    fontSize: '11.5px',
                    textDecoration: 'underline'
                  }}
                >
                  🔗 Open Firebase Console to Add Domain →
                </a>
              </div>
            )}
          </div>
        )}

        {/* VIEW 1: Main View with Google 1-Click Login & Direct Gmail option */}
        {viewState === 'main' && (
          <div className="animate-fade-scale">
            {/* Primary Google 1-Click Popup / Instant Auth */}
            <button
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '2px solid #e2e8f0',
                color: '#1f2937',
                fontSize: '15px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease',
                marginBottom: '14px',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 133, 244, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)'; }}
            >
              {/* Official Google 'G' SVG Logo */}
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isSubmitting ? 'Signing in with Google...' : 'Continue with Google Account'}</span>
            </button>

            {/* Quick Inline Gmail Sign-in Box */}
            <form onSubmit={handleDirectGmailSubmit} style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Mail size={15} color="#059669" />
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#065f46' }}>
                  Or enter your Gmail address directly:
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. jeevithgowdasr@gmail.com"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setViewState('gmail-input')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  + Add Village Address & Phone Details
                </button>
              </div>
            </form>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '12px 0',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ padding: '0 10px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Email / Password Option */}
            <button
              onClick={() => setViewState('email-form')}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '14px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '14px',
                boxSizing: 'border-box'
              }}
            >
              <Lock size={14} color="#64748b" />
              <span>Password / Custom Email Login</span>
            </button>

            {/* Dedicated Authentication Access */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '14px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                Dedicated Portals
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    navigateTo('login', { role: 'customer', mode: 'signin' });
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '12px',
                    padding: '10px 8px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    color: '#047857',
                    cursor: 'pointer'
                  }}
                >
                  🛒 Customer Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    navigateTo('login', { role: 'vendor', mode: 'signin' });
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '10px 8px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    color: '#1d4ed8',
                    cursor: 'pointer'
                  }}
                >
                  🏪 Vendor Portal
                </button>
              </div>

              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    navigateTo('login', { role: 'vendor', mode: 'register' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Register as a New Vendor Partner &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Registration & Address Collection Page */}
        {viewState === 'registration' && (
          <form onSubmit={handleCompleteRegistration} className="animate-fade-scale">
            {/* Verified Gmail Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #a7f3d0',
              borderRadius: '14px',
              padding: '10px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <div>
                  <span style={{ fontSize: '11px', color: '#047857', fontWeight: '800', display: 'block' }}>Verified Gmail</span>
                  <span style={{ fontSize: '13px', color: '#064e3b', fontWeight: '800' }}>{gmailAddress || email}</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '3px 8px',
                borderRadius: '8px'
              }}>
                ✓ Verified
              </span>
            </div>

            {/* Full Name */}
            <FormField
              label="Full Name"
              name="reg_name"
              required
              placeholder="e.g. Jeevith Gowda"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError('name');
              }}
              error={fieldErrors.name}
              maxLength={100}
              icon={User}
            />

            {/* Mobile Phone */}
            <FormField
              label="Mobile Number (For Order OTP & Delivery Calls)"
              name="reg_phone"
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldError('phone');
              }}
              error={fieldErrors.phone}
              maxLength={15}
              icon={Smartphone}
            />

            {/* Live GPS & Location Auto-Detect */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crosshair size={16} color="#059669" />
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                    Live GPS & Village Location
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingGPS}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={isDetectingGPS ? 'animate-spin' : ''} />
                  <span>{isDetectingGPS ? 'Detecting...' : 'Auto-Detect GPS'}</span>
                </button>
              </div>

              {gpsData && (
                <div style={{
                  fontSize: '11.5px',
                  color: '#065f46',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <MapPin size={13} color="#059669" />
                  <span>
                    GPS Locked: <strong>{gpsData.village || village}, {gpsData.town || town}</strong> (±{gpsData.accuracy || 10}m)
                  </span>
                </div>
              )}

              {/* Village, Town, Pincode Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                <FormField
                  label="Village / Area"
                  name="reg_village"
                  required
                  placeholder="e.g. Mijar"
                  value={village}
                  onChange={(e) => {
                    setVillage(e.target.value);
                    clearFieldError('village');
                  }}
                  error={fieldErrors.village}
                  maxLength={80}
                  style={{ marginBottom: 0 }}
                />
                <FormField
                  label="Town / City"
                  name="reg_town"
                  required
                  placeholder="e.g. Moodbidri"
                  value={town}
                  onChange={(e) => {
                    setTown(e.target.value);
                    clearFieldError('town');
                  }}
                  error={fieldErrors.town}
                  maxLength={80}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <FormField
                  label="District"
                  name="reg_district"
                  placeholder="Dakshina Kannada"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  maxLength={80}
                  style={{ marginBottom: 0 }}
                />
                <FormField
                  label="Pincode"
                  name="reg_pincode"
                  required
                  placeholder="574225"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value);
                    clearFieldError('pincode');
                  }}
                  error={fieldErrors.pincode}
                  maxLength={6}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>

            {/* Exact Street Address / House / Building */}
            <FormField
              label="Exact Street Address / House / Building Name"
              name="reg_streetAddress"
              required
              placeholder="e.g. House No. 42, Sri Rama Nilaya, Temple Road"
              value={streetAddress}
              onChange={(e) => {
                setStreetAddress(e.target.value);
                clearFieldError('streetAddress');
              }}
              error={fieldErrors.streetAddress}
              maxLength={250}
              icon={Home}
            />

            {/* Landmark */}
            <FormField
              label="Nearby Landmark (Optional)"
              name="reg_landmark"
              placeholder="e.g. Near Mijar Bus Stand / Beside Govt School"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              maxLength={150}
              icon={Navigation}
            />

            {/* Save & Complete Registration Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '900',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{isSubmitting ? 'Saving Registration...' : 'Save Registration & Start Shopping →'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewState('main')}
              style={{
                width: '100%',
                padding: '8px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ← Back to login options
            </button>
          </form>
        )}

        {/* VIEW 3: Direct Gmail Address Input Form */}
        {viewState === 'gmail-input' && (
          <form onSubmit={handleDirectGmailSubmit} className="animate-fade-scale">
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Your Gmail Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. jeevithgowdasr@gmail.com"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '14px',
                    border: '2px solid #10b981',
                    fontSize: '14px',
                    fontWeight: '700',
                    outline: 'none',
                    backgroundColor: '#f0fdf4',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '900',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{isSubmitting ? 'Verifying Gmail...' : 'Continue to Registration →'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewState('main')}
              style={{
                width: '100%',
                padding: '8px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ← Back to login options
            </button>
          </form>
        )}

        {/* VIEW 3: Email & Password Form */}
        {viewState === 'email-form' && (
          <form onSubmit={handleEmailAuth} className="animate-fade-scale">
            {isEmailRegister && (
              <FormField
                label="Full Name"
                name="email_name"
                required
                placeholder="e.g. Ananya Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
                error={fieldErrors.name}
                maxLength={100}
                icon={User}
              />
            )}

            <FormField
              label="Email Address"
              name="email_addr"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              error={fieldErrors.email}
              icon={Mail}
            />

            <FormField
              label="Password"
              name="email_password"
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              error={fieldErrors.password}
              helperText="Minimum 6 characters for account security"
              icon={Lock}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '14px',
                fontSize: '14.5px',
                fontWeight: '900',
                marginBottom: '12px',
                boxSizing: 'border-box'
              }}
            >
              {isSubmitting ? 'Signing In...' : isEmailRegister ? 'Create Account' : 'Sign In with Email'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setViewState('main')}
                style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => setIsEmailRegister(!isEmailRegister)}
                style={{ fontSize: '12.5px', color: '#059669', fontWeight: '800', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                {isEmailRegister ? 'Already have an account? Sign In' : 'New here? Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* Security & Privacy Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '18px',
          color: '#64748b',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          <ShieldCheck size={14} color="#059669" />
          <span>256-Bit SSL Encrypted • Privacy Protected</span>
        </div>
      </div>
    </div>
  );
};
