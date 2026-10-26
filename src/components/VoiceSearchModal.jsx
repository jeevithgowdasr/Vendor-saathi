import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, MicOff, Sparkles, X, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import { 
  isSpeechRecognitionSupported, 
  createKannadaSpeechRecognition, 
  parseKannadaVoiceInput,
  KANNADA_SAMPLE_COMMANDS 
} from '../utils/kannadaVoiceEngine';
import { playSuccessChime, playPopSound } from '../utils/audio';

export const VoiceSearchModal = () => {
  const { 
    isVoiceSearchOpen, 
    setIsVoiceSearchOpen, 
    setSearchQuery, 
    navigateTo, 
    addToCart, 
    products = [], 
    showToast 
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedItem, setDetectedItem] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);

  const startListening = () => {
    setSpeechError(null);
    setDetectedItem(null);

    if (!isSpeechRecognitionSupported()) {
      setIsSupported(false);
      setTranscript('Speech recognition is not supported in this browser. Tap any Kannada phrase below to execute!');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

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
            setTranscript('No voice detected. Tap mic to try again or tap sample chips below.');
          } else {
            setSpeechError('Voice network request notice. Tap any sample Kannada command below:');
          }
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      setSpeechError('Microphone activation notice. Try tapping a sample command below:');
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
        setIsVoiceSearchOpen(false);
        navigateTo('product-listing');
      }, 1300);
    } else {
      showToast(`🎙️ Searching for "${result.cleanSearchTerm}"`, 'info');
      setSearchQuery(result.cleanSearchTerm);
      setTimeout(() => {
        setIsVoiceSearchOpen(false);
        navigateTo('product-listing', { search: result.cleanSearchTerm });
      }, 1000);
    }
  };

  const executeSampleCommand = (sample) => {
    playPopSound();
    setTranscript(`${sample.kannada} (${sample.english})`);
    handleFinalSpeechResult(sample.transliteration || sample.kannada);
  };

  useEffect(() => {
    if (isVoiceSearchOpen) {
      setIsSupported(isSpeechRecognitionSupported());
      startListening();
    } else {
      stopListening();
      setDetectedItem(null);
      setTranscript('');
      setSpeechError(null);
    }

    return () => {
      stopListening();
    };
  }, [isVoiceSearchOpen]);

  if (!isVoiceSearchOpen) return null;

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
        maxWidth: '500px',
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
          <Sparkles size={14} color="#f59e0b" /> Web Speech API • ಕನ್ನಡ ಧ್ವನಿ ಹುಡುಕಾಟ (kn-IN)
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Kannada Voice Shopping Assistant
        </h3>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '22px', lineHeight: 1.4 }}>
          Speak naturally in <strong>ಕನ್ನಡ (Kannada)</strong> to search farm produce or add items directly to your cart.
        </p>

        {/* Animated Glowing Microphone Icon */}
        <div style={{ position: 'relative', width: '92px', height: '92px', margin: '0 auto 22px auto' }}>
          {isListening && (
            <div style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.25)',
              animation: 'pulseGlowRing 1.8s infinite'
            }} />
          )}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: 'none',
              background: isListening 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : '#f1f5f9',
              color: isListening ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening ? '0 10px 30px rgba(16, 185, 129, 0.5)' : 'none',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2
            }}
            title={isListening ? 'Tap to stop listening' : 'Tap to start Kannada voice recognition'}
          >
            {isListening ? <Mic size={42} /> : <MicOff size={38} />}
          </button>
        </div>

        {/* Live Transcript / Detection Status Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          fontSize: '14px',
          fontWeight: '700',
          color: '#1e293b',
          minHeight: '54px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          lineHeight: 1.4
        }}>
          {detectedItem ? (
            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} /> Detected: <strong>{detectedItem.qty} {detectedItem.product.unit || 'kg'} {detectedItem.product.name}</strong>! Adding...
            </span>
          ) : speechError ? (
            <span style={{ color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} /> {speechError}
            </span>
          ) : (
            <span style={{ color: isListening ? '#059669' : '#64748b' }}>
              {transcript || (isListening ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇವೆ... (Listening)' : 'ಮೈಕ್ ಒತ್ತಿ ಮತ್ತು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ (Tap mic to speak)')}
            </span>
          )}
        </div>

        {/* Instant Native Kannada Sample Voice Commands */}
        <div>
          <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
            ಕನ್ನಡ ಉದಾಹರಣೆಗಳು (Tap to Try Command):
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {KANNADA_SAMPLE_COMMANDS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => executeSampleCommand(sample)}
                className="btn-secondary"
                style={{ 
                  fontSize: '13px', 
                  padding: '10px 14px', 
                  borderRadius: '14px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  textAlign: 'left',
                  border: '1px solid #e2e8f0'
                }}
              >
                <span>
                  <strong style={{ color: '#064e3b' }}>🗣️ {sample.kannada}</strong>
                  <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
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
  );
};
