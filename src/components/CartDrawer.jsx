import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
    showToast
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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
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
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>My Cart</h3>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                {cart.length} {cart.length === 1 ? 'item' : 'items'} selected
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
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            padding: '14px 24px',
            borderBottom: '1px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#065f46' }}>
                <Truck size={16} className="animate-truck" color="#059669" />
                <span>
                  {isFreeDelivery ? (
                    <strong style={{ color: '#059669' }}>🎉 You unlocked FREE Express Delivery!</strong>
                  ) : (
                    <span>Add <strong style={{ color: '#059669' }}>₹{amountToFreeDelivery}</strong> more for <strong>FREE Delivery</strong></span>
                  )}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#059669' }}>
                {progressPercent}%
              </span>
            </div>

            {/* Progress track */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#d1fae5',
              borderRadius: '999px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #10b981, #059669)',
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
                backgroundColor: '#f0fdf4',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto'
              }}>
                <ShoppingBag size={40} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Your cart is empty</h4>
              <p style={{ fontSize: '13.5px', marginTop: '6px', color: '#64748b', lineHeight: 1.5 }}>
                Explore fresh vegetables, fruits, and groceries from nearby local stores.
              </p>
              <button
                onClick={() => { setIsCartDrawerOpen(false); navigateTo('categories'); }}
                className="btn-primary"
                style={{ marginTop: '24px', borderRadius: '16px', padding: '12px 24px' }}
              >
                <span>Start Shopping</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
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
                  alt={product.name}
                  style={{ width: '72px', height: '72px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                        {product.shortName || product.name}
                      </h4>
                      <button 
                        type="button"
                        onClick={() => removeFromCart(product.id)} 
                        className="touch-target-44"
                        style={{ color: '#ef4444', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Remove item"
                        aria-label={`Remove ${product.shortName || product.name} from cart`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                      ₹{product.price} / {product.unit} • {product.vendorName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <strong style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>
                      ₹{product.price * quantity}
                    </strong>

                    {/* Accessible Quantity Controls with min 36-44px touch targets */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f0fdf4',
                      border: '1.5px solid #a7f3d0',
                      borderRadius: '12px',
                      padding: '2px'
                    }}>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(product.id, quantity - 1)}
                        className="touch-target-44"
                        style={{ color: '#059669', border: 'none', background: 'none', cursor: 'pointer' }}
                        aria-label={`Decrease quantity of ${product.shortName || product.name}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ fontSize: '14px', fontWeight: '900', color: '#065f46', minWidth: '22px', textAlign: 'center' }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(product.id, quantity + 1)}
                        className="touch-target-44"
                        style={{ color: '#059669', border: 'none', background: 'none', cursor: 'pointer' }}
                        aria-label={`Increase quantity of ${product.shortName || product.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
                <span>Subtotal</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Fee {subtotal >= freeDeliveryThreshold && '(FREE above ₹300)'}</span>
                <span>{deliveryFee === 0 ? <span style={{ color: '#059669', fontWeight: '800' }}>FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '700' }}>
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
                <span>Total Payable</span>
                <span style={{ color: '#059669' }}>₹{total}</span>
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
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
