import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
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
  Smartphone,
  Package
} from 'lucide-react';
import { WeatherWidget } from '../components/WeatherWidget';
import { PartnerStores } from '../components/PartnerStores';
import { getFormattedDistanceAndETA } from '../utils/geolocation';

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
    setIsAuthModalOpen,
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

  // Scroll-triggered non-intrusive Sign-In pop-up for unauthenticated visitors
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const dismissed = sessionStorage.getItem('signin_popup_dismissed') || sessionStorage.getItem('vs_signin_dismissed');
      const isUnauthenticated = !user || !user.isLoggedIn;
      if (isUnauthenticated && scrollPosition > 350 && !dismissed) {
        try {
          sessionStorage.setItem('signin_popup_dismissed', 'true');
          sessionStorage.setItem('vs_signin_dismissed', 'true');
        } catch (e) {}
        setIsAuthModalOpen(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, setIsAuthModalOpen]);

  const activeProducts = (products || []).filter(p => {
    // 1. Strict Category Exclusion for Customer Side (Only Vegetables, Fruits, Greens/Soppu, Flowers)
    const catLower = (p.category || '').toLowerCase();
    const disallowed = ['dry fruit', 'daily essential', 'snack', 'bakery', 'grain', 'pulse', 'grocery & oil', 'grocery', 'oil'];
    if (disallowed.some(d => catLower.includes(d))) return false;

    // 2. Vendor Catalog Active Control: Only show active, approved items
    if (p.status === 'inactive' || p.status === 'blocked' || p.isApproved === false) {
      return false;
    }
    return p.is_available !== false;
  });
  const activeVendors = vendors || [];
  const popularProducts = activeProducts.filter(p => p.isPopular);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '30px' }}>
      {/* Dynamic Animated Hero Section - Cool Slate / Deep Indigo Palette */}
      <section style={{
        background: 'radial-gradient(ellipse at 80% 20%, #1e293b 0%, #0f172a 65%, #020617 100%)',
        color: '#ffffff',
        padding: '52px 0 60px 0',
        borderRadius: '0 0 32px 32px',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.45)',
        borderBottom: '1px solid #334155'
      }}>
        {/* Ambient Glow Orbs in Cool Blue and Cyan */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '5%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0) 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '10%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 70%)',
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
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '8px 18px',
                borderRadius: '28px',
                fontSize: '13.5px',
                fontWeight: '800',
                color: '#38bdf8',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)'
              }}>
                <Sparkles size={18} color="#38bdf8" />
                <span>{currentLocation?.village || currentLocation?.name?.split(',')[0] || user?.village || 'Fast 20-Min'} • Express Delivery</span>
              </div>
              
              <h1 style={{ 
                fontSize: 'clamp(2.5rem, 5.2vw, 4rem)', 
                fontWeight: '900', 
                lineHeight: 1.1, 
                marginBottom: '18px', 
                letterSpacing: '-0.035em',
                color: '#ffffff'
              }}>
                Farm-Fresh Groceries from <br />
                <span style={{ 
                  background: 'linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #93c5fd 100%)',
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
                  style={{ 
                    padding: '15px 32px', 
                    fontSize: '16px', 
                    borderRadius: '18px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.38)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.38)';
                  }}
                >
                  <span>Explore Fresh Catalog</span>
                  <ArrowRight size={20} />
                </button>
                
                <button 
                  onClick={() => navigateTo('nearby-vendors')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1.5px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff', 
                    padding: '15px 26px', 
                    fontSize: '16px', 
                    borderRadius: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Store size={18} color="#38bdf8" /> 
                  <span>Nearby Kirana Stores</span>
                </button>
              </div>

              {/* Live Ticker */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '28px',
                background: 'rgba(15, 23, 42, 0.65)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '12px',
                color: '#93c5fd'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
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
                  background: 'rgba(255, 255, 255, 0.98)',
                  color: '#0f172a',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.18)',
                  border: '1.5px solid #e2e8f0',
                  zIndex: 3
                }}
              >
                <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '10px' }}>
                  <Truck size={18} color="#2563eb" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '13px', display: 'block', lineHeight: 1.1, color: '#0f172a' }}>20 Mins Express</strong>
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
                  background: 'rgba(255, 255, 255, 0.98)',
                  color: '#0f172a',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.18)',
                  border: '1.5px solid #e2e8f0',
                  zIndex: 3
                }}
              >
                <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '10px' }}>
                  <Star size={18} fill="#f59e0b" color="#f59e0b" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '13px', display: 'block', lineHeight: 1.1, color: '#0f172a' }}>4.9★ Local Rating</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>500+ Happy Villagers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Real-Time Local Weather Forecast & Agricultural Climate Advisory */}
        <div style={{ marginBottom: '28px', marginTop: '10px' }}>
          <WeatherWidget />
        </div>

        {/* Trust Badges Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '44px'
        }}>
          <div className="vs-card vs-card-interactive" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>100% Fresh Farm</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Direct from regional farmers</p>
            </div>
          </div>

          <div className="vs-card vs-card-interactive" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ background: '#f8fafc', color: '#0f172a', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <Store size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Local Kirana Stores</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Support neighborhood stores</p>
            </div>
          </div>

          <div className="vs-card vs-card-interactive" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ background: '#f0f9ff', color: '#0284c7', padding: '12px', borderRadius: '14px', border: '1px solid #bae6fd' }}>
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
              <span style={{ display: 'inline-block', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '3px 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>FRESH PRODUCE</span>
              <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>Explore Categories</h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>Handpicked daily essentials from local vendors</p>
            </div>
            <button 
              onClick={() => navigateTo('categories')}
              style={{ 
                color: '#2563eb', 
                fontWeight: '800', 
                fontSize: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {CATEGORIES.map(cat => (
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
                  <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700' }}>
                    {cat.itemCount}+ Products Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Flash Deals with Realtime Countdown - Cool Tone Palette */}
        <section style={{ 
          marginBottom: '52px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}>
                <Flame size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  Flash Harvest Deals
                </h2>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
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
              border: '1.5px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: '800',
              color: '#0f172a',
              fontSize: '13px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
            }}>
              <Clock size={16} color="#2563eb" />
              <span>Ends in {String(flashTime.h).padStart(2, '0')}:{String(flashTime.m).padStart(2, '0')}:{String(flashTime.s).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Flash Products Grid */}
          {activeProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1.5px dashed #cbd5e1' }}>
              <Package size={40} color="#2563eb" style={{ margin: '0 auto 10px auto' }} />
              <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>Fresh Produce Arriving Soon</strong>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '6px auto 16px auto' }}>
                Local mobile vendors are updating their catalogs for upcoming village delivery routes. Check upcoming schedules!
              </p>
              <button
                onClick={() => navigateTo('nearby-vendors')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                📅 View Upcoming Scheduled Visits
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {(popularProducts.length > 0 ? popularProducts : activeProducts).slice(0, 4).map(prod => {
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
                    border: '1.5px solid #e2e8f0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(15, 23, 42, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.04)';
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
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '6px',
                      borderRadius: '50%',
                      zIndex: 2,
                      color: isWish ? '#ef4444' : '#94a3b8',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
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
                      <span style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
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
                        backgroundColor: '#eff6ff',
                        border: '1.5px solid #bfdbfe',
                        borderRadius: '12px',
                        padding: '4px 8px'
                      }}>
                        <button
                          onClick={() => updateCartQuantity(prod.id, inCart.quantity - 1)}
                          style={{ color: '#2563eb', padding: '4px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Minus size={15} />
                        </button>
                        <span style={{ fontWeight: '800', color: '#1e40af', fontSize: '13px' }}>
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(prod.id, inCart.quantity + 1)}
                          style={{ color: '#2563eb', padding: '4px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod, 1)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '13px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                        }}
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
        )}
        </section>

        {/* Smart Voice AI Shopping Assistant Callout Banner - Cool Slate / Indigo Theme */}
        <section style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
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
          boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.35)',
          border: '1px solid #334155'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#38bdf8',
              marginBottom: '14px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <Mic size={14} color="#38bdf8" />
              <span>Voice Ordering in Kannada, English & Hindi</span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: '900', lineHeight: 1.2, marginBottom: '12px' }}>
              Speak Naturally to Order <br />
              <span style={{ color: '#38bdf8' }}>"2 Kilo Tomato Beku"</span>
            </h2>

            <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.6 }}>
              Can't type or searching in regional language? Just tap the microphone and speak in Kannada, English, or Hindi for instant item detection.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsVoiceSearchOpen(true)}
                style={{
                  borderRadius: '14px',
                  padding: '11px 22px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                }}
              >
                <Mic size={18} />
                <span>Try Voice Search Now</span>
              </button>

              <button
                onClick={() => setIsVoiceAssistanceOpen(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  padding: '11px 20px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sparkles size={16} color="#38bdf8" />
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
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <span className="equalizer-bar eq-1" style={{ backgroundColor: '#38bdf8' }}></span>
              <span className="equalizer-bar eq-2" style={{ backgroundColor: '#60a5fa' }}></span>
              <span className="equalizer-bar eq-3" style={{ backgroundColor: '#38bdf8' }}></span>
              <span className="equalizer-bar eq-4" style={{ backgroundColor: '#60a5fa' }}></span>
              <span className="equalizer-bar eq-5" style={{ backgroundColor: '#38bdf8' }}></span>
              <span className="equalizer-bar eq-2" style={{ backgroundColor: '#60a5fa' }}></span>
              <span className="equalizer-bar eq-1" style={{ backgroundColor: '#38bdf8' }}></span>
            </div>
            <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '600' }}>
              🎙️ Real-time Multi-Language Speech Assistant
            </span>
          </div>
        </section>

        {/* Authentic Partner Stores Showcase */}
        <PartnerStores />
      </div>
    </div>
  );
};
