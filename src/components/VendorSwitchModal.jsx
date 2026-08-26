import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, ShoppingBag, X, RefreshCw, Sparkles } from 'lucide-react';

export const VendorSwitchModal = () => {
  const { 
    isVendorSwitchModalOpen, 
    setIsVendorSwitchModalOpen, 
    pendingVendorConflict, 
    clearCartAndAddVendorProduct,
    showToast
  } = useApp();

  if (!isVendorSwitchModalOpen || !pendingVendorConflict) return null;

  const { currentVendorName, newVendorName, newProduct } = pendingVendorConflict;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="vs-card animate-modal-pop" style={{
        width: '100%',
        maxWidth: '460px',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: '32px 24px',
        borderRadius: '28px',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        border: '1.5px solid #fed7aa'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          color: '#d97706',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 6px 18px rgba(245, 158, 11, 0.3)',
          border: '2px solid #fcd34d'
        }}>
          <AlertTriangle size={32} />
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Single Store Cart
        </h3>

        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, marginBottom: '20px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          Your cart currently contains items from <strong style={{ color: '#0f172a' }}>{currentVendorName}</strong>. 
          To ensure 20-min express rural delivery, orders are fulfilled by one store at a time.
        </p>

        <div style={{
          backgroundColor: '#fffbeb',
          border: '1.5px solid #fde68a',
          padding: '14px',
          borderRadius: '16px',
          fontSize: '13px',
          color: '#334155',
          marginBottom: '24px',
          textAlign: 'left',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}>
          <strong style={{ color: '#0f172a' }}>New Item to add:</strong> {newProduct.name} (₹{newProduct.price}/{newProduct.unit})<br />
          <strong style={{ color: '#b45309' }}>From Store:</strong> {newVendorName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={clearCartAndAddVendorProduct}
            className="btn-amber touch-target-48"
            style={{ width: '100%', padding: '13px', borderRadius: '14px', fontSize: '14px', fontWeight: '800' }}
          >
            <RefreshCw size={17} />
            <span>Clear Cart & Switch to {newVendorName}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsVendorSwitchModalOpen(false);
              showToast('Kept current store items', 'info');
            }}
            className="btn-secondary touch-target-48"
            style={{ width: '100%', padding: '13px', borderRadius: '14px', fontSize: '14px', fontWeight: '700' }}
          >
            Keep Current Cart ({currentVendorName})
          </button>
        </div>
      </div>
    </div>
  );
};
