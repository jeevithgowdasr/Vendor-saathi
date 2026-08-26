import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../data/products';
import { VENDORS } from '../data/vendors';
import { 
  Star, 
  MapPin, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  ArrowLeft, 
  Heart,
  Store,
  CheckCircle2,
  Clock,
  Truck,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProductDetailView = () => {
  const { 
    selectedProduct, 
    navigateTo, 
    addToCart, 
    cart, 
    updateCartQuantity, 
    toggleWishlist, 
    wishlist,
    showToast,
    setIsVendorChatOpen
  } = useApp();

  const product = selectedProduct || PRODUCTS[0];
  const vendor = VENDORS.find(v => v.id === product.vendorId) || VENDORS[0];
  const [quantity, setQuantity] = useState(1);

  const cartItem = cart.find(item => item.product.id === product.id);
  const isWish = wishlist.includes(product.id);

  const handleAddToCartWithConfetti = (e) => {
    addToCart(product, quantity);
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (err) {}
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigateTo('checkout');
  };

  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      {/* Interconnected Breadcrumbs & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
          <button onClick={() => navigateTo('home')} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '700' }}>Home</button>
          <span>/</span>
          <button onClick={() => navigateTo('categories')} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '700' }}>Categories</button>
          <span>/</span>
          <button onClick={() => navigateTo('product-listing', { category: product.category })} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '700', textTransform: 'capitalize' }}>{product.category}</button>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: '800' }}>{product.name}</span>
        </div>

        <button 
          onClick={() => navigateTo('product-listing')}
          style={{ 
            fontSize: '13px', 
            color: '#059669', 
            fontWeight: '800', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 14px',
            borderRadius: '12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0'
          }}
        >
          <ArrowLeft size={15} /> All Products
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '40px',
        marginBottom: '52px'
      }}>
        {/* Large Product Image Visual */}
        <div className="vs-card" style={{ 
          padding: '16px', 
          borderRadius: '28px', 
          overflow: 'hidden', 
          position: 'relative',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-md)'
        }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '340px',
              maxHeight: '480px',
              aspectRatio: '4 / 3',
              objectFit: 'cover', 
              borderRadius: '20px',
              display: 'block'
            }}
          />
          <button
            onClick={() => toggleWishlist(product.id)}
            style={{
              position: 'absolute',
              top: '30px',
              right: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '12px',
              borderRadius: '50%',
              boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              color: isWish ? '#ef4444' : '#94a3b8',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Heart size={22} fill={isWish ? '#ef4444' : 'none'} />
          </button>
        </div>

        {/* Product Details & Vendor Info */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge badge-success" style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                🌿 {product.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: '800', fontSize: '14px' }}>
                <Star size={17} fill="#f59e0b" color="#f59e0b" /> {product.rating} ({product.reviewCount} customer reviews)
              </div>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: 1.2, marginBottom: '14px' }}>
              {product.name}
            </h1>

            {/* Price & Unit */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: '#059669' }}>
                ₹{product.price}
              </span>
              <span style={{ fontSize: '18px', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₹{Math.round(product.price * 1.3)}
              </span>
              <span style={{ fontSize: '15px', color: '#64748b', fontWeight: '600' }}>
                / {product.unit}
              </span>
              <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                Save 25% Today
              </span>
            </div>

            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.65, marginBottom: '24px' }}>
              {product.description}
            </p>

            {/* Freshness Trust Features */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              marginBottom: '28px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', fontWeight: '700' }}>
                <ShieldCheck size={18} color="#059669" /> 100% Fresh Farm Sourced
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', fontWeight: '700' }}>
                <Clock size={18} color="#059669" /> 20-30 Mins Express Delivery
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', fontWeight: '700' }}>
                <Store size={18} color="#059669" /> Local Store Guarantee
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', fontWeight: '700' }}>
                <Zap size={18} color="#f59e0b" /> Cash on Delivery Available
              </div>
            </div>

            {/* Vendor Card Preview */}
            <div style={{
              padding: '16px',
              borderRadius: '18px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '28px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div 
                onClick={() => navigateTo('product-listing', { vendor })}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              >
                <img
                  src={vendor.avatar}
                  alt={vendor.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #a7f3d0' }}
                />
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#064e3b', display: 'block' }}>{vendor.name}</strong>
                  <span style={{ fontSize: '12px', color: '#059669' }}>📍 {vendor.distance} away • ⭐ {vendor.rating} ({vendor.reviewCount})</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigateTo('product-listing', { vendor })}
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
                >
                  <Store size={14} /> Store
                </button>
                <button
                  onClick={() => setIsVendorChatOpen(true)}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
                >
                  💬 Chat
                </button>
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Quantity:</span>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '6px 14px'
                }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ color: '#059669', padding: '4px' }}
                  >
                    <Minus size={16} />
                  </button>
                  <strong style={{ fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>
                    {quantity}
                  </strong>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ color: '#059669', padding: '4px' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  Total: <strong style={{ color: '#059669', fontSize: '16px' }}>₹{product.price * quantity}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
                <button
                  onClick={handleAddToCartWithConfetti}
                  className="btn-secondary"
                  style={{ padding: '14px', borderRadius: '14px', fontSize: '14.5px', fontWeight: '800' }}
                >
                  <ShoppingBag size={18} color="#059669" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="btn-primary"
                  style={{ padding: '14px', borderRadius: '14px', fontSize: '14.5px' }}
                >
                  <Zap size={18} color="#fef08a" />
                  <span>Buy Express Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>
            Similar Fresh Items
          </h3>
          <div className="product-grid">
            {relatedProducts.map(prod => (
              <div
                key={prod.id}
                onClick={() => navigateTo('product-detail', { product: prod })}
                className="vs-card vs-card-interactive"
                style={{ padding: '14px', borderRadius: '18px', cursor: 'pointer' }}
              >
                <div style={{ height: '170px', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                  <img
                    src={prod.image}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{prod.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>₹{prod.price}</span>
                  <span className="badge badge-success">View</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
