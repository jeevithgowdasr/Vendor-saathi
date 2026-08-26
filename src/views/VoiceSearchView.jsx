import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Mic, ArrowLeft, X, Sparkles, CheckCircle2, Volume2, Globe } from 'lucide-react';

const RECENT_SEARCHES = ['Tomato (ಟೊಮೆಟೊ)', 'Potato (ಆಲೂಗಡ್ಡೆ)', 'Onion (ಈರುಳ್ಳಿ)', 'Basmati Rice', 'Nandini Milk'];
const POPULAR_SEARCHES = ['Green Chilli (ಹಸಿ ಮೆಣಸು)', 'Carrot', 'Banana', 'Byadgi Dry Chilli', 'Ginger Garlic'];

export const VoiceSearchView = () => {
  const { searchQuery, setSearchQuery, navigateTo, addToCart, products, showToast } = useApp();
  const [query, setQuery] = useState(searchQuery || '');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('Kannada');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      navigateTo('product-listing', { search: query.trim() });
    }
  };

  const handleMicClick = () => {
    setIsListening(true);
    setTranscript('Listening for voice command in Kannada / Hindi / English...');
    setTimeout(() => {
      setIsListening(false);
      setTranscript('2 kilo tomato beku');
      setTimeout(() => {
        const product = (products || []).find(p => p.shortName === 'Tomato') || (products && products[0]);
        if (product) {
          addToCart(product, 2);
        }
        setSearchQuery('Tomato');
        showToast('Voice detected: Added 2 kg Tomato! 🍅');
        navigateTo('product-listing', { search: 'Tomato' });
      }, 1000);
    }, 1500);
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
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
          🗣️ Smart Voice & Instant Search
        </h1>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '4px' }}>
          Speak in your native dialect (Kannada, Hindi, English) to instantly search and add local produce to your cart.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }}>
        {/* Left Column: Text Search & Tag Pills */}
        <div>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search fresh vegetables, fruits, groceries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '14px 44px 14px 46px', 
                  borderRadius: '18px', 
                  border: '1.5px solid #cbd5e1', 
                  fontSize: '15px', 
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  fontWeight: '600'
                }}
              />
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              {query && (
                <button type="button" onClick={() => setQuery('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <X size={18} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '14px 24px', borderRadius: '18px', fontSize: '15px', fontWeight: '800' }}>
              <Search size={18} />
              <span>Search</span>
            </button>
          </form>

          {/* Recent Searches */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent Searches
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {RECENT_SEARCHES.map((tag, idx) => {
                const cleanTag = tag.split(' ')[0];
                return (
                  <button
                    key={idx}
                    onClick={() => { setQuery(cleanTag); setSearchQuery(cleanTag); navigateTo('product-listing', { search: cleanTag }); }}
                    className="tag-pill"
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Searches */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Popular Rural Essentials
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {POPULAR_SEARCHES.map((tag, idx) => {
                const cleanTag = tag.split(' ')[0];
                return (
                  <button
                    key={idx}
                    onClick={() => { setQuery(cleanTag); setSearchQuery(cleanTag); navigateTo('product-listing', { search: cleanTag }); }}
                    className="tag-pill"
                    style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
                  >
                    🌿 {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Central Voice Search Widget */}
        <div className="vs-card" style={{ padding: '40px 32px', borderRadius: '32px', textAlign: 'center', backgroundColor: '#ffffff', border: '1.5px solid #d1fae5' }}>
          <span className="badge badge-success" style={{ marginBottom: '16px', fontSize: '12.5px', padding: '6px 16px' }}>
            <Sparkles size={14} color="#f59e0b" /> Web Speech Recognition Engine
          </span>

          <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Search by Native Voice
          </h3>
          <p style={{ fontSize: '14.5px', color: '#64748b', marginBottom: '28px', minHeight: '44px' }}>
            {transcript || 'Tap the glowing microphone below and speak naturally'}
          </p>

          {/* Glowing Animated Mic */}
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 24px auto' }}>
            {isListening && (
              <div style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                animation: 'pulseGlowRing 2s infinite'
              }} />
            )}
            <div
              onClick={handleMicClick}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45)',
                position: 'relative',
                zIndex: 2,
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Mic size={46} />
            </div>
          </div>

          <p style={{ fontSize: '13.5px', color: '#334155', marginBottom: '18px' }}>
            Try saying: <strong style={{ color: '#059669' }}>"2 kilo tomato beku"</strong> or <strong style={{ color: '#059669' }}>"1 kg fresh potato"</strong>
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
            <Globe size={16} color="#059669" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Kannada">ಕನ್ನಡ (Kannada Voice)</option>
              <option value="Hindi">हिंदी (Hindi Voice)</option>
              <option value="English">English (IN)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
