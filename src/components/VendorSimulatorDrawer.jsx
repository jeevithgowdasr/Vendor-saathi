import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useVendorSync } from '../context/VendorSyncContext';
import { Smartphone, Check, Clock, Truck, CheckCircle2, AlertCircle, RefreshCw, X, Shield, PhoneCall, Radio, Store, ArrowRight, ExternalLink } from 'lucide-react';
import { playPopSound, playStatusUpdateSound } from '../utils/audio';

export const VendorSimulatorDrawer = () => {
  const { 
    isVendorSimOpen, 
    setIsVendorSimOpen, 
    orders, 
    activeOrderId, 
    setActiveOrderId, 
    navigateTo,
    showToast 
  } = useApp();
  const { updateVendorOrderState } = useVendorSync();

  if (!isVendorSimOpen) return null;

  const currentOrder = orders.find(o => o.id === activeOrderId) || orders[0];

  const handleStatusChange = (newStatus) => {
    if (!currentOrder) return;
    updateVendorOrderState(currentOrder.id, newStatus);
    playStatusUpdateSound();
    showToast(`📱 [Vendor App Sim] Order #${currentOrder.id} status updated to "${newStatus}"!`);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.84)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      {/* Smartphone Outer Shell */}
      <div className="vs-card animate-modal-pop" style={{
        width: '100%',
        maxWidth: '410px',
        height: '760px',
        maxHeight: '94vh',
        backgroundColor: '#090d16',
        borderRadius: '40px',
        boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.1)',
        border: '5px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Phone Notch & Status Bar */}
        <div style={{
          backgroundColor: '#090d16',
          padding: '10px 20px 6px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '700'
        }}>
          <span>9:41</span>
          {/* Dynamic Island / Notch */}
          <div style={{ 
            width: '90px', 
            height: '18px', 
            backgroundColor: '#1e293b', 
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#064e3b' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulseGlowRing 2s infinite' }} />
          </div>
          <button 
            type="button"
            onClick={() => setIsVendorSimOpen(false)} 
            className="touch-target-44"
            style={{ color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%' }}
            title="Close Simulator"
            aria-label="Close Vendor Simulator"
          >
            <X size={20} />
          </button>
        </div>

        {/* Vendor Partner App Header */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          color: '#ffffff',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(6, 95, 70, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={18} color="#fbbf24" />
              <strong style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>Ramesh Kirana Store</strong>
            </div>
            <span style={{ fontSize: '11px', color: '#a7f3d0', display: 'block', marginTop: '1px' }}>
              📍 Mijar Village • Partner Portal v2.4
            </span>
          </div>
          <span className="badge badge-success" style={{ backgroundColor: '#ffffff', color: '#065f46', fontSize: '10px' }}>
            🟢 LIVE SYNC
          </span>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', overflowY: 'auto' }}>
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '10px 14px',
            borderRadius: '14px',
            fontSize: '12px',
            color: '#b45309',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>Clicking buttons below updates the vendor state and syncs <strong>live</strong> to customer tracking.</span>
          </div>

          {/* Full Portal Link Pill */}
          <button
            onClick={() => {
              setIsVendorSimOpen(false);
              navigateTo('vendor-portal');
            }}
            style={{
              width: '100%',
              backgroundColor: '#064e3b',
              color: '#ffffff',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '14px'
            }}
          >
            <ExternalLink size={14} /> Open Fullscreen Vendor Partner Portal
          </button>

          {/* Select Active Order if multiple exist */}
          {orders.length > 1 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Select Active Order to Manage:
              </label>
              <select
                value={currentOrder?.id}
                onChange={(e) => setActiveOrderId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#0f172a',
                  backgroundColor: '#ffffff'
                }}
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    Order #{o.id} — ₹{o.total} ({o.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentOrder ? (
            <div>
              {/* Order Card */}
              <div className="vs-card" style={{ padding: '16px', marginBottom: '18px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '16px', color: '#0f172a', fontWeight: '900' }}>Order #{currentOrder.id}</strong>
                    <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b' }}>{currentOrder.date}</span>
                  </div>
                  <span className={`badge ${
                    currentOrder.status === 'Delivered' ? 'badge-success' :
                    currentOrder.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                  }`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                    {currentOrder.status}
                  </span>
                </div>

                <div style={{ 
                  fontSize: '12.5px', 
                  color: '#334155', 
                  padding: '10px 0', 
                  borderTop: '1px solid #f1f5f9', 
                  borderBottom: '1px solid #f1f5f9', 
                  margin: '8px 0',
                  lineHeight: 1.5
                }}>
                  <strong>Customer:</strong> {currentOrder.deliveryAddress?.split(',')[0] || 'Bhavana Bai'}<br />
                  <strong>Phone:</strong> {currentOrder.deliveryContact || '+91 9876543210'}<br />
                  <strong>Address:</strong> {currentOrder.deliveryAddress}
                </div>

                {/* Items List */}
                <div style={{ fontSize: '12.5px', marginTop: '10px' }}>
                  <strong style={{ color: '#475569', display: 'block', marginBottom: '6px', fontSize: '12px' }}>Items ({currentOrder.items.length}):</strong>
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b', marginBottom: '4px' }}>
                      <span>{item.quantity} x {item.name}</span>
                      <span style={{ fontWeight: '700' }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '10px', 
                    paddingTop: '8px', 
                    borderTop: '1px dashed #cbd5e1', 
                    fontWeight: '900', 
                    fontSize: '14px' 
                  }}>
                    <span>Total ({currentOrder.paymentMethod})</span>
                    <span style={{ color: '#059669' }}>₹{currentOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* Vendor Action Controls */}
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Simulate Order Lifecycle State:
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleStatusChange('Accepted')}
                    className="btn-primary"
                    style={{
                      background: currentOrder.status === 'Accepted' 
                        ? 'linear-gradient(135deg, #047857 0%, #064e3b 100%)' 
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      padding: '11px 16px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      justifyContent: 'flex-start',
                      boxShadow: currentOrder.status === 'Accepted' ? '0 0 0 2px #34d399' : 'none'
                    }}
                  >
                    <Check size={17} />
                    <span>1. Accept Order from Customer</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange('Preparing')}
                    className="btn-primary"
                    style={{
                      background: currentOrder.status === 'Preparing' 
                        ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' 
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      padding: '11px 16px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      justifyContent: 'flex-start',
                      boxShadow: currentOrder.status === 'Preparing' ? '0 0 0 2px #fbbf24' : 'none'
                    }}
                  >
                    <Clock size={17} />
                    <span>2. Packing Fresh Produce</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange('Out for Delivery')}
                    className="btn-primary"
                    style={{
                      background: currentOrder.status === 'Out for Delivery' 
                        ? 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)' 
                        : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      padding: '11px 16px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      justifyContent: 'flex-start',
                      boxShadow: currentOrder.status === 'Out for Delivery' ? '0 0 0 2px #38bdf8' : 'none'
                    }}
                  >
                    <Truck size={17} />
                    <span>3. Out for Delivery (GPS Route Active)</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange('Delivered')}
                    className="btn-primary"
                    style={{
                      background: currentOrder.status === 'Delivered' 
                        ? 'linear-gradient(135deg, #065f46 0%, #022c22 100%)' 
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      padding: '11px 16px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      justifyContent: 'flex-start',
                      boxShadow: currentOrder.status === 'Delivered' ? '0 0 0 2px #34d399' : 'none'
                    }}
                  >
                    <CheckCircle2 size={17} />
                    <span>4. Mark Order Delivered</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              No active order to manage
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div style={{ backgroundColor: '#090d16', padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px', borderTop: '1px solid #1e293b' }}>
          ⚡ VendorSaathi Real-Time Two-Way Sync Active
        </div>
      </div>
    </div>
  );
};
