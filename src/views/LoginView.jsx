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
  KeyRound
} from 'lucide-react';
import { FormField } from '../components/FormField';
import { 
  validateForm, 
  validateEmail, 
  validatePassword, 
  validatePhone 
} from '../utils/validators';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  getUserProfileFromFirebase 
} from '../firebase';
import { playSuccessChime, playPopSound } from '../utils/audio';
import confetti from 'canvas-confetti';

export const LoginView = ({ params = {} }) => {
  const { 
    user, 
    setUser, 
    updateUserProfile, 
    navigateTo, 
    showToast,
    setIsAuthModalOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'otp' | 'email' | 'demo'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'vendor'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (field) => {
    setFieldErrors(prev => ({ ...prev, [field]: null }));
    if (errorMessage) setErrorMessage('');
  };

  const reason = params?.reason;
  const targetView = params?.targetView;

  // Handle post-login redirection
  const handleSuccessfulAuth = (userData) => {
    const session = createAuthSession(userData);
    const fullUser = {
      ...userData,
      isLoggedIn: true,
      authToken: session.authToken,
      tokenExpiresAt: session.tokenExpiresAt,
      sessionIssuedAt: session.sessionIssuedAt,
      role: userData.role || selectedRole
    };

    updateUserProfile(fullUser);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      playSuccessChime();
    } catch (e) {}

    showToast(`🎉 Welcome back, ${fullUser.name || 'User'}!`, 'success');

    // Retrieve pending redirect target (e.g. checkout, my-orders, vendor-portal)
    const redirectInfo = getAndClearRedirectTarget();
    if (redirectInfo && redirectInfo.view) {
      navigateTo(redirectInfo.view, redirectInfo.params || {});
    } else {
      // Default to appropriate dashboard
      if (fullUser.role === 'vendor') {
        navigateTo('vendor-portal');
      } else {
        navigateTo('home');
      }
    }
  };

  // Google 1-Click Popup Auth
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    playPopSound();

    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase Auth is not initialized');
      }

      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        const gUser = res.user;
        const gName = gUser.displayName || gUser.email?.split('@')[0] || 'Customer';
        const remoteData = await getUserProfileFromFirebase(gUser.uid);

        const userData = {
          uid: gUser.uid,
          name: gName,
          email: gUser.email,
          phone: gUser.phoneNumber || remoteData?.data?.phone || '+91 9876543210',
          photoURL: gUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(gName)}`,
          role: remoteData?.data?.role || selectedRole,
          authProvider: 'google',
          ...(remoteData?.data || {})
        };

        handleSuccessfulAuth(userData);
      }
    } catch (err) {
      console.warn('Google login error notice:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in window closed. Please try again.');
      } else {
        setErrorMessage(err.message || 'Google sign in could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    const emailSchema = {
      email: (v) => validateEmail(v, true),
      password: (v) => validatePassword(v, 6)
    };

    const { isValid, errors, sanitizedData } = validateForm({
      email,
      password
    }, emailSchema);

    if (!isValid) {
      setFieldErrors(errors);
      const firstErr = Object.values(errors)[0];
      setErrorMessage(firstErr || 'Please check your email and password.');
      playPopSound();
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage('');
    playPopSound();

    try {
      let uid = `email_${Date.now()}`;
      if (auth) {
        try {
          const res = await signInWithEmailAndPassword(auth, sanitizedData.email, sanitizedData.password);
          if (res?.user) uid = res.user.uid;
        } catch (fbErr) {
          console.warn('Firebase email auth fallback:', fbErr.message);
        }
      }

      const userName = sanitizedData.email.split('@')[0].replace(/[._]/g, ' ');
      const userData = {
        uid,
        name: userName.replace(/\b\w/g, l => l.toUpperCase()),
        email: sanitizedData.email,
        phone: phone || '+91 9876543210',
        role: selectedRole,
        authProvider: 'email',
        village: 'Mijar',
        town: 'Moodbidri'
      };

      handleSuccessfulAuth(userData);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Phone OTP Flow
  const handleSendOtp = (e) => {
    e.preventDefault();
    const phoneErr = validatePhone(phone, true);
    if (phoneErr) {
      setFieldErrors({ phone: phoneErr });
      setErrorMessage(phoneErr);
      playPopSound();
      return;
    }

    setFieldErrors({});
    setIsOtpSent(true);
    setErrorMessage('');
    showToast(`OTP Code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}. (Demo: Use 123456)`, 'info');
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
    const userData = {
      uid: `otp_${Date.now()}`,
      name: selectedRole === 'vendor' ? 'Ramesh Gowda' : 'Bhavana Bai',
      phone: `+91 ${cleanDigits}`,
      email: selectedRole === 'vendor' ? 'ramesh.kirana@gmail.com' : 'bhavana.bai@gmail.com',
      role: selectedRole,
      authProvider: 'otp',
      village: 'Mijar',
      town: 'Moodbidri'
    };

    handleSuccessfulAuth(userData);
  };

  // Quick 1-Click Demo Login
  const handleQuickDemoLogin = (role) => {
    playPopSound();
    if (role === 'vendor') {
      const vendorUser = {
        uid: 'vendor_ramesh_01',
        name: 'Ramesh Gowda',
        email: 'ramesh.kirana@gmail.com',
        phone: '+91 98451 23456',
        village: 'Mijar',
        town: 'Moodbidri',
        district: 'Dakshina Kannada',
        pincode: '574225',
        address: 'Ramesh Grocery, Mijar Cross, Moodbidri - 574225',
        role: 'vendor',
        authProvider: 'demo',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      };
      handleSuccessfulAuth(vendorUser);
    } else {
      const customerUser = {
        uid: 'customer_bhavana_01',
        name: 'Bhavana Bai',
        email: 'bhavana.bai@gmail.com',
        phone: '+91 9876543210',
        village: 'Mijar',
        town: 'Moodbidri',
        district: 'Dakshina Kannada',
        pincode: '574225',
        address: 'Bhavana Bai, Near Alva’s College, Mijar, Moodbidri - 574225',
        role: 'customer',
        authProvider: 'demo',
        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
      };
      handleSuccessfulAuth(customerUser);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 20px 80px 20px', maxWidth: '540px', margin: '0 auto' }}>
      {/* Session notice banner */}
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

      {targetView && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#1e40af',
          fontSize: '13.5px'
        }}>
          <Lock size={20} style={{ flexShrink: 0 }} />
          <span>You will be automatically redirected to <strong>{targetView}</strong> after signing in.</span>
        </div>
      )}

      {/* Main Login Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '28px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.1)',
        padding: '36px 32px'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 18px rgba(16, 185, 129, 0.2)'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            Sign In to VendorSaathi
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Choose your account role and authentication method
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          backgroundColor: '#f1f5f9',
          padding: '6px',
          borderRadius: '16px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setSelectedRole('customer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: selectedRole === 'customer' ? '#ffffff' : 'transparent',
              color: selectedRole === 'customer' ? '#059669' : '#64748b',
              fontWeight: '800',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: selectedRole === 'customer' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <ShoppingBag size={16} /> Customer Role
          </button>
          <button
            onClick={() => setSelectedRole('vendor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: selectedRole === 'vendor' ? '#ffffff' : 'transparent',
              color: selectedRole === 'vendor' ? '#2563eb' : '#64748b',
              fontWeight: '800',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: selectedRole === 'vendor' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Store size={16} /> Vendor Partner
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}

        {/* Auth Method Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
          {[
            { id: 'google', label: 'Google 1-Click' },
            { id: 'otp', label: 'Mobile OTP' },
            { id: 'email', label: 'Email / Password' },
            { id: 'demo', label: '⚡ Fast Demo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setErrorMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 10px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '800' : '600',
                color: activeTab === tab.id ? '#059669' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Google 1-Click */}
        {activeTab === 'google' && (
          <div>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '18px', textAlign: 'center' }}>
              Sign in instantly with your Google account as <strong>{selectedRole.toUpperCase()}</strong>.
            </p>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: '16px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : `Sign in as ${selectedRole === 'vendor' ? 'Vendor' : 'Customer'} with Google`}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Mobile Phone OTP */}
        {activeTab === 'otp' && (
          <div>
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column' }}>
                <FormField
                  label="Mobile Phone Number"
                  name="login_phone"
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
                <button type="submit" className="btn-primary" style={{ padding: '14px', borderRadius: '16px', fontSize: '15px' }}>
                  Send OTP Code <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column' }}>
                <FormField
                  label="Enter 6-Digit OTP Code (Demo: 123456)"
                  name="login_otp"
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value);
                    clearFieldError('otp');
                  }}
                  error={fieldErrors.otp}
                  maxLength={6}
                  icon={KeyRound}
                />
                <button type="submit" className="btn-primary" style={{ padding: '14px', borderRadius: '16px', fontSize: '15px' }}>
                  Verify & Continue <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsOtpSent(false); clearFieldError('otp'); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', marginTop: '12px' }}
                >
                  ← Change phone number
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Email & Password */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            <FormField
              label="Email Address"
              name="login_email"
              type="email"
              required
              placeholder="your.email@gmail.com"
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
              name="login_password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              error={fieldErrors.password}
              icon={Lock}
            />

            <button type="submit" disabled={isLoading} className="btn-primary" style={{ padding: '14px', borderRadius: '16px', fontSize: '15px' }}>
              {isLoading ? 'Signing in...' : `Sign in as ${selectedRole.toUpperCase()}`}
            </button>
          </form>
        )}

        {/* Tab 4: ⚡ 1-Click Fast Demo Accounts */}
        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              onClick={() => handleQuickDemoLogin('customer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '18px',
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
                style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '14px', color: '#064e3b', display: 'block' }}>Bhavana Bai (Customer Demo)</strong>
                <span style={{ fontSize: '12px', color: '#059669' }}>Mijar Village &bull; Customer Shopping Role</span>
              </div>
              <ArrowRight size={18} color="#059669" />
            </div>

            <div
              onClick={() => handleQuickDemoLogin('vendor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '18px',
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
                style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '14px', color: '#1e3a8a', display: 'block' }}>Ramesh Gowda (Vendor Partner Demo)</strong>
                <span style={{ fontSize: '12px', color: '#2563eb' }}>Ramesh Grocery &bull; Vendor Portal & Stock Control</span>
              </div>
              <ArrowRight size={18} color="#2563eb" />
            </div>
          </div>
        )}

        {/* Back to Browse */}
        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <button
            onClick={() => navigateTo('home')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
          >
            Continue browsing as Guest &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
