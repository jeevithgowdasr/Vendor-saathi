import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tag, Sparkles, ArrowLeft, Percent, Gift, Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

const COUPONS_LIST = [
  { code: 'FRESH10', desc: 'FLAT 10% OFF on all village produce orders', validTill: '30 Jun 2026', badge: 'Popular' },
  { code: 'SAVE100', desc: 'FLAT ₹100 OFF on orders above ₹499', validTill: '30 May 2026', badge: 'Best Value' },
  { code: 'FLAT50', desc: '₹50 OFF on first local store order above ₹199', validTill: '25 May 2026', badge: 'New Customer' },
  { code: 'FREESHIP', desc: 'Free 20-Min Express Delivery on all farm produce', validTill: '28 May 2026', badge: 'Express' },
  { code: 'UPI5', desc: '5% Instant Cashback on UPI Payments (GPay/PhonePe)', validTill: '31 May 2026', badge: 'UPI Offer' }
];

export const OffersView = () => {
  const { navigateTo, showToast } = useApp();
  const [scratched, setScratched] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleApplyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}
    showToast(`Coupon ${code} copied! Paste at checkout 🎉`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleScratch = () => {
    if (!scratched) {
      setScratched(true);
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      showToast('🎉 You revealed a SECRET 20% OFF coupon: VILLAGE20 !');
    } else {
      handleApplyCoupon('VILLAGE20');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      <button 
        onClick={() => navigateTo('home')}
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
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-warning" style={{ marginBottom: '8px' }}>
          <Sparkles size={13} color="#f59e0b" /> EXCLUSIVE SAVINGS
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
          Offers, Discounts & Village Vouchers
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Save on daily groceries, seasonal fruits, spices, and express doorstep deliveries from local vendors.
        </p>
      </div>

      {/* Interactive Scratch-Card Widget */}
      <div className="vs-card animate-fade-scale" style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)',
        color: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 32px -8px rgba(6, 78, 59, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge badge-warning" style={{ backgroundColor: '#fbbf24', color: '#0f172a', fontWeight: '800', marginBottom: '8px' }}>
              🎁 DAILY LUCKY REVEAL
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', lineHeight: 1.2 }}>
              Mystery Village Reward
            </h3>
            <p style={{ fontSize: '13px', color: '#a7f3d0', marginTop: '4px', maxWidth: '380px' }}>
              Tap below to unlock today's secret farm-fresh discount voucher!
            </p>
          </div>

          <div 
            onClick={handleScratch}
            style={{
              background: scratched 
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              border: '2px dashed rgba(255,255,255,0.5)',
              borderRadius: '18px',
              padding: '18px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: scratched ? '0 8px 20px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            {scratched ? (
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  20% OFF UNLOCKED!
                </span>
                <strong style={{ display: 'block', fontSize: '20px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                  VILLAGE20
                </strong>
                <span style={{ fontSize: '10.5px', color: '#92400e', fontWeight: '700' }}>Tap to Copy</span>
              </div>
            ) : (
              <div>
                <Gift size={28} color="#fbbf24" style={{ margin: '0 auto 4px auto', display: 'block' }} />
                <strong style={{ fontSize: '14px', color: '#ffffff' }}>Tap to Scratch & Reveal</strong>
                <span style={{ display: 'block', fontSize: '11px', color: '#6ee7b7' }}>1 Tap Instant Prize</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coupon List */}
      <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '18px' }}>
        Active Coupons for You
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {COUPONS_LIST.map((c, idx) => (
          <div 
            key={idx} 
            className="vs-card vs-card-interactive" 
            style={{ 
              padding: '20px 24px', 
              borderRadius: '20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', 
                color: '#059669', 
                padding: '14px', 
                borderRadius: '16px',
                border: '1px solid #a7f3d0'
              }}>
                <Tag size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '17px', color: '#064e3b', fontWeight: '900', letterSpacing: '0.3px' }}>
                    {c.code}
                  </strong>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>
                    {c.badge}
                  </span>
                </div>
                <span style={{ fontSize: '13.5px', color: '#475569', display: 'block', marginTop: '3px', fontWeight: '500' }}>
                  {c.desc}
                </span>
                <span style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  ⏰ Valid till {c.validTill}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleApplyCoupon(c.code)}
              className={copiedCode === c.code ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: '13px', padding: '9px 18px', borderRadius: '12px' }}
            >
              {copiedCode === c.code ? (
                <>
                  <Check size={15} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
