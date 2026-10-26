/**
 * Kannada Voice Recognition & Natural Language Dialect Engine for VendorSaathi
 * Configured with Web Speech API ('kn-IN') with fallback handling for mobile & desktop browsers.
 */

export const KANNADA_SAMPLE_COMMANDS = [
  {
    kannada: '೨ ಕೆಜಿ ಟೊಮೆಟೊ ಬೇಕು',
    transliteration: '2 kilo tomato beku',
    english: 'Want 2 kg Tomato',
    productKeyword: 'tomato',
    qty: 2
  },
  {
    kannada: '೧ ಕೆಜಿ ಈರುಳ್ಳಿ ಕೊಡಿ',
    transliteration: '1 kg eerulli kodi',
    english: 'Give 1 kg Onion',
    productKeyword: 'onion',
    qty: 1
  },
  {
    kannada: 'ಆಲೂಗಡ್ಡೆ ಮತ್ತು ಕ್ಯಾರೆಟ್',
    transliteration: 'alugadde matthu carrot',
    english: 'Potato and Carrot',
    productKeyword: 'potato',
    qty: 1
  },
  {
    kannada: 'ಹಸಿರು ಪಾಲಕ್ ಸೊಪ್ಪು',
    transliteration: 'hasiru palak soppu',
    english: 'Fresh Spinach / Palak Greens',
    productKeyword: 'palak',
    qty: 1
  },
  {
    kannada: 'ಪೂಜೆಗೆ ಮಲ್ಲಿಗೆ ಹೂವು',
    transliteration: 'poojege mallige hoovu',
    english: 'Jasmine flowers for Pooja',
    productKeyword: 'mallige',
    qty: 1
  },
  {
    kannada: '೧ ಡಜನ್ ಬಾಳೆಹಣ್ಣು',
    transliteration: '1 dozen balehannu',
    english: '1 dozen Bananas',
    productKeyword: 'banana',
    qty: 1
  }
];

// Kannada Number mapping
const KANNADA_NUMBERS = {
  'ಅರ್ಧ': 0.5,
  'ಕಾಲು': 0.25,
  'ಮುಕ್ಕಾಲು': 0.75,
  'ಒಂದು': 1,
  'ಎರಡು': 2,
  'ಮೂರು': 3,
  'ನಾಲ್ಕು': 4,
  'ಐದು': 5,
  'ಆರು': 6,
  'ಏಳು': 7,
  'ಎಂಟು': 8,
  'ಒಂಬತ್ತು': 9,
  'ಹತ್ತು': 10,
  '೧': 1,
  '೨': 2,
  '೩': 3,
  '೪': 4,
  '೫': 5
};

// Kannada & Transliterated Produce Dictionary
const PRODUCE_DICTIONARY = [
  // Vegetables
  {
    keywords: ['ಟೊಮೆಟೊ', 'ಟೊಮೇಟೊ', 'tomato', 'tamata', 'tamatar'],
    target: 'tomato',
    category: 'vegetables'
  },
  {
    keywords: ['ಆಲೂಗಡ್ಡೆ', 'ಆಲೂ', 'potato', 'alugadde', 'aaloo', 'batata'],
    target: 'potato',
    category: 'vegetables'
  },
  {
    keywords: ['ಈರುಳ್ಳಿ', 'ಉಳ್ಳಾಗಡ್ಡಿ', 'onion', 'eerulli', 'ullagaddi', 'kanda'],
    target: 'onion',
    category: 'vegetables'
  },
  {
    keywords: ['ಕ್ಯಾರೆಟ್', 'carrot', 'gajjari', 'ಗಜ್ಜರಿ'],
    target: 'carrot',
    category: 'vegetables'
  },
  {
    keywords: ['ಮೆಣಸಿನಕಾಯಿ', 'ಮೆಣಸು', 'ಹಸಿ ಮೆಣಸು', 'chilli', 'chili', 'menasu', 'hasi menasu', 'green chilli'],
    target: 'chilli',
    category: 'vegetables'
  },
  {
    keywords: ['ಬದನೆಕಾಯಿ', 'badanekayi', 'brinjal', 'eggplant'],
    target: 'brinjal',
    category: 'vegetables'
  },
  {
    keywords: ['ಹೂಕೋಸು', 'hookosu', 'cauliflower', 'gobi'],
    target: 'cauliflower',
    category: 'vegetables'
  },
  {
    keywords: ['ಎಲೆಕೋಸು', 'elekosu', 'cabbage'],
    target: 'cabbage',
    category: 'vegetables'
  },
  {
    keywords: ['ಬೆಂಡೆಕಾಯಿ', 'bendekayi', 'ladies finger', 'lady finger', 'okra'],
    target: 'bendekayi',
    category: 'vegetables'
  },
  {
    keywords: ['ಸೌತೆಕಾಯಿ', 'sauthekayi', 'cucumber'],
    target: 'cucumber',
    category: 'vegetables'
  },
  {
    keywords: ['ಶುಂಠಿ', 'ಬೆಳ್ಳುಳ್ಳಿ', 'shunti', 'bellulli', 'ginger', 'garlic'],
    target: 'ginger',
    category: 'vegetables'
  },

  // Greens / Soppu
  {
    keywords: ['ಪಾಲಕ್', 'ಪಾಲಕ್ ಸೊಪ್ಪು', 'palak', 'spinach', 'palak soppu'],
    target: 'palak',
    category: 'greens'
  },
  {
    keywords: ['ಕೊತ್ತಂಬರಿ', 'ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು', 'coriander', 'kothambari', 'cilantro'],
    target: 'coriander',
    category: 'greens'
  },
  {
    keywords: ['ಪುದೀನ', 'pudina', 'mint'],
    target: 'mint',
    category: 'greens'
  },
  {
    keywords: ['ಮೆಂತೆ', 'ಮೆಂತೆ ಸೊಪ್ಪು', 'menthe', 'methi', 'fenugreek'],
    target: 'methi',
    category: 'greens'
  },
  {
    keywords: ['ದಂಟು', 'ದಂಟು ಸೊಪ್ಪು', 'dantu', 'amaranth'],
    target: 'dantu',
    category: 'greens'
  },
  {
    keywords: ['ಸಬ್ಬಕ್ಕಿ', 'ಸಬ್ಬಕ್ಕಿ ಸೊಪ್ಪು', 'sabbakki', 'dill'],
    target: 'sabbakki',
    category: 'greens'
  },
  {
    keywords: ['ಸೊಪ್ಪು', 'ಹಸಿರು ಸೊಪ್ಪು', 'greens', 'soppu'],
    target: 'soppu',
    category: 'greens'
  },

  // Fruits
  {
    keywords: ['ಬಾಳೆಹಣ್ಣು', 'ಬಾಳೆ', 'banana', 'balehannu', 'kela'],
    target: 'banana',
    category: 'fruits'
  },
  {
    keywords: ['ಸೇಬು', 'apple', 'sebu'],
    target: 'apple',
    category: 'fruits'
  },
  {
    keywords: ['ಕಿತ್ತಳೆ', 'orange', 'kittale', 'santhra'],
    target: 'orange',
    category: 'fruits'
  },
  {
    keywords: ['ಮಾವು', 'ಮಾವಿನಹಣ್ಣು', 'mango', 'mavina'],
    target: 'mango',
    category: 'fruits'
  },
  {
    keywords: ['ದಾಳಿಂಬೆ', 'pomegranate', 'dalimbe'],
    target: 'pomegranate',
    category: 'fruits'
  },
  {
    keywords: ['ಪಪ್ಪಾಯಿ', 'papaya', 'pappayi'],
    target: 'papaya',
    category: 'fruits'
  },
  {
    keywords: ['ಕಲ್ಲಂಗಡಿ', 'watermelon', 'kallangadi'],
    target: 'watermelon',
    category: 'fruits'
  },
  {
    keywords: ['ನಿಂಬೆ', 'ನಿಂಬೆಹಣ್ಣು', 'lemon', 'lime', 'nimbe'],
    target: 'lemon',
    category: 'fruits'
  },

  // Flowers
  {
    keywords: ['ಮಲ್ಲಿಗೆ', 'ಮಲ್ಲಿಗೆ ಹೂವು', 'mallige', 'jasmine'],
    target: 'jasmine',
    category: 'flowers'
  },
  {
    keywords: ['ಚೆಂಡು ಹೂ', 'ಚೆಂಡುಹೂವು', 'marigold', 'chendu'],
    target: 'marigold',
    category: 'flowers'
  },
  {
    keywords: ['ಗುಲಾಬಿ', 'ಗುಲಾಬಿ ಹೂ', 'rose', 'gulabi'],
    target: 'rose',
    category: 'flowers'
  },
  {
    keywords: ['ಸೇವಂತಿಗೆ', 'sevanthige', 'chrysanthemum'],
    target: 'sevanthige',
    category: 'flowers'
  },
  {
    keywords: ['ಹೂವು', 'ಪೂಜಾ ಹೂವು', 'flowers', 'pooja flowers', 'hoovu'],
    target: 'flowers',
    category: 'flowers'
  }
];

/**
 * Check if the browser supports Web Speech API
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Instantiate SpeechRecognition instance configured for Kannada ('kn-IN')
 */
export function createKannadaSpeechRecognition({
  onResult,
  onError,
  onEnd,
  onStart,
  interimResults = true,
  continuous = false
} = {}) {
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'kn-IN';
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      if (onStart) onStart();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (onResult) {
        onResult({
          finalTranscript: finalTranscript.trim(),
          interimTranscript: interimTranscript.trim(),
          rawEvent: event
        });
      }
    };

    recognition.onerror = (event) => {
      console.warn('Kannada SpeechRecognition error note:', event.error);
      if (onError) onError(event);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  } catch (err) {
    console.warn('Failed to initialize Kannada SpeechRecognition:', err);
    return null;
  }
}

/**
 * Parse Kannada speech text into quantity, matched produce item, and clean query
 */
export function parseKannadaVoiceInput(rawText = '', products = []) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  // 1. Extract Quantity
  let quantity = 1;
  // Check direct numbers / digits
  const digitMatch = lower.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    quantity = Math.max(1, Math.round(Number(digitMatch[1])));
  } else {
    // Check Kannada number words
    for (const [kWord, val] of Object.entries(KANNADA_NUMBERS)) {
      if (text.includes(kWord) || lower.includes(kWord)) {
        quantity = Math.max(1, Math.round(val));
        break;
      }
    }
  }

  // 2. Identify Produce Keyword
  let matchedProduce = null;
  let detectedKeyword = '';

  for (const item of PRODUCE_DICTIONARY) {
    const match = item.keywords.find(k => text.includes(k) || lower.includes(k.toLowerCase()));
    if (match) {
      matchedProduce = item;
      detectedKeyword = match;
      break;
    }
  }

  // 3. Match against currently available products in catalog
  let matchedProduct = null;
  if (matchedProduce && Array.isArray(products) && products.length > 0) {
    matchedProduct = products.find(p => {
      const pName = (p.name || '').toLowerCase();
      const pShort = (p.shortName || '').toLowerCase();
      const pNameKn = (p.nameKn || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();

      // Check if product contains any of the produce keywords
      return (
        matchedProduce.keywords.some(k => pName.includes(k.toLowerCase()) || pShort.includes(k.toLowerCase()) || pNameKn.includes(k.toLowerCase())) ||
        pShort.includes(matchedProduce.target) ||
        pName.includes(matchedProduce.target) ||
        pCat.includes(matchedProduce.category)
      );
    });
  }

  // 4. Clean search term for listing view
  let cleanSearchTerm = text;
  if (matchedProduce) {
    cleanSearchTerm = matchedProduce.target;
  } else {
    // Strip common filler words: 'beku', 'kodi', 'kilo', 'kg', 'ಬೇಕು', 'ಕೊಡಿ'
    cleanSearchTerm = text
      .replace(/(\d+)/g, '')
      .replace(/(kilo|kg|beku|kodi|haaki|gram|gramu|liters?|packet)/gi, '')
      .replace(/(ಬೇಕು|ಕೊಡಿ|ಹಾಕಿ|ಕಿಲೋ|ಕೆಜಿ|ಗ್ರಾಂ)/g, '')
      .trim();
  }

  return {
    rawText: text,
    quantity,
    detectedKeyword,
    matchedProduce,
    matchedProduct,
    cleanSearchTerm: cleanSearchTerm || text,
    category: matchedProduce?.category || null
  };
}
