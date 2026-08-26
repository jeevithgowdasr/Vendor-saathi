import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { VENDORS as INITIAL_VENDORS } from '../data/vendors';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import { 
  ShoppingBag, 
  MapPin, 
  Star, 
  Clock, 
  ArrowRight, 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  Store, 
  ShieldCheck, 
  Truck, 
  Heart, 
  Flame, 
  Mic, 
  Zap, 
  Tag, 
  CheckCircle2,
  Layers,
  Radio,
  Sliders,
  Smartphone
} from 'lucide-react';

export const HomeView = () => {
  const { 
    navigateTo, 
    addToCart, 
    cart, 
    updateCartQuantity, 
    toggleWishlist, 
    wishlist, 
    setIsVoiceAssistanceOpen, 
    setIsVoiceSearchOpen,
    currentLocation,
    user,
    products,
    vendors,
    showToast 
  } = useApp();

  const [flashTime, setFlashTime] = useState({ h: 2, m: 45, s: 18 });

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTime(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: 59, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return { h: 2, m: 45, s: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeProducts = products || INITIAL_PRODUCTS;
  const activeVendors = vendors || INITIAL_VENDORS;
  const popularProducts = activeProducts.filter(p => p.isPopular);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '30px' }}>
      {/* Dynamic Animated Hero Section */}
      <section style={{
        background: 'radial-gradient(ellipse at 80% 20%, #065f46 0%, #047857 35%, #064e3b 70%, #022c22 100%)',
        color: '#ffffff',
        padding: '52px 0 60px 0',
        borderRadius: '0 0 32px 32px',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.4)'
      }}>
        {/* Ambient Glow Orbs */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '5%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '10%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
            gap: '48px', 
            alignItems: 'center' 
          }}>
            {/* Left Hero Content */}
            <div>
              {/* Badge Chip */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.16)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(8px)',
                padding: '8px 18px',
                borderRadius: '28px',
                fontSize: '13.5px',
                fontWeight: '800',
                color: '#6ee7b7',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
              }}>
                <Sparkles size={18} color="#fbbf24" />
                <span>{currentLocation?.village || currentLocation?.name?.split(',')[0] || user?.village || 'Fast 20-Min'} • Express Delivery</span>
              </div>
              
              <h1 style={{ 
                fontSize: 'clamp(2.5rem, 5.2vw, 4rem)', 
                fontWeight: '900', 
                lineHeight: 1.1, 
                marginBottom: '18px', 
                letterSpacing: '-0.035em' 
              }}>
                Farm-Fresh Groceries from <br />
                <span style={{ 
                  background: 'linear-gradient(135deg, #34d399 0%, #a7f3d0 50%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  Your Local Village Vendors
                </span>
              </h1>

              <p style={{ fontSize: '17px', color: '#cbd5e1', marginBottom: '32px', lineHeight: 1.6 }}>
                Handpicked farm vegetables, ripe coastal fruits, regional spices, and dairy from trusted neighbourhood stores delivering to {currentLocation?.village || currentLocation?.name?.split(',')[0] || user?.village || 'your area'}.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button 
                  onClick={() => navigateTo('categories')}
                  className="btn-primary"
                  style={{ 
                    padding: '15px 32px', 
                    fontSize: '16px', 
                    borderRadius: '18px',
                    fontWeight: '800'
                  }}
                >
                  <span>Explore Fresh Catalog</span>
                  <ArrowRight size={20} />
                </button>
                
                <button 
                  onClick={() => navigateTo('nearby-vendors')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff', 
                    padding: '15px 26px', 
                    fontSize: '16px', 
                    borderRadius: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '800',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Store size={18} color="#fbbf24" /> 
                  <span>Nearby Kirana Stores</span>
                </button>
              </div>

              {/* Live Ticker */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '28px',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '12px',
                color: '#a7f3d0'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#34d399',
                  animation: 'pulseGlowRing 2s infinite'
                }}></span>
                <span><strong>Live:</strong> Fast delivery active in <strong>{currentLocation?.village || currentLocation?.name?.split(',')[0] || user?.village || 'your area'}</strong> • Average: <strong>20 mins</strong></span>
              </div>
            </div>

            {/* Right Hero Image with 3D Floating Badges */}
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{
                position: 'relative',
                borderRadius: '26px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}>
                <img
                  src="/hero-vendor-emblem.png"
                  alt="VendorSaathi Smart Rural Grocery Assistant"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '320px',
                    maxHeight: '440px',
                    aspectRatio: '16 / 10',
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                    display: 'block',
                    transition: 'transform 0.4s ease'
                  }}
                />
              </div>

              {/* Floating Badge 1: 20 Min Delivery */}
              <div 
                className="animate-float-slow"
                style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '-14px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#065f46',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 12px 24px -4px rgba(0,0,0,0.25)',
                  border: '1px solid #d1fae5',
                  zIndex: 3
                }}
              >
                <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '10px' }}>
                  <Truck size={18} color="#059669" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '13px', display: 'block', lineHeight: 1.1 }}>20 Mins Express</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>To your doorstep</span>
                </div>
              </div>

              {/* Floating Badge 2: 100% Farm Fresh */}
              <div 
                className="animate-float-reverse"
                style={{
                  position: 'absolute',
                  bottom: '-14px',
                  right: '-14px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#0f172a',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 12px 24px -4px rgba(0,0,0,0.25)',
                  border: '1px solid #fef3c7',
                  zIndex: 3
                }}
              >
                <div style={{ background: '#fffbeb', padding: '6px', borderRadius: '10px' }}>
                  <Star size={18} fill="#f59e0b" color="#f59e0b" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '13px', display: 'block', lineHeight: 1.1 }}>4.9★ Local Rating</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>500+ Happy Villagers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Trust Badges Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '44px'
        }}>
          <div className="vs-card vs-card-interactive" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#059669', padding: '12px', borderRadius: '14px', border: '1px solid #a7f3d0' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>100% Fresh Farm</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Direct from regional farmers</p>
            </div>
          </div>

          <div className="vs-card vs-card-interactive" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', color: '#d97706', padding: '12px', borderRadius: '14px', border: '1px solid #fde68a' }}>
              <Store size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Local Kirana Stores</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Support neighborhood stores</p>
            </div>
          </div>

          <div className="vs-card vs-card-interactive" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', padding: '12px', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
              <Truck size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Express 20-30 Mins</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Delivered on fast bikes</p>
            </div>
          </div>
        </div>

        {/* Shop By Categories Section */}
        <section style={{ marginBottom: '52px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '6px' }}>FRESH PRODUCE</span>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>Explore Categories</h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>Handpicked daily essentials from local vendors</p>
            </div>
            <button 
              onClick={() => navigateTo('categories')}
              style={{ 
                color: '#059669', 
                fontWeight: '800', 
                fontSize: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '10px',
                transition: 'background 0.2s ease'
              }}
            >
              <span>View All</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Categories Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '18px'
          }}>
            {CATEGORIES.slice(0, 5).map(cat => (
              <div
                key={cat.id}
                onClick={() => navigateTo('product-listing', { category: cat.id })}
                className="vs-card vs-card-interactive"
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    {cat.icon}
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                    {cat.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                    {cat.itemCount}+ Products Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Flash Deals with Realtime Countdown */}
        <section style={{ 
          marginBottom: '52px',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fff7ed 100%)',
          border: '1.5px solid #fde68a',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#f59e0b', color: '#ffffff', padding: '10px', borderRadius: '12px' }}>
                <Flame size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#78350f', lineHeight: 1.1 }}>
                  Flash Harvest Deals
                </h2>
                <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                  Special discounted prices for morning harvest
                </span>
              </div>
            </div>

            {/* Countdown Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #fcd34d',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: '800',
              color: '#b45309',
              fontSize: '13px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
              <Clock size={16} />
              <span>Ends in {String(flashTime.h).padStart(2, '0')}:{String(flashTime.m).padStart(2, '0')}:{String(flashTime.s).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Flash Products Grid */}
          <div className="product-grid">
            {popularProducts.slice(0, 4).map(prod => {
              const inCart = cart.find(item => item.product.id === prod.id);
              const isWish = wishlist.includes(prod.id);

              return (
                <div
                  key={prod.id}
                  className="vs-card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '18px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  {/* Discount Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    zIndex: 2
                  }}>
                    -20% OFF
                  </span>

                  {/* Wishlist Heart */}
                  <button
                    onClick={() => toggleWishlist(prod.id)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '6px',
                      borderRadius: '50%',
                      zIndex: 2,
                      color: isWish ? '#ef4444' : '#94a3b8',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Heart size={16} fill={isWish ? '#ef4444' : 'none'} />
                  </button>

                  <div 
                    onClick={() => navigateTo('product-detail', { product: prod })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ height: '180px', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309' }}>{prod.rating}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>({prod.reviewCount})</span>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: 1.3, minHeight: '36px' }}>
                      {prod.name}
                    </h4>

                    <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      📍 {prod.vendorName}
                    </span>

                    <div style={{ margin: '10px 0 6px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '900', color: '#059669' }}>
                        ₹{prod.price}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{Math.round(prod.price * 1.25)}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>
                        / {prod.unit}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart / Counter */}
                  <div style={{ marginTop: '8px' }}>
                    {inCart ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#ecfdf5',
                        border: '1.5px solid #a7f3d0',
                        borderRadius: '12px',
                        padding: '4px 8px'
                      }}>
                        <button
                          onClick={() => updateCartQuantity(prod.id, inCart.quantity - 1)}
                          style={{ color: '#059669', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                          <Minus size={15} />
                        </button>
                        <span style={{ fontWeight: '800', color: '#065f46', fontSize: '13px' }}>
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(prod.id, inCart.quantity + 1)}
                          style={{ color: '#059669', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="btn-primary"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '12px' }}
                      >
                        <Plus size={15} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Smart Voice AI Shopping Assistant Callout Banner */}
        <section style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #065f46 100%)',
          borderRadius: '28px',
          padding: '32px',
          color: '#ffffff',
          marginBottom: '52px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 36px -4px rgba(6, 78, 59, 0.35)'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#a7f3d0',
              marginBottom: '14px'
            }}>
              <Mic size={14} color="#fbbf24" />
              <span>Voice Ordering in Kannada & English</span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: '900', lineHeight: 1.2, marginBottom: '12px' }}>
              Speak Naturally to Order <br />
              <span style={{ color: '#fbbf24' }}>"2 Kilo Tomato Beku"</span>
            </h2>

            <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.6 }}>
              Can't type or searching in regional language? Just tap the microphone and speak in Kannada or English for instant item detection.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsVoiceSearchOpen(true)}
                className="btn-amber"
                style={{ borderRadius: '14px', padding: '11px 22px' }}
              >
                <Mic size={18} />
                <span>Try Voice Search Now</span>
              </button>

              <button
                onClick={() => setIsVoiceAssistanceOpen(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  padding: '11px 20px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sparkles size={16} color="#fbbf24" />
                <span>Audio Assistant</span>
              </button>
            </div>
          </div>

          {/* Equalizer Visualizer */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '60px',
              padding: '0 24px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span className="equalizer-bar eq-1"></span>
              <span className="equalizer-bar eq-2"></span>
              <span className="equalizer-bar eq-3"></span>
              <span className="equalizer-bar eq-4"></span>
              <span className="equalizer-bar eq-5"></span>
              <span className="equalizer-bar eq-2"></span>
              <span className="equalizer-bar eq-1"></span>
            </div>
            <span style={{ fontSize: '12px', color: '#a7f3d0', fontWeight: '600' }}>
              🎙️ Real-time Web Speech Synthesis Engine
            </span>
          </div>
        </section>

        {/* Nearby Local Stores Showcase */}
        <section style={{ marginBottom: '52px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px' }}>
            <div>
              <span className="badge badge-warning" style={{ marginBottom: '6px' }}>TRUSTED KIRANA</span>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>Nearby Village Stores</h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>Buy directly from your trusted neighbourhood vendors</p>
            </div>
            <button 
              onClick={() => navigateTo('nearby-vendors')}
              style={{ 
                color: '#059669', 
                fontWeight: '800', 
                fontSize: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>View All Stores</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {activeVendors.map(v => (
              <div
                key={v.id}
                className="vs-card vs-card-interactive"
                style={{ borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={v.image}
                      alt={v.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: '#065f46',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                      <span>Open Now</span>
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '14px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} color="#34d399" />
                      <span>{v.deliveryTime}</span>
                    </div>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a' }}>
                        {v.name}
                      </h3>
                      <div style={{
                        backgroundColor: '#fffbeb',
                        color: '#b45309',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span>{v.rating}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      📍 {v.distance} away • {v.location}
                    </p>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {v.categories.map((c, i) => (
                        <span 
                          key={i} 
                          style={{ 
                            backgroundColor: '#ecfdf5', 
                            color: '#059669', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            textTransform: 'capitalize'
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 16px 16px 16px' }}>
                  <button
                    onClick={() => navigateTo('product-listing', { vendor: v })}
                    className="btn-primary"
                    style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '12px' }}
                  >
                    <Store size={15} />
                    <span>Browse Store Catalog</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
