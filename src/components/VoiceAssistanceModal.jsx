import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';

export const VoiceAssistanceModal = () => {
  const { 
    isVoiceAssistanceOpen, 
    setIsVoiceAssistanceOpen, 
    selectedLanguage, 
    changeLanguage, 
    selectedVoiceFeature, 
    setSelectedVoiceFeature 
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all'); // all | vendor | customer | core
  const [highlightWordIndex, setHighlightWordIndex] = useState(-1);

  const utteranceRef = useRef(null);
  const timerRef = useRef(null);

  const featureKeys = Object.keys(FEATURE_EXPLANATIONS);
  const currentFeature = FEATURE_EXPLANATIONS[selectedVoiceFeature] || FEATURE_EXPLANATIONS['gps-route'];
  const currentLangObj = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];
  const explanationText = currentFeature.explanation[selectedLanguage] || currentFeature.explanation['en'];
  const featureTitle = currentFeature.title[selectedLanguage] || currentFeature.title['en'];

  const audioRef = useRef(null);

  // Clean speech synthesis & timers on cleanup or close
  const stopSpeech = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightWordIndex(-1);
  };

  useEffect(() => {
    if (!isVoiceAssistanceOpen) {
      stopSpeech();
    } else {
      // Auto play explanation when modal opens or feature/language changes
      speakExplanation();
    }

    return () => {
      stopSpeech();
    };
  }, [isVoiceAssistanceOpen, selectedVoiceFeature, selectedLanguage]);

  const speakExplanation = () => {
    stopSpeech();

    const textToSpeak = explanationText;
    if (!textToSpeak) return;

    setIsPlaying(true);
    setIsPaused(false);

    // Simulate word highlight timer for audio wave & visual text syncing
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
    }, 320);

    // Audio playback for Kannada & multilingual TTS
    if (selectedLanguage === 'kn') {
      try {
        // High quality Kannada TTS audio stream (using client=gtx without referrer to prevent 404)
        const cleanQuery = textToSpeak.replace(/[\n\r]+/g, ' ').slice(0, 160).trim();
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanQuery)}&tl=kn&client=gtx`;
        const audio = new Audio();
        audio.referrerPolicy = 'no-referrer';
        audio.setAttribute('referrerpolicy', 'no-referrer');
        audio.src = audioUrl;
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setHighlightWordIndex(-1);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        };

        audio.onerror = () => {
          console.warn("Kannada audio stream error, falling back to Web Speech API");
          fallbackWebSpeech(textToSpeak);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Kannada audio stream play notice:", err);
            fallbackWebSpeech(textToSpeak);
          });
        }
        return;
      } catch (err) {
        console.warn("Kannada audio init exception:", err);
      }
    }

    fallbackWebSpeech(textToSpeak);
  };

  const fallbackWebSpeech = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utteranceRef.current = utterance;

      utterance.lang = currentLangObj.speechLang;
      utterance.rate = 0.88; // clear accessibility rate
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      
      // Strict voice matching: do NOT assign Hindi or English voice to Kannada text
      if (selectedLanguage === 'kn') {
        const knVoice = voices.find(v => 
          v.lang === 'kn-IN' || 
          v.lang.startsWith('kn') || 
          (v.name && v.name.toLowerCase().includes('kannada'))
        );
        if (knVoice) {
          utterance.voice = knVoice;
        }
        // If no explicit Kannada voice, leave utterance.voice unset so Chrome's network TTS synthesizes kn-IN
      } else {
        const matchingVoice = voices.find(v => 
          v.lang === currentLangObj.speechLang || 
          v.lang.startsWith(selectedLanguage) ||
          (v.name && v.name.toLowerCase().includes(currentLangObj.label.toLowerCase()))
        ) || (selectedLanguage === 'hi' ? voices.find(v => v.lang.includes('hi')) : voices.find(v => v.lang.includes('en')));

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setHighlightWordIndex(-1);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      utterance.onerror = (e) => {
        console.warn("Web Speech API notice:", e);
        setIsPlaying(false);
        setIsPaused(false);
        setHighlightWordIndex(-1);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePause = () => {
    if (audioRef.current && isPlaying && !isPaused) {
      audioRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }
    if (window.speechSynthesis && isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleResumeOrPlay = () => {
    if (audioRef.current && isPaused) {
      audioRef.current.play().catch(e => console.warn(e));
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      speakExplanation();
    }
  };

  const handleReplay = () => {
    speakExplanation();
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
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(6px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="vs-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: 'calc(100dvh - 32px)',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#15803d',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              backgroundColor: '#ffffff',
              color: '#15803d',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Mic size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                VendorSaathi Voice Assistance 🎙️
              </h3>
              <span style={{ fontSize: '12px', color: '#bbf7d0', fontWeight: '600' }}>
                Multi-lingual Voice Guide • ಕನ್ನಡ | हिंदी | English
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVoiceAssistanceOpen(false)}
            className="btn-close-modal-light touch-target-44"
            aria-label="Close Voice Assistance"
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Selector Toolbar */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '12px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
            <Globe size={16} color="#16a34a" />
            <span>Select Voice Language:</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {LANGUAGES.map(lang => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: isSelected ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                    color: isSelected ? '#15803d' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeLabel}</span>
                  {isSelected && <CheckCircle2 size={14} color="#16a34a" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Active Selected Feature Explanation Box */}
          <div className="vs-card" style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '36px', lineHeight: 1 }}>{currentFeature.icon}</span>
                <div>
                  <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    {currentFeature.badge}
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 0 0', color: '#ffffff' }}>
                    {featureTitle}
                  </h2>
                </div>
              </div>

              {/* Language Indicator Badge */}
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{currentLangObj.flag}</span>
                <span>{currentLangObj.nativeLabel} Voice</span>
              </div>
            </div>

            {/* Subtitle / Short summary */}
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontWeight: '500' }}>
              {currentFeature.shortDesc[selectedLanguage] || currentFeature.shortDesc['en']}
            </p>

            {/* Display Spoken Explanation Text */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              padding: '16px 20px',
              borderRadius: '14px',
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#f8fafc',
              fontWeight: '600',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <span style={{ color: '#22c55e', marginRight: '6px', fontSize: '18px' }}>🎙️</span>
              "{explanationText}"
            </div>

            {/* Audio Wave & Status Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              
              {/* Playback Controls: Play / Pause / Replay */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isPlaying ? (
                  <button
                    onClick={handlePause}
                    className="btn-primary"
                    style={{
                      backgroundColor: '#f59e0b',
                      color: '#000000',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '800'
                    }}
                  >
                    <Pause size={16} /> Pause Voice
                  </button>
                ) : (
                  <button
                    onClick={handleResumeOrPlay}
                    className="btn-primary"
                    style={{
                      backgroundColor: '#22c55e',
                      color: '#ffffff',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '800'
                    }}
                  >
                    <Play size={16} /> {isPaused ? 'Resume Voice' : 'Listen Voice 🎙️'}
                  </button>
                )}

                <button
                  onClick={handleReplay}
                  className="btn-secondary"
                  style={{
                    backgroundColor: '#334155',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    border: '1px solid #475569'
                  }}
                  title="Replay Voice Explanation"
                >
                  <RotateCcw size={16} /> Replay
                </button>
              </div>

              {/* Dynamic Sound Wave Animation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isPlaying ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                    <span style={{ width: '4px', height: '16px', backgroundColor: '#22c55e', borderRadius: '2px', animation: 'pulse 0.6s infinite alternate' }}></span>
                    <span style={{ width: '4px', height: '24px', backgroundColor: '#22c55e', borderRadius: '2px', animation: 'pulse 0.4s infinite alternate 0.2s' }}></span>
                    <span style={{ width: '4px', height: '12px', backgroundColor: '#22c55e', borderRadius: '2px', animation: 'pulse 0.5s infinite alternate 0.1s' }}></span>
                    <span style={{ width: '4px', height: '20px', backgroundColor: '#22c55e', borderRadius: '2px', animation: 'pulse 0.7s infinite alternate 0.3s' }}></span>
                    <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '700', marginLeft: '6px' }}>
                      Speaking in {currentLangObj.nativeLabel}...
                    </span>
                  </div>
                ) : isPaused ? (
                  <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>
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

          {/* Selectable List of All 15 Major Features */}
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={18} color="#16a34a" /> Explore All Major Features (15):
            </h4>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'vendor', label: 'Vendor Tools' },
                { id: 'customer', label: 'Customer' },
                { id: 'core', label: 'Core System' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: 'none',
                    backgroundColor: categoryFilter === cat.id ? '#16a34a' : '#f1f5f9',
                    color: categoryFilter === cat.id ? '#ffffff' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Grid Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
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
                    padding: '12px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                    border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>{feat.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? '800' : '700',
                      color: isSelected ? '#15803d' : '#0f172a',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {title}
                    </h5>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                      {feat.badge}
                    </span>
                  </div>
                  {isSelected && (
                    <Volume2 size={16} color="#16a34a" />
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer Note */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>💡 Tap any feature above to instantly hear its voice explanation in your language.</span>
          <button
            onClick={() => setIsVoiceAssistanceOpen(false)}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}
          >
            Close Assistant
          </button>
        </div>
      </div>
    </div>
  );
};
