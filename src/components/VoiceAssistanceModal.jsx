import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES, FEATURE_EXPLANATIONS } from '../data/featureExplanations';
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  Layers,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  FastForward,
  Compass
} from 'lucide-react';

const TOUR_SEQUENCE = [
  'website-overview',
  'how-to-order',
  'categories',
  'nearby-vendors',
  'voice-search-guide',
  'payments',
  'order-tracking',
  'vendor-portal-guide',
  'language-translation-guide',
  'weather'
];

export const VoiceAssistanceModal = () => {
  const { 
    isVoiceAssistanceOpen, 
    setIsVoiceAssistanceOpen, 
    selectedLanguage, 
    changeLanguage, 
    selectedVoiceFeature, 
    setSelectedVoiceFeature,
    t
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTourMode, setIsTourMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all'); // all | vendor | customer | core
  const [highlightWordIndex, setHighlightWordIndex] = useState(-1);
  const [availableVoices, setAvailableVoices] = useState([]);

  const timerRef = useRef(null);
  const tourActiveRef = useRef(false);

  const featureKeys = Object.keys(FEATURE_EXPLANATIONS);
  const currentFeature = FEATURE_EXPLANATIONS[selectedVoiceFeature] || FEATURE_EXPLANATIONS['website-overview'] || FEATURE_EXPLANATIONS['gps-route'];
  const currentLangObj = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];
  const explanationText = currentFeature.explanation[selectedLanguage] || currentFeature.explanation['en'];
  const featureTitle = currentFeature.title[selectedLanguage] || currentFeature.title['en'];

  // Initialize and load system voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop active speech and reset animation
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightWordIndex(-1);
  }, []);

  // Speech Synthesis Execution
  const speakText = useCallback((textToSpeak, onEndCallback = null) => {
    stopSpeech();
    if (!textToSpeak || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    setIsPlaying(true);
    setIsPaused(false);

    // Visual word-highlight progression
    const words = textToSpeak.split(' ');
    let currentIdx = 0;
    timerRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx < words.length) {
        setHighlightWordIndex(currentIdx);
      } else {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 280);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = currentLangObj.speechLang;
    utterance.rate = selectedLanguage === 'kn' ? 0.85 : 0.90; // Natural, clear pacing
    utterance.pitch = 1.0;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

    if (selectedLanguage === 'kn') {
      const knVoice = voices.find(v => 
        v.lang === 'kn-IN' || 
        v.lang.startsWith('kn') || 
        (v.name && v.name.toLowerCase().includes('kannada'))
      );
      if (knVoice) utterance.voice = knVoice;
    } else if (selectedLanguage === 'hi') {
      const hiVoice = voices.find(v => 
        v.lang === 'hi-IN' || 
        v.lang.startsWith('hi') || 
        (v.name && v.name.toLowerCase().includes('hindi'))
      );
      if (hiVoice) utterance.voice = hiVoice;
    } else {
      const enVoice = voices.find(v => 
        v.lang === 'en-IN' || 
        v.lang === 'en-US' || 
        v.lang.startsWith('en')
      );
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setHighlightWordIndex(-1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (typeof onEndCallback === 'function') {
        onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis notice:", e);
      setIsPlaying(false);
      setIsPaused(false);
      setHighlightWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  }, [availableVoices, currentLangObj.speechLang, selectedLanguage, stopSpeech]);

  // Advance to next tour feature
  const advanceTour = useCallback(() => {
    if (!tourActiveRef.current) return;
    const currentIndex = TOUR_SEQUENCE.indexOf(selectedVoiceFeature);
    const nextIndex = currentIndex + 1;

    if (nextIndex < TOUR_SEQUENCE.length) {
      const nextKey = TOUR_SEQUENCE[nextIndex];
      setSelectedVoiceFeature(nextKey);
    } else {
      setIsTourMode(false);
      tourActiveRef.current = false;
    }
  }, [selectedVoiceFeature, setSelectedVoiceFeature]);

  // Speak currently selected feature
  const speakCurrentFeature = useCallback(() => {
    const text = explanationText;
    speakText(text, () => {
      if (tourActiveRef.current) {
        setTimeout(() => {
          advanceTour();
        }, 800);
      }
    });
  }, [explanationText, speakText, advanceTour]);

  // Auto-play when modal opens or feature/language changes
  useEffect(() => {
    if (!isVoiceAssistanceOpen) {
      stopSpeech();
      setIsTourMode(false);
      tourActiveRef.current = false;
    } else {
      speakCurrentFeature();
    }

    return () => {
      stopSpeech();
    };
  }, [isVoiceAssistanceOpen, selectedVoiceFeature, selectedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tour mode toggle
  const startFullTour = () => {
    setIsTourMode(true);
    tourActiveRef.current = true;
    setSelectedVoiceFeature('website-overview');
  };

  const handlePause = () => {
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      speakCurrentFeature();
    }
  };

  const handleReplay = () => {
    speakCurrentFeature();
  };

  const handleNextFeature = () => {
    const currentIndex = TOUR_SEQUENCE.indexOf(selectedVoiceFeature);
    if (currentIndex >= 0 && currentIndex < TOUR_SEQUENCE.length - 1) {
      setSelectedVoiceFeature(TOUR_SEQUENCE[currentIndex + 1]);
    } else {
      const allIndex = featureKeys.indexOf(selectedVoiceFeature);
      const nextIndex = (allIndex + 1) % featureKeys.length;
      setSelectedVoiceFeature(featureKeys[nextIndex]);
    }
  };

  const handlePrevFeature = () => {
    const currentIndex = TOUR_SEQUENCE.indexOf(selectedVoiceFeature);
    if (currentIndex > 0) {
      setSelectedVoiceFeature(TOUR_SEQUENCE[currentIndex - 1]);
    } else {
      const allIndex = featureKeys.indexOf(selectedVoiceFeature);
      const prevIndex = (allIndex - 1 + featureKeys.length) % featureKeys.length;
      setSelectedVoiceFeature(featureKeys[prevIndex]);
    }
  };

  if (!isVoiceAssistanceOpen) return null;

  const filteredFeatures = featureKeys.filter(key => {
    if (categoryFilter === 'all') return true;
    return FEATURE_EXPLANATIONS[key].category === categoryFilter;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="vs-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: 'calc(100dvh - 32px)',
        backgroundColor: '#ffffff',
        borderRadius: '26px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        border: '1.5px solid #bfdbfe'
      }}>
        {/* Header with Cool Ocean Gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
          color: '#ffffff',
          padding: '16px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              backgroundColor: '#ffffff',
              color: '#2563eb',
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              flexShrink: 0
            }}>
              <Mic size={22} color="#2563eb" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, lineHeight: 1.2, color: '#ffffff' }}>
                  {t('voiceAssistantModal.title', 'Smart Voice Assistance')}
                </h3>
                <span style={{
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                  fontSize: '10px',
                  fontWeight: '900',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  letterSpacing: '0.5px'
                }}>
                  LIVE AUDIO
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#bfdbfe', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                {t('voiceAssistantModal.subtitle', 'Complete voice explanation and interactive guide for every feature of VendorSaathi')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setIsVoiceAssistanceOpen(false);
            }}
            className="btn-close-modal-light touch-target-44"
            aria-label="Close Voice Assistance"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Selector & Tour Toolbar */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '12px 22px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Language Switcher Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
              <Globe size={15} color="#2563eb" />
              <span>Language:</span>
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              {LANGUAGES.map(lang => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      changeLanguage(lang.code);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '18px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.15)' : 'none'
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.nativeLabel}</span>
                    {isSelected && <CheckCircle2 size={13} color="#2563eb" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Guided Website Tour Button */}
          <button
            type="button"
            onClick={startFullTour}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '800',
              border: isTourMode ? '1.5px solid #2563eb' : '1px solid #bfdbfe',
              background: isTourMode ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#ffffff',
              color: '#2563eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)'
            }}
          >
            <Compass size={15} color="#2563eb" className={isTourMode ? 'spin' : ''} />
            <span>{isTourMode ? 'Tour Active (Auto-Advancing)' : t('voiceAssistantModal.playTour', '▶️ Play Full Website Tour')}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
          
          {/* Main Active Feature Voice Audio Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: '22px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.35)',
            border: '1.5px solid #334155',
            position: 'relative'
          }}>
            {/* Feature Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '32px',
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  {currentFeature.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      backgroundColor: 'rgba(56, 189, 248, 0.2)', 
                      color: '#38bdf8', 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      padding: '2px 8px', 
                      borderRadius: '8px', 
                      textTransform: 'uppercase',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      {currentFeature.badge}
                    </span>
                    {isTourMode && (
                      <span style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '10.5px', fontWeight: '800', padding: '2px 7px', borderRadius: '8px' }}>
                        Step {TOUR_SEQUENCE.indexOf(selectedVoiceFeature) + 1} of {TOUR_SEQUENCE.length}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '4px 0 0 0', color: '#ffffff' }}>
                    {featureTitle}
                  </h2>
                </div>
              </div>

              {/* Language Indicator Badge */}
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.08)', 
                border: '1px solid rgba(255,255,255,0.18)', 
                padding: '5px 12px', 
                borderRadius: '16px', 
                fontSize: '12px', 
                fontWeight: '800', 
                color: '#38bdf8', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}>
                <span>{currentLangObj.flag}</span>
                <span>{currentLangObj.nativeLabel} Voice Audio</span>
              </div>
            </div>

            {/* Subtitle / Short summary */}
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontWeight: '500' }}>
              {currentFeature.shortDesc[selectedLanguage] || currentFeature.shortDesc['en']}
            </p>

            {/* Display Spoken Explanation Text with Word Highlighting */}
            <div style={{
              backgroundColor: '#090d16',
              border: '1.5px solid #1e293b',
              padding: '18px 22px',
              borderRadius: '16px',
              fontSize: '15.5px',
              lineHeight: '1.65',
              color: '#f8fafc',
              fontWeight: '600',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <span style={{ color: '#38bdf8', marginRight: '8px', fontSize: '18px' }}>🎙️</span>
              {explanationText.split(' ').map((word, idx) => (
                <span
                  key={idx}
                  style={{
                    color: highlightWordIndex === idx ? '#38bdf8' : '#f8fafc',
                    backgroundColor: highlightWordIndex === idx ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                    borderRadius: '4px',
                    padding: '0 2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {word}{' '}
                </span>
              ))}
            </div>

            {/* Audio Wave & Controls Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              
              {/* Playback Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isPlaying ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '14px',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                    }}
                  >
                    <Pause size={16} /> {t('voiceAssistantModal.pause', 'Pause Voice')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResume}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 22px',
                      borderRadius: '14px',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
                    }}
                  >
                    <Play size={16} /> {isPaused ? t('voiceAssistantModal.resume', 'Resume Voice') : 'Listen Voice 🎙️'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReplay}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Replay from start"
                >
                  <RotateCcw size={15} /> Replay
                </button>

                {/* Step Navigation for Tour */}
                <div style={{ display: 'flex', gap: '6px', marginLeft: '6px' }}>
                  <button
                    type="button"
                    onClick={handlePrevFeature}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Previous feature"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFeature}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Next feature"
                  >
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Dynamic Equalizer Wave Animation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isPlaying ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '26px' }}>
                    <span className="equalizer-bar eq-1" style={{ width: '4px' }}></span>
                    <span className="equalizer-bar eq-2" style={{ width: '4px' }}></span>
                    <span className="equalizer-bar eq-3" style={{ width: '4px' }}></span>
                    <span className="equalizer-bar eq-4" style={{ width: '4px' }}></span>
                    <span className="equalizer-bar eq-5" style={{ width: '4px' }}></span>
                    <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800', marginLeft: '8px' }}>
                      {t('voiceAssistantModal.playingNow', 'Speaking in')} {currentLangObj.nativeLabel}...
                    </span>
                  </div>
                ) : isPaused ? (
                  <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '800' }}>
                    ⏸️ Voice Paused
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                    Tap Play to listen anytime
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section Heading & Category Filters */}
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={17} color="#2563eb" />
              <span>{t('voiceAssistantModal.listenPrompt', 'Select any topic to hear details:')}</span>
            </h4>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: t('voiceAssistantModal.allFeatures', 'All') },
                { id: 'core', label: t('voiceAssistantModal.coreFeatures', 'Core System') },
                { id: 'customer', label: t('voiceAssistantModal.customerFeatures', 'Customer') },
                { id: 'vendor', label: t('voiceAssistantModal.vendorFeatures', 'Vendor Portal') }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '14px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    border: categoryFilter === cat.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: categoryFilter === cat.id ? '#eff6ff' : '#ffffff',
                    color: categoryFilter === cat.id ? '#2563eb' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Grid Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {filteredFeatures.map(key => {
              const feat = FEATURE_EXPLANATIONS[key];
              const isSelected = selectedVoiceFeature === key;
              const title = feat.title[selectedLanguage] || feat.title['en'];

              return (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedVoiceFeature(key);
                  }}
                  className="vs-card"
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 6px 18px rgba(37, 99, 235, 0.18)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
                    transform: isSelected ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '24px', lineHeight: 1 }}>{feat.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: '800',
                        backgroundColor: isSelected ? '#bfdbfe' : '#f1f5f9',
                        color: isSelected ? '#1e40af' : '#64748b',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {feat.badge}
                      </span>
                      <strong style={{
                        fontSize: '13px',
                        color: isSelected ? '#1e40af' : '#0f172a',
                        display: 'block',
                        lineHeight: 1.25,
                        marginTop: '3px'
                      }}>
                        {title}
                      </strong>
                    </div>
                  </div>

                  <p style={{
                    fontSize: '11px',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {feat.shortDesc[selectedLanguage] || feat.shortDesc['en']}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: isSelected ? '#2563eb' : '#94a3b8'
                  }}>
                    <Volume2 size={13} color={isSelected ? '#2563eb' : '#94a3b8'} />
                    <span>{isSelected && isPlaying ? 'Playing Audio' : 'Click to Hear'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Guide Help Notice */}
          <div style={{
            marginTop: '20px',
            backgroundColor: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '16px',
            padding: '12px 18px',
            fontSize: '12.5px',
            color: '#1e40af',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} color="#2563eb" flexShrink={0} />
            <span>💡 Tap any feature above or select a language to instantly hear its voice explanation. Works in Kannada, Hindi, and English!</span>
          </div>

        </div>
      </div>
    </div>
  );
};
