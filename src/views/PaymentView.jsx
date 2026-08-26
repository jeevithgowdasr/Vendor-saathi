import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, Banknote, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Lock, QrCode, Zap } from 'lucide-react';
import { UpiPaymentModal } from '../components/UpiPaymentModal';

export const PaymentView = () => {
  const { cart, user, placeOrder, navigateTo } = useApp();
  const [method, setMethod] = useState('UPI');
  const [upiId, setUpiId] = useState(user?.email ? `${user.email.split('@')[0]}@okaxis` : 'customer@okhdfcbank');
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = subtotal > 300 || subtotal === 0 ? 0 : 20;
  const total = subtotal + deliveryFee;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      navigateTo('categories');
      return;
    }

    if (method === 'UPI') {
      setIsUpiModalOpen(true);
      return;
    }

    // Cash on Delivery
    placeOrder({
      items: cart.map(i => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        unit: i.product.unit,
        quantity: i.quantity,
        image: i.product.image
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: 'Cash on Delivery (Doorstep)',
      paymentStatus: 'Pending (Cash on Delivery)',
      deliveryAddress: user?.address || 'Mijar, Moodbidri, Karnataka - 574225',
      vendorId: cart[0]?.product.vendorId || 'v1',
      vendorName: cart[0]?.product.vendorName || 'Ramesh Grocery'
    });
  };

  const handleUpiSuccess = (upiResult) => {
    setIsUpiModalOpen(false);
    placeOrder({
      items: cart.map(i => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        unit: i.product.unit,
        quantity: i.quantity,
        image: i.product.image
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: upiResult.paymentMethod || 'UPI (Instant QR)',
      upiRefId: upiResult.upiRefId,
      upiVpa: upiResult.upiVpa,
      upiApp: upiResult.upiApp,
      paymentStatus: upiResult.paymentStatus || `Paid via UPI (UTR #${upiResult.upiRefId})`,
      deliveryAddress: user?.address || 'Mijar, Moodbidri, Karnataka - 574225',
      vendorId: cart[0]?.product.vendorId || 'v1',
      vendorName: cart[0]?.product.vendorName || 'Ramesh Grocery'
    });
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      <button 
        onClick={() => navigateTo('checkout')}
        style={{ 
          fontSize: '13.5px', 
          color: '#059669', 
          fontWeight: '800', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginBottom: '20px',
          backgroundColor: '#ecfdf5',
          padding: '6px 14px',
          borderRadius: '12px',
          border: '1px solid #a7f3d0'
        }}
      >
        <ArrowLeft size={16} /> Back to Delivery Address
      </button>

      {/* Step Indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '28px', 
        position: 'relative', 
        padding: '16px 28px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>✓</div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#059669' }}>1. Address & Items</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.25)' }}>2</div>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#064e3b' }}>2. Payment Authorization</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>3</div>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>3. Live Tracking</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Payment Options Card */}
        <div className="vs-card" style={{ padding: '32px', borderRadius: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Select Payment Method
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            Safe, encrypted payments directly connected with your verified local store.
          </p>

          <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* UPI */}
            {/* UPI Option */}
            <label style={{
              padding: '20px',
              borderRadius: '22px',
              border: method === 'UPI' ? '2.5px solid #059669' : '1.5px solid #e2e8f0',
              backgroundColor: method === 'UPI' ? '#f0fdf4' : '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: method === 'UPI' ? '0 6px 20px -4px rgba(5, 150, 105, 0.18)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <input type="radio" name="pay" value="UPI" checked={method === 'UPI'} onChange={() => setMethod('UPI')} style={{ accentColor: '#059669', width: '20px', height: '20px' }} />
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    padding: '10px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669'
                  }}>
                    <Smartphone size={26} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block', fontWeight: '900' }}>
                      UPI / QR Code Instant Payment
                    </strong>
                    <span style={{ fontSize: '12.5px', color: '#059669', fontWeight: '700' }}>
                      ⚡ 0% Fee • GPay, PhonePe, Paytm, BHIM & All UPI Apps
                    </span>
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '11px', padding: '3px 9px', fontWeight: '900' }}>
                  Instant
                </span>
              </div>

              {method === 'UPI' && (
                <div style={{ marginLeft: '40px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', fontSize: '11px', fontWeight: '800' }}>🔵 GPay</span>
                  <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#5f259f', fontSize: '11px', fontWeight: '800' }}>🟣 PhonePe</span>
                  <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#00baf2', fontSize: '11px', fontWeight: '800' }}>🔵 Paytm</span>
                  <span className="badge" style={{ backgroundColor: '#e0f2f1', color: '#00796b', fontSize: '11px', fontWeight: '800' }}>🟠 BHIM</span>
                </div>
              )}
            </label>

            {/* Cash on Delivery */}
            <label style={{
              padding: '18px 20px',
              borderRadius: '20px',
              border: method === 'Cash on Delivery' ? '2px solid #059669' : '1.5px solid #e2e8f0',
              backgroundColor: method === 'Cash on Delivery' ? '#f0fdf4' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              <input type="radio" name="pay" value="Cash on Delivery" checked={method === 'Cash on Delivery'} onChange={() => setMethod('Cash on Delivery')} style={{ accentColor: '#059669', width: '18px', height: '18px' }} />
              <div style={{
                backgroundColor: '#fff7ed',
                padding: '9px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c'
              }}>
                <Banknote size={24} />
              </div>
              <div>
                <strong style={{ fontSize: '15.5px', color: '#0f172a', display: 'block', fontWeight: '800' }}>Cash on Delivery (COD)</strong>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Pay in cash directly to the delivery rider upon arrival</span>
              </div>
            </label>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '16px', borderRadius: '18px', fontSize: '16.5px', marginTop: '14px' }}
            >
              {method === 'UPI' ? (
                <>
                  <Zap size={20} />
                  <span>PAY ₹{total} VIA INSTANT UPI GATEWAY</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Complete Order (COD - ₹{total})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary & Trust */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="vs-card" style={{ padding: '28px', borderRadius: '28px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              Payment Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14.5px', color: '#475569', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal ({cart.length} items)</span>
                <strong style={{ color: '#0f172a' }}>₹{subtotal}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Express Rural Delivery</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: '#059669' }}>FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '14px', 
                borderTop: '1.5px solid #e2e8f0', 
                fontSize: '22px', 
                fontWeight: '900', 
                color: '#064e3b' 
              }}>
                <span>Total Amount</span>
                <span style={{ color: '#059669' }}>₹{total}</span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              padding: '16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ShieldCheck size={22} color="#059669" />
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>100% NPCI UPI Protected</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Direct bank-to-bank settlement with instant receipt.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        amount={total}
        orderDetails={{
          orderId: `VS${Math.floor(10000 + Math.random() * 90000)}`,
          itemsSummary: cart.map(i => `${i.quantity}x ${i.product.shortName || i.product.name}`).join(', '),
          vendorName: cart[0]?.product.vendorName || 'Ramesh Grocery'
        }}
        onPaymentSuccess={handleUpiSuccess}
      />
    </div>
  );
};

