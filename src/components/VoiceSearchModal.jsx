import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, MicOff, Volume2, Sparkles, X, CheckCircle2, Radio } from 'lucide-react';

const KANNADA_VOICE_SAMPLES = [
  { text: '2 kilo tomato beku', keyword: 'tomato', qty: 2, label: '🗣️ "2 kilo tomato beku" (ಕನ್ನಡ: 2 ಕೆಜಿ ಟೊಮೆಟೊ)' },
  { text: '1 kg potato beku', keyword: 'potato', qty: 1, label: '🗣️ "1 kg potato beku" (ಆಲೂಗಡ್ಡೆ)' },
  { text: 'Spicy green chilli 500g', keyword: 'green chilli', qty: 1, label: '🗣️ "Spicy green chilli" (ಹಸಿ ಮೆಣಸಿನಕಾಯಿ)' },
  { text: 'Byadgi dry chilli 1 kg', keyword: 'dry red chilli', qty: 1, label: '🗣️ "Byadgi dry chilli 1 kg" (ಬ್ಯಾಡಗಿ ಮೆಣಸು)' }
];

export const VoiceSearchModal = () => {
  const { isVoiceSearchOpen, setIsVoiceSearchOpen, setSearchQuery, navigateTo, addToCart, products = [], showToast } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedItem, setDetectedItem] = useState(null);

  useEffect(() => {
    if (isVoiceSearchOpen) {
      setTranscript('Listening for Kannada / English voice command...');
      setIsListening(true);
    }
  }, [isVoiceSearchOpen]);

  if (!isVoiceSearchOpen) return null;

  const parseAndExecuteVoiceCommand = (text) => {
    setTranscript(text);
    setIsListening(false);

    const lower = text.toLowerCase();
    let foundProduct = null;
    let quantity = 1;

    // Parse quantity
    if (lower.includes('2')) quantity = 2;
    if (lower.includes('3')) quantity = 3;

    // Parse Kannada / English keywords
    if (lower.includes('tomato')) foundProduct = products.find(p => (p.shortName || p.name || '').toLowerCase().includes('tomato'));
    else if (lower.includes('potato') || lower.includes('alugadde')) foundProduct = products.find(p => (p.shortName || p.name || '').toLowerCase().includes('potato'));
    else if (lower.includes('onion') || lower.includes('erulli')) foundProduct = products.find(p => (p.shortName || p.name || '').toLowerCase().includes('onion'));
    else if (lower.includes('chilli') || lower.includes('mensinakayi') || lower.includes('byadgi')) foundProduct = products.find(p => (p.shortName || p.name || '').toLowerCase().includes('chilli'));

    if (foundProduct) {
      setDetectedItem({ product: foundProduct, qty: quantity });
      setTimeout(() => {
        addToCart(foundProduct, quantity);
        setSearchQuery(foundProduct.shortName);
        setIsVoiceSearchOpen(false);
        navigateTo('product-listing');
      }, 1200);
    } else {
      setSearchQuery(text);
      setTimeout(() => {
        setIsVoiceSearchOpen(false);
        navigateTo('product-listing');
      }, 1000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="vs-card animate-modal-pop" style={{
        width: '100%',
        maxWidth: '480px',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: '32px 24px',
        borderRadius: '28px',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        border: '1.5px solid #d1fae5'
      }}>
        <button
          type="button"
          onClick={() => setIsVoiceSearchOpen(false)}
          className="btn-close-modal touch-target-44"
          style={{ 
            position: 'absolute', 
            right: '16px', 
            top: '16px',
            zIndex: 10
          }}
          aria-label="Close Voice Search"
        >
          <X size={20} />
        </button>

        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          backgroundColor: '#ecfdf5', 
          border: '1px solid #a7f3d0',
          color: '#065f46', 
          padding: '5px 14px', 
          borderRadius: '20px', 
          fontSize: '12px', 
          fontWeight: '800', 
          marginBottom: '16px' 
        }}>
          <Sparkles size={14} color="#f59e0b" /> Web Speech API • Rural Voice Engine
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Smart Voice Shopping
        </h3>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px', lineHeight: 1.4 }}>
          Speak in <strong>Kannada, Hindi, or English</strong> to search fresh produce or add directly to cart.
        </p>

        {/* Animated Microphone Icon with Concentric Waves */}
        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 24px auto' }}>
          {isListening && (
            <div style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              animation: 'pulseGlowRing 2s infinite'
            }} />
          )}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: isListening 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
              : '#f1f5f9',
            color: isListening ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isListening ? '0 10px 30px rgba(16, 185, 129, 0.5)' : 'none',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 2
          }}>
            <Mic size={40} />
          </div>
        </div>

        {/* Live Transcript Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          fontSize: '14px',
          fontWeight: '700',
          color: '#1e293b',
          minHeight: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          lineHeight: 1.4
        }}>
          {detectedItem ? (
            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} /> Detected: <strong>{detectedItem.qty} {detectedItem.product.unit} of {detectedItem.product.name}</strong>! Adding...
            </span>
          ) : (
            <span style={{ color: isListening ? '#059669' : '#64748b' }}>{transcript}</span>
          )}
        </div>

        {/* Quick Demo Sample Voice Buttons */}
        <div>
          <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
            Instant Sample Voice Phrases:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {KANNADA_VOICE_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => parseAndExecuteVoiceCommand(sample.text)}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '12px', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
