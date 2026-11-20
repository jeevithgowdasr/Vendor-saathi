import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  MapPin, 
  Search, 
  User, 
  Heart, 
  Bell, 
  Smartphone, 
  ChevronDown, 
  Menu,
  X,
  Package,
  Mic,
  Sparkles,
  Globe,
  Store,
  Tag,
  HelpCircle,
  LogOut,
  CheckCircle2,
  Radio,
  Layers,
  Volume2,
  Check,
  ShieldCheck
} from 'lucide-react';
import { playPopSound } from '../utils/audio';

export const Navbar = () => {
  const { 
    currentView, 
    navigateTo, 
    searchQuery, 
    setSearchQuery, 
    currentLocation, 
    user, 
    cart, 
    wishlist, 
    notifications,
    setIsLocationModalOpen,
    setIsAuthModalOpen,
    setAuthModalInitialTab,
    setIsCartDrawerOpen,
    setIsVendorSimOpen,
    setIsVoiceSearchOpen,
    selectedLanguage,
    changeLanguage,
    t,
    isVoiceAssistanceOpen,
    setIsVoiceAssistanceOpen,
    openVoiceAssistanceForFeature,
    secureLogout,
    updateUserProfile,
    showToast
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('product-listing', { search: searchQuery.trim() });
    }
  };

  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)'
    }}>
      {/* Top Banner Announcement & Live Voice Guide Button */}
      <div style={{ 
        background: 'linear-gradient(90deg, #0f172a 0%, #1d4ed8 50%, #1e40af 100%)', 
        color: '#ffffff', 
        fontSize: '12.5px', 
        padding: '7px 16px', 
        fontWeight: '600'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              background: 'rgba(255,255,255,0.18)', 
              padding: '2px 8px', 
              borderRadius: '20px',
              fontSize: '11px',
              letterSpacing: '0.3px',
              fontWeight: '800'
            }}>
              ⚡ EXPRESS
            </span>
            <span style={{ fontSize: '12px' }}>
              {t('nav.expressBanner')} <strong>{currentLocation?.village || currentLocation?.name?.split(',')[0] || user?.village || 'Your Locality'}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quick Language Switcher Pills in Top Announcement Bar */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              borderRadius: '20px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.22)'
            }}>
              {[
                { code: 'en', label: 'EN' },
                { code: 'kn', label: 'ಕನ್ನಡ' },
                { code: 'hi', label: 'हिंदी' }
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(item.code);
                    playPopSound();
                    showToast(`🌐 Language set to ${item.label}`);
                  }}
                  style={{
                    border: 'none',
                    backgroundColor: selectedLanguage === item.code ? '#ffffff' : 'transparent',
                    color: selectedLanguage === item.code ? '#1d4ed8' : '#ffffff',
                    fontWeight: selectedLanguage === item.code ? '900' : '600',
                    fontSize: '11px',
                    padding: '2px 9px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Switch language to ${item.label}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Prominent Voice Assistance Action at Top of Nav Bar */}
            <button
              type="button"
              onClick={() => openVoiceAssistanceForFeature('website-overview')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                border: '1.5px solid rgba(56, 189, 248, 0.5)',
                color: '#ffffff',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title="Hear a spoken explanation of all features and details on this website"
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 0 0 rgba(56, 189, 248, 0.8)',
                animation: 'pulseGlowRing 1.8s infinite'
              }} />
              <Volume2 size={14} color="#38bdf8" />
              <span>{t('nav.voiceGuide')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar Header */}
      <div className="container" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* Brand Logo & Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            onClick={() => navigateTo('home')} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
          >
            <img 
              src="/logo.jpg" 
              alt="VendorSaathi Logo" 
              style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                border: '2px solid #2563eb',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
            <div>
              <span style={{ 
                fontFamily: 'var(--font-heading)',
                fontSize: '22px', 
                fontWeight: '900', 
                color: '#0f172a', 
                letterSpacing: '-0.5px', 
                lineHeight: 1 
              }}>
                Vendor<span style={{ color: '#f59e0b' }}>Saathi</span>
              </span>
              <span style={{ display: 'block', fontSize: '9.5px', color: '#2563eb', fontWeight: '800', letterSpacing: '0.6px', marginTop: '2px' }}>
                {t('nav.logoSubtitle')}
              </span>
            </div>
          </div>

          {/* Location Selector Pill */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              padding: '6px 14px',
              borderRadius: '24px',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#1e40af',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#38bdf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MapPin size={15} color="#2563eb" />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                animation: 'pulseGlowRing 2s infinite'
              }}></span>
            </div>
            <span style={{ maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentLocation?.village ? `${currentLocation.village}, ${currentLocation.town}` : (currentLocation?.name || '📍 Select Location')}
            </span>
            <ChevronDown size={13} color="#2563eb" />
          </button>

          {/* Dedicated Multi-Language Button & Menu */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(prev => !prev)}
              aria-label="Change Website Language"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                backgroundColor: '#ffffff', 
                border: '1.5px solid #2563eb', 
                padding: '6px 14px', 
                borderRadius: '20px',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#1e40af',
                fontWeight: '800',
                fontSize: '12.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Globe size={15} color="#2563eb" />
              <span>
                {selectedLanguage === 'kn' ? 'ಕನ್ನಡ (KN)' : selectedLanguage === 'hi' ? 'हिंदी (HI)' : 'English (EN)'}
              </span>
              <ChevronDown size={13} color="#2563eb" style={{ transform: isLangMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Language Switch Dropdown Modal / Popover */}
            {isLangMenuOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
                  padding: '6px',
                  minWidth: '190px',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {[
                  { code: 'en', native: 'English', label: 'English', flag: '🇬🇧' },
                  { code: 'kn', native: 'ಕನ್ನಡ', label: 'Kannada', flag: '🇮🇳' },
                  { code: 'hi', native: 'हिंदी', label: 'Hindi', flag: '🇮🇳' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsLangMenuOpen(false);
                      playPopSound();
                      showToast(`🌐 Language converted to ${lang.native} (${lang.label})!`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: selectedLanguage === lang.code ? '#eff6ff' : 'transparent',
                      color: selectedLanguage === lang.code ? '#1d4ed8' : '#334155',
                      fontWeight: selectedLanguage === lang.code ? '800' : '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedLanguage !== lang.code) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedLanguage !== lang.code) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>{lang.flag}</span>
                      <div>
                        <span style={{ display: 'block', lineHeight: 1.2 }}>{lang.native}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{lang.label}</span>
                      </div>
                    </div>
                    {selectedLanguage === lang.code && <Check size={16} color="#1d4ed8" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Search Bar with Voice Button */}
        <div style={{ flex: '1', maxWidth: '540px', position: 'relative' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '24px',
              border: searchFocused ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
              padding: '2px 6px 2px 14px',
              boxShadow: searchFocused ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}>
              <Search size={17} color={searchFocused ? '#2563eb' : '#94a3b8'} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={t('nav.searchPlaceholder')}
                style={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: '9px 10px',
                  fontSize: '13px',
                  outline: 'none',
                  color: '#0f172a',
                  fontWeight: '600'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ color: '#94a3b8', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              )}

              {/* Voice Search Mic Button */}
              <button
                type="button"
                onClick={() => setIsVoiceSearchOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  padding: '6px 10px',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Search using Voice (Kannada / English / Hindi)"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Mic size={14} />
                <span>{t('nav.voiceSearch')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Prominent Smart AI Voice Assistant with Active Listening Animation */}
          <button
            type="button"
            onClick={() => setIsVoiceAssistanceOpen(prev => !prev)}
            className={isVoiceAssistanceOpen ? 'animate-pulse text-indigo-600' : ''}
            style={{
              background: isVoiceAssistanceOpen ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: isVoiceAssistanceOpen ? '1.5px solid #6366f1' : '1.5px solid #334155',
              cursor: 'pointer',
              boxShadow: isVoiceAssistanceOpen ? '0 0 0 3px rgba(99, 102, 241, 0.35)' : '0 4px 14px rgba(15, 23, 42, 0.22)',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            title="Voice Assistant (English, Kannada, Hindi)"
            aria-label="Activate Voice Assistant"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.35)';
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isVoiceAssistanceOpen ? '0 0 0 3px rgba(99, 102, 241, 0.35)' : '0 4px 14px rgba(15, 23, 42, 0.22)';
              e.currentTarget.style.borderColor = isVoiceAssistanceOpen ? '#6366f1' : '#334155';
            }}
          >
            {/* Active Listening Pulse Ring Indicator */}
            <span style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px'
            }}>
              <span className={isVoiceAssistanceOpen ? 'animate-pulse text-indigo-600' : ''} style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: isVoiceAssistanceOpen ? '#818cf8' : '#38bdf8',
                opacity: 0.6,
                animation: 'pulseGlowRing 1.8s infinite'
              }} />
              <Mic size={14} color={isVoiceAssistanceOpen ? '#a5b4fc' : '#38bdf8'} style={{ position: 'relative', zIndex: 1 }} />
            </span>
            <span>{t('nav.voiceAssistant')}</span>
          </button>

          {/* Admin Panel Direct Button (for Admin role) */}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigateTo('admin-panel')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '16px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
              }}
            >
              <ShieldCheck size={14} color="#38bdf8" />
              <span>{t('nav.adminConsole')}</span>
            </button>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => navigateTo('wishlist')}
            className="btn-icon-44 touch-target-44"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              color: wishlist.length > 0 ? '#ef4444' : '#475569',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px'
            }}
            aria-label={`Wishlist, ${wishlist.length} items`}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          >
            <Heart size={20} fill={wishlist.length > 0 ? '#ef4444' : 'none'} />
            {wishlist.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '800',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Notification Button & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="btn-icon-44 touch-target-44"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: '#475569',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px'
              }}
              aria-label={`Notifications, ${unreadNotifs} unread`}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              <Bell size={20} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '800',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadNotifs}
                </span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <div 
                className="animate-fade-scale"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '320px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.15)',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  zIndex: 200
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{t('nav.notifications')}</strong>
                  <button 
                    onClick={() => { setIsNotifDropdownOpen(false); navigateTo('notifications'); }}
                    style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {t('nav.viewAll')}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {notifications.slice(0, 3).map((n) => (
                    <div key={n.id} style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '12px' }}>
                      <p style={{ color: '#1e293b', fontWeight: '600', margin: 0 }}>{n.title}</p>
                      <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', display: 'block' }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart Button with Animated Bounce Badge */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #2563eb 100%)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '800',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)';
            }}
          >
            <ShoppingBag size={18} />
            <span>{t('nav.cart')}</span>
            {cartItemCount > 0 && (
              <span style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '1px 7px',
                fontSize: '11.5px',
                fontWeight: '900',
                animation: 'numberPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Explicit Persistent Entry Points when Not Logged In */}
          {!user?.isLoggedIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Vendor Portal Entry Point */}
              <button
                type="button"
                onClick={() => navigateTo('login', { role: 'vendor', mode: 'signin' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '16px',
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  border: '1.5px solid #fde68a',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.12)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef3c7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fffbeb'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Store size={14} color="#d97706" />
                <span>Vendor Login / Register</span>
              </button>

              {/* Customer Login / Register Entry Point */}
              <button
                type="button"
                onClick={() => navigateTo('login', { role: 'customer', mode: 'signin' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '16px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1.5px solid #bfdbfe',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <User size={14} color="#2563eb" />
                <span>{t('nav.customerLogin')}</span>
              </button>
            </div>
          )}

          {/* Quick Access Action when Logged In as Vendor */}
          {/* Always accessible Vendor Portal / Mode Switcher */}
          <button
            type="button"
            onClick={() => {
              if (user?.isLoggedIn) {
                if (user.role !== 'vendor') {
                  if (typeof updateUserProfile === 'function') {
                    updateUserProfile({
                      ...user,
                      role: 'vendor',
                      businessName: user.businessName || user.name || 'Local Vendor Partner Store',
                      vendorCategory: user.vendorCategory || 'Vegetables'
                    });
                  }
                  if (typeof showToast === 'function') {
                    showToast('🏪 Switched to Vendor Partner Mode! Welcome.', 'success');
                  }
                }
                navigateTo('vendor-portal');
              } else {
                navigateTo('login', { role: 'vendor', mode: 'signin' });
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '16px',
              background: user?.role === 'vendor' 
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Store size={14} color="#ffffff" />
            <span>{user?.role === 'vendor' ? t('nav.vendorPortal') : `🏪 ${t('nav.vendorPortal')}`}</span>
          </button>

          {/* Google Profile Button & Dropdown Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                if (user?.isLoggedIn) {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                } else {
                  navigateTo('login', { role: 'customer', mode: 'signin' });
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                border: user?.isLoggedIn ? '1.5px solid #cbd5e1' : '1.5px solid #e2e8f0',
                padding: user?.isLoggedIn ? '5px 12px 5px 6px' : '7px 12px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: user?.isLoggedIn ? '0 2px 6px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {user?.isLoggedIn && user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.name || 'User'} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : user?.isLoggedIn ? (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '800'
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontWeight: '800' }}>
                  {user?.isLoggedIn ? (user.name ? user.name.split(' ')[0] : 'Account') : 'Sign In with Google'}
                </span>
                {user?.isLoggedIn && (
                  <span style={{ fontSize: '9px', color: user.role === 'admin' ? '#0f172a' : user.role === 'vendor' ? '#2563eb' : '#2563eb', fontWeight: '800' }}>
                    {user.role === 'admin' ? '🛡️ Admin' : user.role === 'vendor' ? '🏪 Vendor' : '🌾 Verified'}
                  </span>
                )}
              </div>
              <ChevronDown size={12} color="#64748b" />
            </button>

            {isProfileMenuOpen && user?.isLoggedIn && (
              <div 
                className="animate-fade-scale"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  width: '260px',
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  boxShadow: '0 20px 40px -4px rgba(15, 23, 42, 0.18)',
                  border: '1px solid #e2e8f0',
                  padding: '10px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {/* User Quick Info */}
                <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{user.name}</strong>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe'
                    }}>
                      {user.role === 'vendor' ? t('nav.roleVendor') : t('nav.roleCustomer')}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{user.email}</span>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    📍 {user.village || currentLocation?.village || currentLocation?.name?.split(',')[0] || 'Local Area'}
                  </span>
                </div>

                {/* Switch / Login with Google button in dropdown */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setAuthModalInitialTab('google');
                    setIsAuthModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#1f2937',
                    fontWeight: '800',
                    textAlign: 'left',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{t('nav.switchGoogle')}</span>
                </button>

                {/* Role-Specific Shortcuts & Role Switcher */}
                {user.role === 'admin' ? (
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); navigateTo('admin-panel'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: '#0f172a', fontWeight: '800', textAlign: 'left', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  >
                    <ShieldCheck size={16} color="#2563eb" /> {t('nav.adminConsole')}
                  </button>
                ) : user.role === 'vendor' ? (
                  <>
                    <button
                      onClick={() => { setIsProfileMenuOpen(false); navigateTo('vendor-portal'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: '#1e40af', fontWeight: '800', textAlign: 'left', border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    >
                      <Store size={16} color="#2563eb" /> {t('nav.vendorPortal')}
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (typeof updateUserProfile === 'function') {
                          updateUserProfile({ ...user, role: 'customer' });
                        }
                        if (typeof showToast === 'function') {
                          showToast('🛒 Switched to Customer Shopping Mode!', 'success');
                        }
                        navigateTo('home');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: '#1d4ed8', fontWeight: '700', textAlign: 'left', border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    >
                      <ShoppingBag size={16} color="#2563eb" /> {t('nav.switchToCustomer')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (typeof updateUserProfile === 'function') {
                          updateUserProfile({
                            ...user,
                            role: 'vendor',
                            businessName: user.businessName || user.name || 'Local Vendor Partner Store',
                            vendorCategory: user.vendorCategory || 'Vegetables'
                          });
                        }
                        if (typeof showToast === 'function') {
                          showToast('🏪 Switched to Vendor Partner Mode! Welcome.', 'success');
                        }
                        navigateTo('vendor-portal');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: '#1e40af', fontWeight: '800', textAlign: 'left', border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    >
                      <Store size={16} color="#2563eb" /> {t('nav.switchToVendor')}
                    </button>
                    <button
                      onClick={() => { setIsProfileMenuOpen(false); navigateTo('my-orders'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: '#334155', fontWeight: '700', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Package size={16} color="#2563eb" /> {t('nav.myOrders')}
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setIsProfileMenuOpen(false); navigateTo('profile'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: '#334155', fontWeight: '700', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={16} color="#2563eb" /> {t('nav.myAccount')}
                </button>

                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    secureLogout();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: '#ef4444', fontWeight: '700', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} /> {t('nav.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
