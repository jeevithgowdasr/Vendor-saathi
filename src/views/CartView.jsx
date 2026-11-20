import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getLocalizedProductName, getLocalizedUnit } from '../utils/productLocalization';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, ArrowLeft, Truck, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CartView = () => {
  const { cart, updateCartQuantity, removeFromCart, navigateTo, showToast, t, selectedLanguage } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const freeDeliveryThreshold = 300;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold || subtotal === 0;
  const deliveryFee = isFreeDelivery ? 0 : 20;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    let disc = 0;
    
    if (code === 'FRESH10') {
      disc = Math.round(subtotal * 0.1);
    } else if (code === 'VILLAGE20') {
      disc = Math.round(subtotal * 0.2);
    } else if (code === 'SAVE100') {
      disc = subtotal >= 400 ? 100 : Math.round(subtotal * 0.2);
    } else if (code === 'FLAT50') {
      disc = Math.min(50, subtotal);
    } else if (code === 'FREESHIP') {
      disc = deliveryFee;
    } else if (code === 'UPI5') {
      disc = Math.round(subtotal * 0.05);
    }

    if (disc > 0) {
      setDiscountAmount(disc);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      showToast(`Coupon ${code} applied! Saved ₹${disc} 🎉`);
    } else {
      showToast('Invalid code. Try FRESH10 or VILLAGE20 for instant discount', 'danger');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      <button 
        onClick={() => navigateTo('home')}
        style={{ 
          fontSize: '13.5px', 
          color: '#2563eb', 
          fontWeight: '800', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginBottom: '20px',
          backgroundColor: '#eff6ff',
          padding: '6px 14px',
          borderRadius: '12px',
          border: '1px solid #bfdbfe'
        }}
      >
        <ArrowLeft size={16} /> {t('checkout.backToCart', 'Continue Shopping')}
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
          🛍️ {t('cart.title', 'My Shopping Cart')} ({cart.length} {cart.length === 1 ? 'item' : 'items'})
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          {t('cart.emptySubtitle', 'Review your handpicked local village items before express delivery.')}
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="vs-card animate-fade-scale" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '28px', backgroundColor: '#ffffff' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto'
          }}>
            <ShoppingBag size={40} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>{t('cart.emptyTitle', 'Your cart is empty')}</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', maxWidth: '420px', margin: '6px auto 0 auto' }}>
            {t('cart.emptySubtitle', 'Add fresh vegetables, fruits, and daily essentials from nearby trusted local stores.')}
          </p>
          <button 
            onClick={() => navigateTo('categories')}
            className="btn-primary"
            style={{ marginTop: '24px', borderRadius: '16px', padding: '12px 28px', fontSize: '15px' }}
          >
            <span>{t('cart.exploreProduce', 'Start Shopping Now')}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Items Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Free Delivery Meter Card */}
            <div className="vs-card" style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #eff6ff 100%)',
              padding: '16px 20px',
              borderRadius: '20px',
              border: '1.5px solid #bfdbfe'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>
                  <Truck size={18} className="animate-truck" color="#2563eb" />
                  <span>
                    {isFreeDelivery ? (
                      <strong style={{ color: '#2563eb' }}>{t('cart.unlockedFreeDelivery', '🎉 You unlocked FREE Express Delivery!')}</strong>
                    ) : (
                      <span>{t('cart.addMoreForFreePrefix', 'Add')} <strong style={{ color: '#2563eb' }}>₹{amountToFreeDelivery}</strong> {t('cart.addMoreForFreeSuffix', 'more for FREE Delivery')}</span>
                    )}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb' }}>
                  {progressPercent}%
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#dbeafe',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #2563eb, #2563eb)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {cart.map(({ product, quantity }) => {
              const prodName = getLocalizedProductName(product, selectedLanguage);
              const prodUnit = getLocalizedUnit(product.unit, selectedLanguage);
              return (
              <div
                key={product.id}
                className="vs-card"
                style={{ 
                  padding: '18px 20px', 
                  borderRadius: '20px', 
                  display: 'flex', 
                  gap: '18px', 
                  alignItems: 'center',
                  backgroundColor: '#ffffff'
                }}
              >
                <img 
                  src={product.image} 
                  alt={prodName} 
                  onClick={() => navigateTo('product-detail', { product })}
                  style={{ width: '84px', height: '84px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 
                      onClick={() => navigateTo('product-detail', { product })}
                      style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2, cursor: 'pointer' }}
                    >
                      {prodName}
                    </h3>
                    <button 
                      onClick={() => removeFromCart(product.id)} 
                      style={{ color: '#ef4444', padding: '6px', borderRadius: '8px', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    ₹{product.price} / {prodUnit}{product.vendorName ? <> • Store: <strong>{product.vendorName}</strong></> : null}
                  </span>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <strong style={{ fontSize: '17px', fontWeight: '900', color: '#2563eb' }}>
                      ₹{product.price * quantity}
                    </strong>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      backgroundColor: '#eff6ff', 
                      border: '1.5px solid #bfdbfe', 
                      padding: '4px 10px', 
                      borderRadius: '10px' 
                    }}>
                      <button onClick={() => updateCartQuantity(product.id, quantity - 1)} style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                        <Minus size={15} />
                      </button>
                      <span style={{ fontWeight: '800', color: '#1e40af', fontSize: '14px', minWidth: '18px', textAlign: 'center' }}>
                        {quantity}
                      </span>
                      <button onClick={() => updateCartQuantity(product.id, quantity + 1)} style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );})}
          </div>

          {/* Pricing Order Summary */}
          <div>
            <div className="vs-card" style={{ padding: '26px', borderRadius: '24px', backgroundColor: '#ffffff', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                {t('checkout.orderSummary', 'Order Summary')}
              </h3>

              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Coupon code (FRESH10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: '10px 14px', 
                    borderRadius: '12px', 
                    border: '1.5px solid #cbd5e1', 
                    fontSize: '13px', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                />
                <button type="submit" className="btn-secondary" style={{ fontSize: '13px', padding: '10px 16px', borderRadius: '12px' }}>
                  Apply
                </button>
              </form>

              <div style={{ marginBottom: '18px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => navigateTo('offers')}
                  style={{
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: '800',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🏷️ View all available coupons & offers <ArrowRight size={12} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#475569', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('cart.itemsSubtotal', 'Subtotal')}</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('cart.deliveryFee', 'Delivery Fee')} {subtotal >= freeDeliveryThreshold && '(FREE above ₹300)'}</span>
                  <span>{deliveryFee === 0 ? <strong style={{ color: '#2563eb' }}>{t('cart.free', 'FREE')}</strong> : `₹${deliveryFee}`}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', fontWeight: '700' }}>
                    <span>Discount ({couponCode.toUpperCase() || 'Coupon'})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  paddingTop: '12px', 
                  borderTop: '1px solid #e2e8f0', 
                  fontSize: '20px', 
                  fontWeight: '900', 
                  color: '#0f172a' 
                }}>
                  <span>{t('cart.grandTotal', 'Total Amount')}</span>
                  <span style={{ color: '#2563eb' }}>₹{total}</span>
                </div>
              </div>

              <button
                onClick={() => navigateTo('checkout')}
                className="btn-primary"
                style={{ width: '100%', padding: '15px', borderRadius: '16px', fontSize: '16px', letterSpacing: '0.01em' }}
              >
                <span>{t('cart.checkoutBtn', 'Proceed to Checkout')}</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginTop: '14px' }}>
                <ShieldCheck size={16} color="#2563eb" />
                <span>{t('checkout.secureGuarantee', 'Express 20-Min Rural Delivery Guaranteed')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
