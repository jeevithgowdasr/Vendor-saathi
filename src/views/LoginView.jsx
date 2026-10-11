import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getAndClearRedirectTarget, 
  createAuthSession 
} from '../utils/auth';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Smartphone, 
  Store, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  KeyRound,
  Eye,
  EyeOff,
  MapPin,
  Truck,
  Layers,
  Crosshair,
  User,
  Plus,
  X,
  Compass
} from 'lucide-react';
import { FormField } from '../components/FormField';
import { 
  validateForm, 
  validateEmail, 
  validatePassword, 
  validatePhone,
  validateRequiredText
} from '../utils/validators';
import { 
  loginApi, 
  registerCustomerApi, 
  registerVendorApi 
} from '../services/authApi';
import { getLiveGPSCoordinates, reverseGeocodeGPS } from '../utils/geolocation';
import { playSuccessChime, playPopSound } from '../utils/audio';
import confetti from 'canvas-confetti';

const VENDOR_CATEGORIES = [
  { id: 'Vegetable', name: 'Vegetables', icon: '🥕' },
  { id: 'Fruit', name: 'Fresh Fruits', icon: '🍎' },
  { id: 'Flower', name: 'Pooja Flowers', icon: '🌸' },
  { id: 'Ice-cream', name: 'Ice Cream', icon: '🍦' },
  { id: 'Dairy', name: 'Dairy & Milk', icon: '🥛' },
  { id: 'Snacks', name: 'Street Snacks', icon: '🥟' },
  { id: 'Grocery', name: 'Daily Grocery', icon: '🛒' },
  { id: 'Bakery', name: 'Bakery & Sweets', icon: '🥖' }
];

const PRESET_OPERATING_AREAS = [
  'Mijar',
  'Moodbidri Town',
  'Alva’s Campus',
  'Kallamundkur',
  'Belvai',
  'Swarna Circle',
  'Bus Stand Complex',
  'Mahaveera College Area'
];

export const LoginView = ({ params = {} }) => {
  const { 
    user, 
    setUser, 
    updateUserProfile, 
    setCurrentLocation,
    navigateTo, 
    showToast 
  } = useApp();

  // Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState(params?.mode === 'register' ? 'register' : 'signin');
  // Role: 'customer' | 'vendor'
  const [selectedRole, setSelectedRole] = useState(params?.role || 'customer');
  // Login Sub-tabs: 'password' | 'otp' | 'demo'
  const [loginMethod, setLoginMethod] = useState('password');

  // Common Form Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Vendor-Specific Fields
  const [businessName, setBusinessName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Vegetable');
  const [operatingAreas, setOperatingAreas] = useState(['Mijar', 'Moodbidri Town']);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [vehicleType, setVehicleType] = useState('None');
  const [vehicleRegNo, setVehicleRegNo] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Customer-Specific Fields
  const [primaryAddress, setPrimaryAddress] = useState('Mijar Village, Moodbidri');
  const [coordinates, setCoordinates] = useState({ lat: 13.0682, lng: 74.9961 });
  const [preferredAreas, setPreferredAreas] = useState(['Mijar', 'Moodbidri Town']);
  const [preferredCategories, setPreferredCategories] = useState(['Vegetables', 'Fruits']);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // OTP Login State
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // UI & Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (field) => {
    setFieldErrors(prev => ({ ...prev, [field]: null }));
    if (errorMessage) setErrorMessage('');
  };

  const reason = params?.reason;
  const targetView = params?.targetView;

  // Toggle Operating Area selection for Vendor
  const toggleOperatingArea = (area) => {
    playPopSound();
    setOperatingAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
    clearFieldError('operatingAreas');
  };

  const handleAddCustomArea = (e) => {
    e?.preventDefault();
    const trimmed = customAreaInput.trim();
    if (trimmed && !operatingAreas.includes(trimmed)) {
      setOperatingAreas(prev => [...prev, trimmed]);
      setCustomAreaInput('');
      playPopSound();
    }
  };

  // Toggle Preferred Area for Customer
  const togglePreferredArea = (area) => {
    playPopSound();
    setPreferredAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  // Toggle Preferred Category for Customer
  const togglePreferredCategory = (cat) => {
    playPopSound();
    setPreferredCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // 1-Click GPS Coordinate Detection
  const handleDetectGPS = async () => {
    setIsLocatingGPS(true);
    playPopSound();
    try {
      const liveCoords = await getLiveGPSCoordinates();
      setCoordinates({ lat: liveCoords.lat, lng: liveCoords.lng });
      
      const geocoded = await reverseGeocodeGPS(liveCoords.lat, liveCoords.lng, liveCoords.accuracy);
      if (geocoded?.streetAddress || geocoded?.village) {
        setPrimaryAddress(`${geocoded.streetAddress || geocoded.village}, ${geocoded.town || 'Moodbidri'}, Karnataka - ${geocoded.pincode || '574225'}`);
      }
      showToast(`📍 Live GPS Locked: ${liveCoords.lat.toFixed(4)}° N, ${liveCoords.lng.toFixed(4)}° E (±${liveCoords.accuracy}m)`, 'success');
    } catch (err) {
      console.warn('GPS detection failed:', err);
      showToast('⚠️ Could not acquire GPS coordinates. Please enter manually.', 'danger');
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Post-Auth Success Router & Handler
  const handleSuccessfulAuth = (userData, token) => {
    const session = createAuthSession(userData);
    const resolvedRole = (userData.role || selectedRole).toLowerCase();

    const fullUser = {
      ...userData,
      isLoggedIn: true,
      authToken: token || session.authToken,
      tokenExpiresAt: session.tokenExpiresAt,
      sessionIssuedAt: session.sessionIssuedAt,
      role: resolvedRole
    };

    updateUserProfile(fullUser);

    try {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      playSuccessChime();
    } catch (e) {}

    showToast(`🎉 Welcome to VendorSaathi, ${fullUser.name || fullUser.fullName || 'User'}!`, 'success');

    // Dedicated Dashboard Redirection
    const redirectInfo = getAndClearRedirectTarget();
    if (redirectInfo && redirectInfo.view) {
      navigateTo(redirectInfo.view, redirectInfo.params || {});
    } else {
      if (resolvedRole === 'admin') {
        // Redirect platform administrator to Admin Dashboard
        navigateTo('admin-panel');
      } else if (resolvedRole === 'vendor') {
        // Redirect vendor to Vendor Dashboard
        navigateTo('vendor-portal');
      } else {
        // Redirect customer to Customer Home / Explore view
        navigateTo('home');
      }
    }
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const loginIdentifier = identifier.trim();

    if (!loginIdentifier) {
      setFieldErrors({ identifier: 'Please enter your phone number or email.' });
      setErrorMessage('Please enter your phone number or email.');
      playPopSound();
      return;
    }

    if (!password) {
      setFieldErrors({ password: 'Password is required.' });
      setErrorMessage('Please enter your password.');
      playPopSound();
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage('');
    playPopSound();

    try {
      const response = await loginApi({
        identifier: loginIdentifier,
        password,
        role: selectedRole
      });

      if (response?.user && response?.token) {
        handleSuccessfulAuth(response.user, response.token);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
      playPopSound();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full Name must be at least 2 characters.';
    }

    if (!phone.trim() && !email.trim()) {
      errors.phone = 'Either phone number or email address is required.';
    }

    if (phone.trim()) {
      const pErr = validatePhone(phone, false);
      if (pErr) errors.phone = pErr;
    }

    if (email.trim()) {
      const eErr = validateEmail(email, false);
      if (eErr) errors.email = eErr;
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    // Role-specific validations
    if (selectedRole === 'vendor') {
      if (!businessName.trim() || businessName.trim().length < 2) {
        errors.businessName = 'Business / Shop Name is required.';
      }
      if (!vendorCategory) {
        errors.vendorCategory = 'Please select a primary vendor category.';
      }
      if (operatingAreas.length === 0) {
        errors.operatingAreas = 'Please select at least one operating area (supported locality).';
      }
    } else {
      if (!primaryAddress.trim()) {
        errors.primaryAddress = 'Primary saved address is required.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(Object.values(errors)[0]);
      playPopSound();
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage('');
    playPopSound();

    try {
      if (selectedRole === 'vendor') {
        const payload = {
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
          vendorCategory,
          categories: [vendorCategory, 'Daily Essentials'],
          operatingAreas,
          profileImage: profileImage.trim() || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          vehicleDetails: {
            vehicleType,
            registrationNumber: vehicleRegNo.trim()
          },
          status: 'active'
        };

        const res = await registerVendorApi(payload);
        if (res?.user && res?.token) {
          handleSuccessfulAuth(res.user, res.token);
        }
      } else {
        const payload = {
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
          primaryLocation: {
            address: primaryAddress.trim(),
            coordinates,
            village: 'Mijar',
            town: 'Moodbidri',
            district: 'Dakshina Kannada',
            pincode: '574225'
          },
          preferredAreas,
          preferredCategories,
          profileImage: profileImage.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
          status: 'active'
        };

        const res = await registerCustomerApi(payload);
        if (res?.user && res?.token) {
          handleSuccessfulAuth(res.user, res.token);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
      playPopSound();
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleQuickDemoLogin = async (role) => {
    playPopSound();
    setIsLoading(true);
    try {
      const identifier = role === 'admin'
        ? 'admin@vendorsaathi.com'
        : role === 'vendor'
        ? 'ramesh.kirana@gmail.com'
        : 'bhavana.bai@gmail.com';
      const res = await loginApi({
        identifier,
        password: 'password123',
        role
      });
      if (res?.user && res?.token) {
        handleSuccessfulAuth(res.user, res.token);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Demo sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile OTP Demo Flow
  const handleSendOtp = (e) => {
    e.preventDefault();
    const pErr = validatePhone(phone, true);
    if (pErr) {
      setFieldErrors({ phone: pErr });
      setErrorMessage(pErr);
      playPopSound();
      return;
    }
    setFieldErrors({});
    setIsOtpSent(true);
    showToast(`OTP Code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}. (Demo OTP: 123456)`, 'info');
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim() !== '123456') {
      setFieldErrors({ otp: 'Invalid OTP code. Please use demo OTP: 123456' });
      setErrorMessage('Invalid OTP code. Please use demo OTP: 123456');
      playPopSound();
      return;
    }
    setFieldErrors({});
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const demoUser = {
      id: `usr_otp_${Date.now()}`,
      name: selectedRole === 'vendor' ? 'Ramesh Gowda' : 'Bhavana Bai',
      phone: `+91 ${cleanDigits}`,
      email: selectedRole === 'vendor' ? 'ramesh.kirana@gmail.com' : 'bhavana.bai@gmail.com',
      role: selectedRole,
      status: 'active'
    };
    handleSuccessfulAuth(demoUser, `jwt_otp_${Date.now()}`);
  };

  const isCustomer = selectedRole === 'customer';
  const roleColor = isCustomer ? '#059669' : '#2563eb';
  const roleBg = isCustomer ? '#ecfdf5' : '#eff6ff';
  const roleBorder = isCustomer ? '#a7f3d0' : '#bfdbfe';

  return (
    <div className="container animate-fade-in" style={{ padding: '36px 16px 80px 16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Session Expired Notice */}
      {reason === 'TOKEN_EXPIRED' && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '16px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b',
          fontSize: '13.5px'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>Your session has expired. Please sign in to securely resume your work.</span>
        </div>
      )}

      {/* Main Authentication Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '32px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 24px 50px -12px rgba(15, 23, 42, 0.12)',
        padding: '36px 32px'
      }}>
        {/* Brand Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '22px',
            backgroundColor: roleBg,
            color: roleColor,
            border: `1.5px solid ${roleBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: `0 10px 25px -4px ${isCustomer ? 'rgba(16, 185, 129, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
            transition: 'all 0.3s ease'
          }}>
            {isCustomer ? <ShoppingBag size={34} /> : <Store size={34} />}
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            {authMode === 'register' ? `Create ${isCustomer ? 'Customer' : 'Vendor'} Account` : `Sign In to VendorSaathi`}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            {authMode === 'register' 
              ? (isCustomer ? 'Explore verified local vendors, farm produce & track deliveries' : 'Grow your local commerce with digital storefront & instant orders')
              : `Access your ${isCustomer ? 'Customer' : 'Vendor Partner'} portal & live orders`}
          </p>
        </div>

        {/* 1. Clean Role Selector Toggle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: '#f1f5f9',
          padding: '6px',
          borderRadius: '18px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setSelectedRole('customer'); playPopSound(); clearFieldError('all'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 10px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: selectedRole === 'customer' ? '#ffffff' : 'transparent',
              color: selectedRole === 'customer' ? '#059669' : '#64748b',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: selectedRole === 'customer' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <ShoppingBag size={16} />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('vendor'); playPopSound(); clearFieldError('all'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 10px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: selectedRole === 'vendor' ? '#ffffff' : 'transparent',
              color: selectedRole === 'vendor' ? '#2563eb' : '#64748b',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: selectedRole === 'vendor' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <Store size={16} />
            <span>Vendor Partner</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('admin'); playPopSound(); clearFieldError('all'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 10px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: selectedRole === 'admin' ? '#ffffff' : 'transparent',
              color: selectedRole === 'admin' ? '#0f172a' : '#64748b',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: selectedRole === 'admin' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <ShieldCheck size={16} />
            <span>Admin</span>
          </button>
        </div>

        {/* 2. Mode Segmented Toggle: Sign In vs Register */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setErrorMessage(''); playPopSound(); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              color: authMode === 'signin' ? roleColor : '#64748b',
              fontWeight: authMode === 'signin' ? '900' : '600',
              fontSize: '14.5px',
              borderBottom: authMode === 'signin' ? `3px solid ${roleColor}` : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMessage(''); playPopSound(); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              color: authMode === 'register' ? roleColor : '#64748b',
              fontWeight: authMode === 'register' ? '900' : '600',
              fontSize: '14.5px',
              borderBottom: authMode === 'register' ? `3px solid ${roleColor}` : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '13.5px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* -------------------- SIGN IN MODE -------------------- */}
        {authMode === 'signin' && (
          <div>
            {/* Login Method Sub-Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[
                { id: 'password', label: 'Password Login' },
                { id: 'otp', label: 'Phone OTP' },
                { id: 'demo', label: '⚡ 1-Click Demo' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setLoginMethod(tab.id); setErrorMessage(''); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: loginMethod === tab.id ? roleColor : '#e2e8f0',
                    backgroundColor: loginMethod === tab.id ? roleBg : '#f8fafc',
                    color: loginMethod === tab.id ? roleColor : '#64748b',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Standard Password Login Form */}
            {loginMethod === 'password' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormField
                  label="Mobile Number or Email Address"
                  name="login_identifier"
                  type="text"
                  required
                  placeholder={isCustomer ? 'bhavana.bai@gmail.com or 9876543210' : 'ramesh.kirana@gmail.com or 9845123456'}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    clearFieldError('identifier');
                  }}
                  error={fieldErrors.identifier}
                  icon={isCustomer ? Mail : Store}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter account password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      style={{
                        width: '100%',
                        padding: '13px 44px 13px 42px',
                        borderRadius: '14px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '14.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: roleColor,
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: `0 8px 20px -4px ${isCustomer ? 'rgba(16, 185, 129, 0.4)' : 'rgba(37, 99, 235, 0.4)'}`,
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? 'Signing in...' : `Sign in as ${isCustomer ? 'Customer' : 'Vendor Partner'}`}
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {/* Mobile OTP Login Form */}
            {loginMethod === 'otp' && (
              <div>
                {!isOtpSent ? (
                  <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <FormField
                      label="Mobile Phone Number"
                      name="otp_phone"
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFieldError('phone');
                      }}
                      error={fieldErrors.phone}
                      icon={Smartphone}
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: roleColor,
                        color: '#ffffff',
                        border: 'none',
                        padding: '14px',
                        borderRadius: '16px',
                        fontSize: '15px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Send OTP Code <ArrowRight size={18} style={{ verticalAlign: 'middle' }} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <FormField
                      label="Enter 6-Digit OTP Code (Demo: 123456)"
                      name="otp_code"
                      type="text"
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value);
                        clearFieldError('otp');
                      }}
                      error={fieldErrors.otp}
                      icon={KeyRound}
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: roleColor,
                        color: '#ffffff',
                        border: 'none',
                        padding: '14px',
                        borderRadius: '16px',
                        fontSize: '15px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Verify & Access Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
                    >
                      &larr; Change mobile number
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ⚡ 1-Click Fast Demo Login */}
            {loginMethod === 'demo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  onClick={() => handleQuickDemoLogin('customer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '20px',
                    border: '1.5px solid #a7f3d0',
                    backgroundColor: '#f0fdf4',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#a7f3d0'}
                >
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
                    alt="Bhavana Bai"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '14px', color: '#064e3b', display: 'block' }}>Bhavana Bai (Customer Demo)</strong>
                    <span style={{ fontSize: '12px', color: '#059669' }}>bhavana.bai@gmail.com &bull; Password: password123</span>
                  </div>
                  <ArrowRight size={18} color="#059669" />
                </div>

                <div
                  onClick={() => handleQuickDemoLogin('vendor')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '20px',
                    border: '1.5px solid #bfdbfe',
                    backgroundColor: '#eff6ff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#bfdbfe'}
                >
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Ramesh Gowda"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '14px', color: '#1e3a8a', display: 'block' }}>Ramesh Grocery (Vendor Partner Demo)</strong>
                    <span style={{ fontSize: '12px', color: '#2563eb' }}>ramesh.kirana@gmail.com &bull; Password: password123</span>
                  </div>
                  <ArrowRight size={18} color="#2563eb" />
                </div>

                <div
                  onClick={() => handleQuickDemoLogin('admin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '20px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0f172a'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Principal Platform Admin (Admin Demo)</strong>
                    <span style={{ fontSize: '12px', color: '#475569' }}>admin@vendorsaathi.com &bull; Password: password123</span>
                  </div>
                  <ArrowRight size={18} color="#0f172a" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------- REGISTRATION MODE -------------------- */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Common Field: Full Name */}
            <FormField
              label="Full Name"
              name="reg_fullName"
              type="text"
              required
              placeholder={isCustomer ? 'e.g. Bhavana Bai' : 'e.g. Ramesh Gowda'}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError('fullName');
              }}
              error={fieldErrors.fullName}
              icon={User}
            />

            {/* Common Contact Grid: Mobile & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <FormField
                label="Mobile Phone Number"
                name="reg_phone"
                type="tel"
                required
                placeholder="e.g. 9845123456"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError('phone');
                }}
                error={fieldErrors.phone}
                icon={Smartphone}
              />

              <FormField
                label="Email Address (Optional / ID)"
                name="reg_email"
                type="email"
                placeholder={isCustomer ? 'bhavana@example.com' : 'ramesh.store@gmail.com'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                error={fieldErrors.email}
                icon={Mail}
              />
            </div>

            {/* Common Field: Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Create Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 42px',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* ================= VENDOR SPECIFIC REGISTRATION FIELDS ================= */}
            {!isCustomer && (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '24px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={20} color="#2563eb" />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                    Vendor Store & Operations Profile
                  </h3>
                </div>

                {/* Business / Shop Name */}
                <FormField
                  label="Business / Shop Name"
                  name="reg_businessName"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Grocery & Fresh Mart"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    clearFieldError('businessName');
                  }}
                  error={fieldErrors.businessName}
                  icon={Store}
                />

                {/* Vendor Category Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Vendor Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '8px'
                  }}>
                    {VENDOR_CATEGORIES.map(cat => {
                      const isSelected = vendorCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setVendorCategory(cat.id); playPopSound(); clearFieldError('vendorCategory'); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#1e40af' : '#475569',
                            fontWeight: isSelected ? '800' : '600',
                            fontSize: '12.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.vendorCategory && (
                    <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.vendorCategory}
                    </span>
                  )}
                </div>

                {/* Operating Areas Multi-Select (Required) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: 0 }}>
                      Supported Operating Localities <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {operatingAreas.length} selected
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '10px' }}>
                    {PRESET_OPERATING_AREAS.map(area => {
                      const isSelected = operatingAreas.includes(area);
                      return (
                        <span
                          key={area}
                          onClick={() => toggleOperatingArea(area)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#475569',
                            border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '} {area}
                        </span>
                      );
                    })}
                  </div>

                  {/* Add Custom Area Input */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add custom locality (e.g. Swarna Cross)..."
                      value={customAreaInput}
                      onChange={(e) => setCustomAreaInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomArea(); } }}
                      style={{
                        flex: 1,
                        padding: '9px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomArea}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Add Area
                    </button>
                  </div>
                  {fieldErrors.operatingAreas && (
                    <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.operatingAreas}
                    </span>
                  )}
                </div>

                {/* Optional Vehicle Details */}
                <div style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Truck size={17} color="#2563eb" />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                      Vehicle Details (Optional for mobile street carts)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="None">None (Fixed Shop)</option>
                        <option value="Cart">Push Cart / Hand Cart</option>
                        <option value="Bicycle">Bicycle Carrier</option>
                        <option value="Two-Wheeler">Two-Wheeler / Scooter</option>
                        <option value="Three-Wheeler / Auto">Three-Wheeler / Auto Rickshaw</option>
                        <option value="Van / Small Truck">Van / Small Pickup Truck</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        Registration / Plate Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. KA-19-MB-4521"
                        value={vehicleRegNo}
                        onChange={(e) => setVehicleRegNo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= CUSTOMER SPECIFIC REGISTRATION FIELDS ================= */}
            {isCustomer && (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '24px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="#059669" />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                    Primary Location & Preferences
                  </h3>
                </div>

                {/* Primary Address & 1-Click GPS Lock */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: 0 }}>
                      Primary Delivery Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={isLocatingGPS}
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#047857',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Crosshair size={13} />
                      {isLocatingGPS ? 'Locking GPS...' : 'Auto-Detect Live GPS'}
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="House / Flat name, Street, Locality, Moodbidri"
                    value={primaryAddress}
                    onChange={(e) => {
                      setPrimaryAddress(e.target.value);
                      clearFieldError('primaryAddress');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {fieldErrors.primaryAddress && (
                    <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.primaryAddress}
                    </span>
                  )}

                  {/* Coordinates Telemetry Badge */}
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#065f46',
                    backgroundColor: '#f0fdf4',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px solid #d1fae5'
                  }}>
                    <Compass size={14} />
                    <span>Locked Coordinates: <strong>{coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° E</strong></span>
                  </div>
                </div>

                {/* Preferred Localities */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Preferred Shopping Localities
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {PRESET_OPERATING_AREAS.map(area => {
                      const isSelected = preferredAreas.includes(area);
                      return (
                        <span
                          key={area}
                          onClick={() => togglePreferredArea(area)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#059669' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#475569',
                            border: isSelected ? '1px solid #059669' : '1px solid #cbd5e1',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '} {area}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Categories */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Favorite Produce & Items
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {VENDOR_CATEGORIES.map(cat => {
                      const isSelected = preferredCategories.includes(cat.name);
                      return (
                        <span
                          key={cat.id}
                          onClick={() => togglePreferredCategory(cat.name)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#059669' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#475569',
                            border: isSelected ? '1px solid #059669' : '1px solid #cbd5e1',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {cat.icon} {isSelected ? '✓ ' : '+ '} {cat.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: roleColor,
                color: '#ffffff',
                border: 'none',
                padding: '15px',
                borderRadius: '16px',
                fontSize: '15.5px',
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: `0 10px 24px -4px ${isCustomer ? 'rgba(16, 185, 129, 0.45)' : 'rgba(37, 99, 235, 0.45)'}`,
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? 'Creating Account...' : `Register as ${isCustomer ? 'Customer' : 'Vendor Partner'}`}
              <ArrowRight size={19} />
            </button>
          </form>
        )}

        {/* Back to Browse */}
        <div style={{ marginTop: '26px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
          >
            Continue browsing produce as Guest &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
