import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { VENDORS } from '../data/vendors';
import { CheckCircle2, MapPin, Clock, ArrowRight, Store, CreditCard, ShieldCheck, Sparkles, Copy, Check, Navigation, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OrderConfirmationView = () => {
  const { orders, activeOrderId, navigateTo, setSelectedVendor, showToast } = useApp();
  const [copied, setCopied] = React.useState(false);

  const order = orders.find(o => o.id === activeOrderId) || orders[0];
  const vendor = VENDORS.find(v => v.id === order?.vendorId) || VENDORS[0];

  useEffect(() => {
    try {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (err) {}
  }, []);

  const handleCopyId = () => {
    if (order?.id) {
      navigator.clipboard?.writeText(order.id.toString());
      setCopied(true);
      showToast('Order ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!order) return null;

  return (
    <div className="container animate-fade-in" style={{ padding: '36px 0 60px 0', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }}>
        {/* Left Column: Success Header Card */}
        <div className="vs-card animate-modal-pop" style={{ 
          padding: '40px 32px', 
          borderRadius: '32px', 
          backgroundColor: '#ffffff', 
          textAlign: 'center',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.08)',
          border: '1.5px solid #d1fae5'
        }}>
          {/* Celebration Animated Green Check Icon */}
          <div style={{
            width: '92px',
            height: '92px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 22px auto',
            boxShadow: '0 12px 32px -4px rgba(16, 185, 129, 0.45)',
            position: 'relative'
          }}>
            <CheckCircle2 size={56} />
            <div style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              border: '2.5px solid rgba(16, 185, 129, 0.35)',
              animation: 'pulseGlowRing 2s infinite'
            }} />
          </div>

          <span className="badge badge-success" style={{ marginBottom: '14px', fontSize: '13px', padding: '6px 16px', fontWeight: '800' }}>
            <Sparkles size={15} color="#f59e0b" /> ORDER CONFIRMED & DISPATCHING
          </span>

          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#064e3b', marginBottom: '10px', letterSpacing: '-0.025em' }}>
            Order Placed Successfully!
          </h1>

          <p style={{ fontSize: '15.5px', color: '#475569', marginBottom: '28px', lineHeight: 1.55 }}>
            Thank you! Your order has been received by <strong style={{ color: '#0f172a' }}>{vendor.name}</strong> and is being prepared fresh.
          </p>

          {/* Order ID & Date Box */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            borderRadius: '20px',
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '26px'
          }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '12px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Order Reference</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                <strong style={{ fontSize: '22px', fontWeight: '900', color: '#064e3b' }}>#{order.id}</strong>
                <button 
                  onClick={handleCopyId}
                  style={{ 
                    background: '#ffffff', 
                    border: '1.5px solid #a7f3d0', 
                    borderRadius: '10px', 
                    padding: '5px 10px', 
                    fontSize: '12.5px', 
                    fontWeight: '800', 
                    color: '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block' }}>Order Placed At</span>
              <strong style={{ fontSize: '14px', color: '#334155', fontWeight: '800' }}>{order.date}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <button
              onClick={() => navigateTo('order-tracking', { orderId: order.id })}
              className="btn-primary"
              style={{ padding: '14px', borderRadius: '16px', fontSize: '14.5px', fontWeight: '800' }}
            >
              <Navigation size={17} />
              <span>Live GPS Tracking</span>
            </button>

            <button
              onClick={() => navigateTo('my-orders')}
              className="btn-secondary"
              style={{ padding: '14px', borderRadius: '16px', fontSize: '14.5px', fontWeight: '800' }}
            >
              <ShoppingBag size={17} />
              <span>All My Orders</span>
            </button>

            <button
              onClick={() => navigateTo('home')}
              style={{
                gridColumn: '1 / -1',
                padding: '12px',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ← Return to Storefront Home
            </button>
          </div>
        </div>

        {/* Right Column: Ordered Items & Vendor Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Vendor Card */}
          <div className="vs-card" style={{
            padding: '20px 24px',
            borderRadius: '24px',
            border: '1.5px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={vendor.avatar} alt={vendor.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #a7f3d0' }} />
              <div>
                <strong style={{ fontSize: '17px', color: '#0f172a', fontWeight: '800', display: 'block' }}>{vendor.name}</strong>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  ⭐ {vendor.rating} ({vendor.reviewCount}) • 📍 {vendor.distance} away in {vendor.location}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigateTo('product-listing', { vendor })}
              className="btn-outline"
              style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '12px', fontWeight: '700' }}
            >
              View Store
            </button>
          </div>

          {/* Order Items & Breakdown */}
          <div className="vs-card" style={{ padding: '28px', borderRadius: '28px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
              Ordered Items ({(order.items || []).length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14.5px', color: '#334155', marginBottom: '20px' }}>
              {(order.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600' }}>{item.name} <span style={{ color: '#64748b', fontSize: '13px' }}>({item.quantity} {item.unit})</span></span>
                  <strong style={{ color: '#0f172a', fontWeight: '800' }}>₹{(item.price || 0) * (item.quantity || 1)}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14.5px', color: '#475569', paddingTop: '14px', borderTop: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <strong style={{ color: '#0f172a' }}>₹{order.subtotal}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Express Rural Delivery</span>
                <span>{order.deliveryFee === 0 ? <strong style={{ color: '#059669' }}>FREE</strong> : `₹${order.deliveryFee}`}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '22px', 
                fontWeight: '900', 
                color: '#064e3b', 
                paddingTop: '12px', 
                borderTop: '1.5px dashed #cbd5e1' 
              }}>
                <span>Total Amount Paid</span>
                <span style={{ color: '#059669' }}>₹{order.total}</span>
              </div>
            </div>

            {/* Payment & Delivery Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px', textAlign: 'left' }}>
              <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', display: 'block' }}>Payment Method</span>
                  {order.upiRefId ? (
                    <span className="badge badge-success" style={{ fontSize: '9.5px', padding: '2px 7px', fontWeight: '800' }}>
                      ⚡ UPI Verified
                    </span>
                  ) : order.paymentMethod?.includes('Cash') ? (
                    <span className="badge badge-warning" style={{ fontSize: '9.5px', padding: '2px 7px', fontWeight: '800' }}>
                      Doorstep COD
                    </span>
                  ) : null}
                </div>
                <strong style={{ fontSize: '14px', color: '#0f172a', marginTop: '3px', display: 'block' }}>{order.paymentMethod}</strong>
                {order.upiRefId && (
                  <span style={{ fontSize: '11px', color: '#059669', fontFamily: 'monospace', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    UTR Ref: #{order.upiRefId}
                  </span>
                )}
                {order.stripePaymentId && (
                  <span style={{ fontSize: '10.5px', color: '#635bff', fontFamily: 'monospace', fontWeight: '700', display: 'block', marginTop: '1px' }}>
                    Stripe: {order.stripePaymentId.slice(0, 18)}...
                  </span>
                )}
              </div>
              <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                <span style={{ fontSize: '11.5px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', display: 'block' }}>Estimated Arrival</span>
                <strong style={{ fontSize: '14.5px', color: '#059669', marginTop: '2px', display: 'block' }}>⚡ ~20 mins Express Delivery</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
