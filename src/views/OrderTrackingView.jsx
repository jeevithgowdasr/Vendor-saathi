import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Info, 
  ArrowLeft,
  Smartphone,
  Truck,
  Sparkles,
  Radio,
  Clock,
  ChevronRight,
  Store,
  Navigation
} from 'lucide-react';
import { playPopSound } from '../utils/audio';

export const OrderTrackingView = () => {
  const { 
    orders, 
    activeOrderId, 
    navigateTo, 
    setIsVendorChatOpen,
    setIsReviewModalOpen,
    setReviewOrder,
    activeRiderLocation
  } = useApp();

  const order = orders.find(o => o.id === activeOrderId) || orders[0];
  const [mapProgress, setMapProgress] = useState(0.5);

  useEffect(() => {
    if (activeRiderLocation && activeRiderLocation.progress) {
      setMapProgress(activeRiderLocation.progress);
    } else {
      const interval = setInterval(() => {
        setMapProgress(prev => (prev >= 0.95 ? 0.25 : prev + 0.04));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeRiderLocation]);

  if (!order) return null;

  const isDelivered = order.status === 'Delivered';
  const isCancelled = order.status === 'Cancelled';
  const isOutForDelivery = order.status === 'Out for Delivery';

  // Vector route coordinates for curved bezier curve
  const startX = 60;
  const startY = 180;
  const endX = 340;
  const endY = 60;
  const currentX = startX + (endX - startX) * mapProgress;
  const currentY = startY + (endY - startY) * mapProgress - Math.sin(mapProgress * Math.PI) * 45;

  return (
    <div className="container animate-fade-in" style={{ padding: '28px 0 60px 0', width: '100%' }}>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          onClick={() => navigateTo('my-orders')}
          style={{ 
            fontSize: '13.5px', 
            color: '#059669', 
            fontWeight: '800', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: '#ecfdf5',
            padding: '7px 16px',
            borderRadius: '12px',
            border: '1px solid #a7f3d0',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Back to My Orders
        </button>
      </div>

      {/* Header Title & Status Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        background: '#ffffff',
        padding: '20px 26px',
        borderRadius: '24px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Live Order Tracking #{order.id}
            </h1>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isDelivered ? '#10b981' : isCancelled ? '#ef4444' : '#f59e0b',
              animation: 'pulseGlowRing 2s infinite'
            }} />
          </div>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'block', marginTop: '3px' }}>
            Ordered from <strong>{order.vendorName}</strong> • {order.date} • Express 20-Min Rural Delivery
          </span>
        </div>
        
        <span className={`badge ${
          isDelivered ? 'badge-success' : isCancelled ? 'badge-danger' : isOutForDelivery ? 'badge-info' : 'badge-warning'
        }`} style={{ fontSize: '13.5px', padding: '8px 18px', fontWeight: '800' }}>
          {order.status}
        </span>
      </div>

      {/* Grid: Timeline & Live Vector Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Step Progression Timeline */}
        <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
            <Radio size={17} color="#10b981" />
            <span>Delivery Checkpoints (Live Synced)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {order.timeline.map((step, idx) => {
              const isCurrent = step.completed && (idx === order.timeline.length - 1 || !order.timeline[idx + 1]?.completed);
              
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  {idx < order.timeline.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '13px',
                      top: '26px',
                      bottom: '-20px',
                      width: '2px',
                      backgroundColor: step.completed ? '#10b981' : '#e2e8f0',
                      transition: 'background-color 0.3s ease'
                    }}></div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: step.completed ? '#10b981' : '#f1f5f9',
                      color: step.completed ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12.5px',
                      fontWeight: '900',
                      zIndex: 2,
                      boxShadow: step.completed ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {step.completed ? '✓' : idx + 1}
                    </div>
                    <div>
                      <strong style={{ 
                        fontSize: '14px', 
                        color: step.completed ? '#0f172a' : '#94a3b8',
                        display: 'block',
                        lineHeight: 1.2
                      }}>
                        {step.label}
                      </strong>
                      {isCurrent && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>
                          ● Active State
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{step.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Vector Route Animated Map */}
        <div className="vs-card" style={{ padding: '20px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Navigation size={16} color="#059669" /> Live GPS Vector Route
            </span>
            <span className="badge badge-info" style={{ fontSize: '11px' }}>
              {order.vendorName || 'Kirana Store'} ⇄ Your Doorstep
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '240px',
            backgroundColor: '#0f172a',
            borderRadius: '18px',
            position: 'relative',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
          }}>
            <svg width="100%" height="100%" viewBox="0 0 400 240" style={{ position: 'absolute', inset: 0 }}>
              {/* Background glow path */}
              <path d="M 60 180 Q 200 70, 340 60" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="12" strokeLinecap="round" />
              {/* Solid road line */}
              <path d="M 60 180 Q 200 70, 340 60" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              {/* Animated active path */}
              <path d="M 60 180 Q 200 70, 340 60" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="8 6" strokeLinecap="round" />

              {/* Vendor Store Pin */}
              <g transform="translate(60, 180)">
                <circle r="18" fill="rgba(16, 185, 129, 0.3)" className="animate-pulse-glow" />
                <circle r="14" fill="#059669" />
                <text x="-7" y="5" fill="#ffffff" fontSize="13">🏪</text>
              </g>

              {/* Customer Home Pin */}
              <g transform="translate(340, 60)">
                <circle r="18" fill="rgba(245, 158, 11, 0.3)" />
                <circle r="14" fill="#ea580c" />
                <text x="-6" y="5" fill="#ffffff" fontSize="13">📍</text>
              </g>

              {/* Delivery Scooter Rider */}
              {!isDelivered && !isCancelled && (
                <g transform={`translate(${currentX}, ${currentY})`}>
                  <circle r="16" fill="rgba(6, 182, 212, 0.4)" className="animate-pulse-glow" />
                  <circle r="12" fill="#06b6d4" />
                  <text x="-7" y="4" fill="#ffffff" fontSize="12">🛵</text>
                </g>
              )}
            </svg>

            {/* Floating Live Rider Badge */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '8px 14px',
              borderRadius: '14px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '13px', 
                  fontWeight: '800' 
                }}>
                  R
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Raju (Express Rider)</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Hero Splendor • KA-19-EX-4029</span>
                </div>
              </div>
              <a 
                href="tel:+919876543211" 
                style={{ 
                  backgroundColor: '#ecfdf5', 
                  color: '#059669', 
                  padding: '6px 12px', 
                  borderRadius: '10px', 
                  fontSize: '12px', 
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none'
                }}
              >
                <Phone size={13} /> Call Rider
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time sync notification banner */}
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '1.5px solid #a7f3d0',
        padding: '14px 20px',
        borderRadius: '18px',
        fontSize: '13.5px',
        color: '#065f46',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Sparkles size={20} color="#059669" />
        <span>
          <strong>Live Real-Time Order Sync:</strong> Your order is synced with {order.vendorName || 'your vendor'} via Firebase Cloud.
        </span>
      </div>

      {/* Order Items & Contact CTAs */}
      <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px', border: '1.5px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0', margin: '0 0 16px 0' }}>
          Items in this Delivery ({order.items.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {(order.items || []).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                )}
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block' }}>{item.name}</strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>{item.quantity} {item.unit} • ₹{item.price} / {item.unit}</span>
                </div>
              </div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>₹{(item.price || 0) * (item.quantity || 1)}</strong>
            </div>
          ))}
        </div>

        {/* Vendor Contact CTAs & Post-Delivery Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <a
            href={`tel:${order.vendorPhone || '+919876543210'}`}
            className="btn-outline"
            style={{ padding: '12px', fontSize: '13.5px', borderRadius: '12px', justifyContent: 'center' }}
          >
            <Phone size={16} /> Call {order.vendorName}
          </a>
          <button
            onClick={() => setIsVendorChatOpen(true)}
            className="btn-outline"
            style={{ padding: '12px', fontSize: '13.5px', borderRadius: '12px', justifyContent: 'center' }}
          >
            <MessageSquare size={16} /> Direct Vendor Chat
          </button>
          {isDelivered && (
            <>
              <button
                onClick={() => {
                  setReviewOrder(order);
                  setIsReviewModalOpen(true);
                }}
                className="btn-secondary"
                style={{ padding: '12px', fontSize: '13.5px', borderRadius: '12px', justifyContent: 'center', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: '800' }}
              >
                ⭐ Rate & Review Order
              </button>
              <button
                onClick={() => navigateTo('categories')}
                className="btn-primary"
                style={{ padding: '12px', fontSize: '13.5px', borderRadius: '12px', justifyContent: 'center' }}
              >
                🛒 Order Again
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer Total Card */}
      <div className="vs-card" style={{ 
        padding: '18px 24px', 
        borderRadius: '20px', 
        backgroundColor: '#f8fafc', 
        border: '1.5px solid #e2e8f0', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block' }}>Total Paid</span>
          <strong style={{ fontSize: '22px', fontWeight: '900', color: '#059669' }}>₹{order.total}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Payment Method</span>
            {order.upiRefId ? (
              <span className="badge badge-success" style={{ fontSize: '9.5px', padding: '1px 7px', fontWeight: '800' }}>
                ⚡ UPI Verified
              </span>
            ) : order.paymentMethod?.includes('Cash') ? (
              <span className="badge badge-warning" style={{ fontSize: '9.5px', padding: '1px 7px', fontWeight: '800' }}>
                Doorstep COD
              </span>
            ) : null}
          </div>
          <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginTop: '2px' }}>{order.paymentMethod}</strong>
          {order.upiRefId && (
            <span style={{ fontSize: '11px', color: '#059669', fontFamily: 'monospace', fontWeight: '800', display: 'block' }}>
              UTR: #{order.upiRefId}
            </span>
          )}
          {order.stripePaymentId && (
            <span style={{ fontSize: '10.5px', color: '#635bff', fontFamily: 'monospace', fontWeight: '700', display: 'block' }}>
              Stripe: {order.stripePaymentId.slice(0, 16)}...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
