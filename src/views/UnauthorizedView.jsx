import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  Store, 
  ShoppingBag, 
  ArrowRight, 
  LogOut, 
  RotateCcw, 
  CheckCircle2, 
  Lock,
  UserCheck
} from 'lucide-react';

export const UnauthorizedView = ({ params = {} }) => {
  const { 
    user, 
    navigateTo, 
    secureLogout, 
    setIsAuthModalOpen, 
    setAuthModalInitialTab 
  } = useApp();

  const currentRole = (params?.currentRole || user?.role || 'customer').toLowerCase();
  const requiredRoles = params?.requiredRoles || (currentRole === 'customer' ? ['vendor'] : ['customer']);
  const attemptedView = params?.attemptedView || 'the requested route';

  const isCurrentCustomer = currentRole === 'customer';
  const isCurrentVendor = currentRole === 'vendor';

  return (
    <div className="container animate-fade-in" style={{ padding: '60px 20px 80px 20px', maxWidth: '640px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '28px',
        border: '1px solid #fee2e2',
        boxShadow: '0 20px 45px -10px rgba(239, 68, 68, 0.12)',
        padding: '36px 32px',
        textAlign: 'center'
      }}>
        {/* Header Icon */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '26px',
          backgroundColor: '#fef2f2',
          border: '2px solid #fecaca',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          boxShadow: '0 8px 20px rgba(220, 38, 38, 0.15)'
        }}>
          <ShieldAlert size={44} />
        </div>

        {/* 403 Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '0.5px',
          marginBottom: '14px'
        }}>
          <Lock size={13} /> 403 FORBIDDEN &bull; ROLE RESTRICTED
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
          Access Restricted
        </h1>

        <p style={{ fontSize: '15px', color: '#64748b', marginTop: '10px', marginBottom: '24px', lineHeight: '1.6' }}>
          You do not have permission to view <strong>{attemptedView}</strong>. This section is restricted by <strong>Role-Based Access Control (RBAC)</strong>.
        </p>

        {/* Role Comparison Card */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '18px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          marginBottom: '28px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Your Active Session:</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800',
              backgroundColor: isCurrentVendor ? '#eff6ff' : '#ecfdf5',
              color: isCurrentVendor ? '#2563eb' : '#059669',
              border: `1px solid ${isCurrentVendor ? '#bfdbfe' : '#a7f3d0'}`
            }}>
              {isCurrentVendor ? <Store size={13} /> : <ShoppingBag size={13} />}
              {user?.name || 'Logged User'} ({currentRole.toUpperCase()})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Required Role:</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a'
            }}>
              <UserCheck size={13} />
              {requiredRoles.map(r => r.toUpperCase()).join(' or ')}
            </span>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
            {isCurrentCustomer ? (
              <span>⚠️ <strong>Customer accounts</strong> cannot access Vendor Store Management, order dispatching, or inventory controls.</span>
            ) : (
              <span>⚠️ <strong>Vendor accounts</strong> cannot access Customer checkout, personal delivery carts, or consumer order placement in this view.</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Primary Action: Go to Authorized Portal */}
          {isCurrentVendor ? (
            <button
              onClick={() => navigateTo('vendor-portal')}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Store size={18} /> Go to Vendor Partner Portal <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigateTo('home')}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ShoppingBag size={18} /> Go to Customer Shopping Home <ArrowRight size={18} />
            </button>
          )}

          {/* Secondary Action: Switch Role / Sign In as Different User */}
          <button
            onClick={() => {
              setAuthModalInitialTab(isCurrentCustomer ? 'vendor' : 'google');
              setIsAuthModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '14px',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <RotateCcw size={16} /> Switch Account / Sign In with Different Role
          </button>

          {/* Tertiary Action: Secure Logout */}
          <button
            onClick={() => {
              if (typeof secureLogout === 'function') {
                secureLogout();
              }
            }}
            style={{
              width: '100%',
              padding: '10px 18px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#ef4444',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={15} /> Sign Out Securely
          </button>
        </div>
      </div>
    </div>
  );
};
