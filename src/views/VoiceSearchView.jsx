import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Mic, MicOff, ArrowLeft, X, Sparkles, CheckCircle2, Volume2, Globe, AlertCircle } from 'lucide-react';
import { 
  isSpeechRecognitionSupported, 
  createKannadaSpeechRecognition, 
  parseKannadaVoiceInput,
  KANNADA_SAMPLE_COMMANDS 
} from '../utils/kannadaVoiceEngine';
import { playSuccessChime, playPopSound } from '../utils/audio';

// Strictly Produce Categories: Vegetables, Fruits, Greens/Soppu, Flowers
const RECENT_SEARCHES = ['Tomato (ಟೊಮೆಟೊ)', 'Potato (ಆಲೂಗಡ್ಡೆ)', 'Onion (ಈರುಳ್ಳಿ)', 'Palak Soppu (ಪಾಲಕ್)', 'Pooja Flowers (ಮಲ್ಲಿಗೆ)'];
const POPULAR_SEARCHES = ['Green Chilli (ಹಸಿ ಮೆಣಸು)', 'Carrot (ಕ್ಯಾರೆಟ್)', 'Banana (ಬಾಳೆಹಣ್ಣು)', 'Fresh Apple (ಸೇಬು)', 'Coriander (ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು)'];

export const VoiceSearchView = () => {
  const { searchQuery, setSearchQuery, navigateTo, addToCart, products = [], showToast } = useApp();
  const [query, setQuery] = useState(searchQuery || '');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('kn-IN');
  const [detectedItem, setDetectedItem] = useState(null);
  const [speechError, setSpeechError] = useState(null);

  const recognitionRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      navigateTo('product-listing', { search: query.trim() });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleFinalSpeechResult = (spokenText) => {
    stopListening();
    const result = parseKannadaVoiceInput(spokenText, products);

    if (result.matchedProduct) {
      setDetectedItem({ product: result.matchedProduct, qty: result.quantity });
      playSuccessChime();
      showToast(`🎙️ Voice: Added ${result.quantity} ${result.matchedProduct.unit || 'kg'} of ${result.matchedProduct.name} to cart!`, 'success');

      setTimeout(() => {
        addToCart(result.matchedProduct, result.quantity);
        setSearchQuery(result.matchedProduct.shortName || result.matchedProduct.name);
        navigateTo('product-listing');
      }, 1200);
    } else {
      showToast(`🎙️ Searching for "${result.cleanSearchTerm}"`, 'info');
      setSearchQuery(result.cleanSearchTerm);
      setTimeout(() => {
        navigateTo('product-listing', { search: result.cleanSearchTerm });
      }, 900);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      return;
    }

    setSpeechError(null);
    setDetectedItem(null);

    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Speech recognition is not supported in this browser. Please use the quick Kannada sample chips below.');
      return;
    }

    try {
      const rec = createKannadaSpeechRecognition({
        interimResults: true,
        continuous: false,
        onStart: () => {
          setIsListening(true);
          setTranscript('Listening in Kannada (kn-IN)... ಮಾತನಾಡಿ');
        },
        onResult: ({ finalTranscript, interimTranscript }) => {
          const currentText = finalTranscript || interimTranscript;
          if (currentText) {
            setTranscript(currentText);
          }
          if (finalTranscript) {
            handleFinalSpeechResult(finalTranscript);
          }
        },
        onError: (event) => {
          console.warn('SpeechRecognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission denied. Please allow microphone access or tap a sample below.');
          } else if (event.error === 'no-speech') {
            setTranscript('No voice detected. Tap mic to try again.');
          } else {
            setSpeechError('Voice network request note. Tap any sample Kannada command below:');
          }
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      if (rec) {
        rec.lang = language;
        recognitionRef.current = rec;
        rec.start();
      }
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError('Microphone activation note. Try tapping a sample command below:');
    }
  };

  const executeSample = (sample) => {
    playPopSound();
    setTranscript(`${sample.kannada} (${sample.english})`);
    handleFinalSpeechResult(sample.transliteration || sample.kannada);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

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
          border: '1px solid #a7f3d0',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
          🗣️ Kannada Smart Voice & Produce Search
        </h1>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '4px' }}>
          Speak in your native dialect (Kannada 'kn-IN') to instantly search fresh vegetables, fruits, greens, and flowers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Left Column: Text Search & Filtered Produce Tags */}
        <div>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search fresh vegetables, fruits, greens, flowers..."
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
                <button type="button" onClick={() => setQuery('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '14px 24px', borderRadius: '18px', fontSize: '15px', fontWeight: '800' }}>
              <Search size={18} />
              <span>Search</span>
            </button>
          </form>

          {/* Recent Produce Searches */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent Produce Searches
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {RECENT_SEARCHES.map((tag, idx) => {
                const cleanTag = tag.split(' ')[0];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setQuery(cleanTag); setSearchQuery(cleanTag); navigateTo('product-listing', { search: cleanTag }); }}
                    className="tag-pill"
                    style={{ cursor: 'pointer' }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Produce Searches */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Popular Farm Produce
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {POPULAR_SEARCHES.map((tag, idx) => {
                const cleanTag = tag.split(' ')[0];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setQuery(cleanTag); setSearchQuery(cleanTag); navigateTo('product-listing', { search: cleanTag }); }}
                    className="tag-pill"
                    style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', cursor: 'pointer' }}
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
            <Sparkles size={14} color="#f59e0b" /> Web Speech Recognition Engine (kn-IN)
          </span>

          <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Search by Native Voice
          </h3>
          <p style={{ fontSize: '14.5px', color: '#64748b', marginBottom: '24px', minHeight: '44px' }}>
            {detectedItem ? (
              <span style={{ color: '#059669', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} /> Added {detectedItem.qty} {detectedItem.product.unit || 'kg'} of {detectedItem.product.name} to cart!
              </span>
            ) : speechError ? (
              <span style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> {speechError}
              </span>
            ) : (
              transcript || 'Tap the glowing microphone below and speak naturally in Kannada'
            )}
          </p>

          {/* Glowing Animated Mic */}
          <div style={{ position: 'relative', width: '104px', height: '104px', margin: '0 auto 24px auto' }}>
            {isListening && (
              <div style={{
                position: 'absolute',
                inset: '-14px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                animation: 'pulseGlowRing 1.8s infinite'
              }} />
            )}
            <button
              type="button"
              onClick={handleMicClick}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: 'none',
                background: isListening ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
                color: isListening ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isListening ? '0 12px 30px rgba(16, 185, 129, 0.45)' : 'none',
                position: 'relative',
                zIndex: 2,
                transition: 'transform 0.2s ease'
              }}
              title={isListening ? 'Tap to stop listening' : 'Tap to start voice recognition'}
            >
              {isListening ? <Mic size={48} /> : <MicOff size={42} />}
            </button>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
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
              <option value="kn-IN">ಕನ್ನಡ (kn-IN)</option>
              <option value="hi-IN">हिंदी (hi-IN)</option>
              <option value="en-IN">English (en-IN)</option>
            </select>
          </div>

          {/* Quick Click-to-Speak Kannada Samples */}
          <div style={{ textAlign: 'left', marginTop: '10px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              ಕನ್ನಡ ಉದಾಹರಣೆಗಳು (Tap to Try):
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {KANNADA_SAMPLE_COMMANDS.slice(0, 4).map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => executeSample(sample)}
                  className="btn-secondary"
                  style={{
                    fontSize: '12.5px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <span>
                    <strong style={{ color: '#064e3b' }}>🗣️ {sample.kannada}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                      {sample.english}
                    </span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '8px' }}>
                    Try
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
