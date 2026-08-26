import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { validateAuthSession, hasRoleAccess, setRedirectTarget } from '../utils/auth';
import { ShieldAlert, Lock, ArrowRight, RefreshCw } from 'lucide-react';

/**
 * ProtectedRoute Wrapper / AuthGuard Component
 * Enforces:
 * 1. Authentication check (valid token + unexpired session)
 * 2. Strict Role-Based Access Control (RBAC) (Customer vs Vendor)
 * 3. Preserves intended target URL/view for post-login redirect
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = [],
  viewName = '',
  viewParams = {}
}) => {
  const { 
    user, 
    navigateTo, 
    showToast, 
    setIsAuthModalOpen, 
    setAuthModalInitialTab 
  } = useApp();

  const authValidation = validateAuthSession(user);
  const isAuthenticated = authValidation.isValid;
  const isAuthorized = isAuthenticated && hasRoleAccess(user?.role, allowedRoles);

  useEffect(() => {
    // 1. Unauthenticated or Expired Session Check
    if (!isAuthenticated) {
      // Save intended target route and parameters for post-login navigation
      if (viewName) {
        setRedirectTarget(viewName, viewParams);
      }

      if (authValidation.reason === 'TOKEN_EXPIRED') {
        showToast('⏰ Your session has expired. Please sign in again.', 'danger');
      } else {
        showToast('🔒 Please sign in to access this protected feature.', 'info');
      }

      // Immediately navigate to login view and open auth prompt
      setAuthModalInitialTab(allowedRoles.includes('vendor') && !allowedRoles.includes('customer') ? 'vendor' : 'google');
      navigateTo('login', { 
        reason: authValidation.reason, 
        targetView: viewName,
        requiredRoles: allowedRoles 
      });
      return;
    }

    // 2. Role-Based Access Control (RBAC) Check
    if (isAuthenticated && !isAuthorized) {
      const userRole = (user?.role || 'customer').toUpperCase();
      const requiredStr = allowedRoles.map(r => r.toUpperCase()).join(' or ');
      
      showToast(`⛔ Access Denied: Requires ${requiredStr} privileges (${userRole} currently logged in).`, 'danger');
      
      // Redirect to unauthorized 403 screen with metadata
      navigateTo('unauthorized', {
        attemptedView: viewName,
        requiredRoles: allowedRoles,
        currentRole: user?.role || 'customer'
      });
    }
  }, [isAuthenticated, isAuthorized, user?.role, viewName]);

  // Unauthenticated Guard Fallback UI (displayed briefly before redirect or if redirect is intercepted)
  if (!isAuthenticated) {
    return (
      <div className="container animate-fade-in" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '24px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.2)'
        }}>
          <Lock size={38} />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em' }}>
          Authentication Required
        </h2>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '8px', marginBottom: '28px', lineHeight: '1.6' }}>
          This section is protected. Please sign in with your verified account to continue to <strong>{viewName || 'your requested page'}</strong>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => {
              if (viewName) setRedirectTarget(viewName, viewParams);
              setIsAuthModalOpen(true);
            }}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '15px', fontWeight: '800' }}
          >
            Sign In with Google / OTP <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigateTo('home')}
            style={{
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Role Unauthorized Guard Fallback UI
  if (!isAuthorized) {
    const userRole = (user?.role || 'customer').toUpperCase();
    const requiredRolesStr = allowedRoles.map(r => r.toUpperCase()).join(' / ');

    return (
      <div className="container animate-fade-in" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '540px', margin: '0 auto' }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '24px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 12px 24px -6px rgba(220, 38, 38, 0.2)'
        }}>
          <ShieldAlert size={40} />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#991b1b', letterSpacing: '-0.03em' }}>
          403 — Unauthorized Role
        </h2>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '8px', marginBottom: '28px', lineHeight: '1.6' }}>
          Your current account role is <strong>{userRole}</strong>. This protected view requires <strong>{requiredRolesStr}</strong> permission.
        </p>
        <button
          onClick={() => navigateTo(user?.role === 'vendor' ? 'vendor-portal' : 'home')}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '15px' }}
        >
          Go to Your {user?.role === 'vendor' ? 'Vendor Dashboard' : 'Shopping Dashboard'}
        </button>
      </div>
    );
  }

  // User is authenticated and authorized -> render children
  return <>{children}</>;
};
