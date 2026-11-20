import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getLocalizedProductName, getLocalizedUnit } from '../utils/productLocalization';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CartDrawer = () => {
  const { 
    isCartDrawerOpen, 
    setIsCartDrawerOpen, 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    navigateTo,
    showToast,
    t,
    selectedLanguage
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  if (!isCartDrawerOpen) return null;

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
      showToast('Invalid coupon. Try FRESH10 or VILLAGE20 for instant discount', 'danger');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="vs-card animate-drawer-slide" style={{
        width: '100%',
        maxWidth: '460px',
        height: '100%',
        borderRadius: 0,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.2)'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid #e2e8f0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#f8fafc' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #2563eb 100%)', 
              color: '#ffffff', 
              padding: '8px', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>{t('cart.title', 'My Cart')}</h3>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsCartDrawerOpen(false)} 
            className="btn-close-modal touch-target-44"
            aria-label="Close Shopping Cart Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Delivery Progress Bar */}
        {cart.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #eff6ff 100%)',
            padding: '14px 24px',
            borderBottom: '1px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#1e40af' }}>
                <Truck size={16} className="animate-truck" color="#2563eb" />
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

            {/* Progress track */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#dbeafe',
              borderRadius: '999px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #2563eb, #2563eb)',
                borderRadius: '999px',
                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }} />
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
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
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{t('cart.emptyTitle', 'Your cart is empty')}</h4>
              <p style={{ fontSize: '13.5px', marginTop: '6px', color: '#64748b', lineHeight: 1.5 }}>
                {t('cart.emptySubtitle', 'Explore farm-fresh vegetables and local groceries!')}
              </p>
              <button
                onClick={() => { setIsCartDrawerOpen(false); navigateTo('categories'); }}
                className="btn-primary"
                style={{ marginTop: '24px', borderRadius: '16px', padding: '12px 24px' }}
              >
                <span>{t('cart.exploreProduce', 'Explore Fresh Produce')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            cart.map(({ product, quantity }) => {
              const prodName = getLocalizedProductName(product, selectedLanguage);
              const prodUnit = getLocalizedUnit(product.unit, selectedLanguage);
              return (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <img
                  src={product.image}
                  alt={prodName}
                  style={{ width: '72px', height: '72px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                        {prodName}
                      </h4>
                      <button 
                        type="button"
                        onClick={() => removeFromCart(product.id)} 
                        className="touch-target-44"
                        style={{ color: '#ef4444', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Remove item"
                        aria-label={`Remove ${prodName} from cart`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                      ₹{product.price} / {prodUnit}{product.vendorName ? ` • ${product.vendorName}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <strong style={{ fontSize: '16px', fontWeight: '900', color: '#2563eb' }}>
                      ₹{product.price * quantity}
                    </strong>

                    {/* Accessible Quantity Controls with min 36-44px touch targets */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '12px',
                      padding: '2px'
                    }}>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(product.id, quantity - 1)}
                        className="touch-target-44"
                        style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}
                        aria-label={`Decrease quantity of ${prodName}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ fontSize: '14px', fontWeight: '900', color: '#1e40af', minWidth: '22px', textAlign: 'center' }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(product.id, quantity + 1)}
                        className="touch-target-44"
                        style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}
                        aria-label={`Increase quantity of ${prodName}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );})
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Coupon (e.g. FRESH10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                />
                <Tag size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
              <button 
                type="submit" 
                className="btn-secondary" 
                style={{ fontSize: '12.5px', padding: '9px 16px', borderRadius: '10px' }}
              >
                Apply
              </button>
            </form>

            {/* Pricing Breakup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13.5px', color: '#475569', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('cart.itemsSubtotal', 'Items Subtotal')}</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('cart.deliveryFee', 'Delivery Fee')}</span>
                <span>{deliveryFee === 0 ? <span style={{ color: '#2563eb', fontWeight: '800' }}>{t('cart.free', 'FREE')}</span> : `₹${deliveryFee}`}</span>
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
                paddingTop: '10px', 
                borderTop: '1px solid #e2e8f0', 
                fontSize: '17px', 
                fontWeight: '900', 
                color: '#0f172a' 
              }}>
                <span>{t('cart.grandTotal', 'Total Payable')}</span>
                <span style={{ color: '#2563eb' }}>₹{total}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                navigateTo('checkout');
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px' }}
            >
              <span>{t('cart.checkoutBtn', 'Proceed to Checkout')}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
