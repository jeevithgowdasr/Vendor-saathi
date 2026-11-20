// Product localization utility for regional Karnataka & national languages (Kannada & Hindi)

const PRODUCT_NAME_TRANSLATIONS = {
  // Vegetables
  'tomato': { kn: 'ತಾಜಾ ಕೆಂಪು ಟೊಮೇಟೊ', hi: 'ताज़ा लाल टमाटर' },
  'tomatoes': { kn: 'ತಾಜಾ ಕೆಂಪು ಟೊಮೇಟೊಗಳು', hi: 'ताज़ा टमाटर' },
  'potato': { kn: 'ಸ್ಥಳೀಯ ಸಾವಯವ ಆಲೂಗಡ್ಡೆ', hi: 'ताज़ा जैविक आलू' },
  'potatoes': { kn: 'ಸ್ಥಳೀಯ ಸಾವಯವ ಆಲೂಗಡ್ಡೆ', hi: 'ताज़ा आलू' },
  'onion': { kn: 'ತಾಜಾ ನಾಟಿ ಈರುಳ್ಳಿ', hi: 'ताज़ा देशी प्याज' },
  'onions': { kn: 'ತಾಜಾ ನಾಟಿ ಈರುಳ್ಳಿ', hi: 'ताज़ा प्याज' },
  'carrot': { kn: 'ತಾಜಾ ಊಟಿ ಕ್ಯಾರೆಟ್', hi: 'ताज़ा गाजर' },
  'carrots': { kn: 'ತಾಜಾ ಊಟಿ ಕ್ಯಾರೆಟ್', hi: 'ताज़ा गाजर' },
  'beans': { kn: 'ತಾಜಾ ಹುರುಳಿಕಾಯಿ (ಬೀನ್ಸ್)', hi: 'ताज़ा बीन्स' },
  'green chilli': { kn: 'ಖಾರದ ಹಸಿ ಮೆಣಸಿನಕಾಯಿ', hi: 'तीखी हरी मिर्च' },
  'chillies': { kn: 'ಹಸಿ ಮೆಣಸಿನಕಾಯಿ', hi: 'हरी मिर्च' },
  'cucumber': { kn: 'ತಾಜಾ ಸೌತೆಕಾಯಿ', hi: 'ताज़ा खीरा' },
  'ladies finger': { kn: 'ತಾಜಾ ಬೆಂಡೆಕಾಯಿ', hi: 'ताज़ी भिंडी' },
  'bhindi': { kn: 'ತಾಜಾ ಬೆಂಡೆಕಾಯಿ', hi: 'ताज़ी भिंडी' },
  'brinjal': { kn: 'ಗುಳ್ಳ / ಬದನೆಕಾಯಿ', hi: 'ताज़ा बैंगन' },
  'cabbage': { kn: 'ತಾಜಾ ಎಲೆಕೋಸು', hi: 'ताज़ा पत्तागोभी' },
  'cauliflower': { kn: 'ತಾಜಾ ಹೂಕೋಸು', hi: 'ताज़ा फूलगोभी' },
  'ginger': { kn: 'ತಾಜಾ ಶುಂಠಿ', hi: 'ताज़ा अदरक' },
  'garlic': { kn: 'ಶುದ್ಧ ಬೆಳ್ಳುಳ್ಳಿ', hi: 'ताज़ा लहसुन' },
  'lemon': { kn: 'ತಾಜಾ ನಿಂಬೆಹಣ್ಣು', hi: 'ताज़ा नींबू' },

  // Greens / Soppu
  'palak': { kn: 'ತಾಜಾ ಪಾಲಕ್ ಸೊಪ್ಪು', hi: 'ताज़ा पालक' },
  'spinach': { kn: 'ತಾಜಾ ಪಾಲಕ್ ಸೊಪ್ಪು', hi: 'ताज़ा पालक' },
  'methi': { kn: 'ತಾಜಾ ಮೆಂತ್ಯ ಸೊಪ್ಪು', hi: 'ताज़ी मेथी' },
  'coriander': { kn: 'ತಾಜಾ ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು', hi: 'ताज़ा हरा धनिया' },
  'curry leaves': { kn: 'ಸುವಾಸನೆಯ ಕರಿಬೇವು', hi: 'ताज़ा करी पत्ता' },

  // Fruits
  'banana': { kn: 'ಏಲಕ್ಕಿ ಬಾಳೆಹಣ್ಣು', hi: 'मीठा इलायची केला' },
  'bananas': { kn: 'ಏಲಕ್ಕಿ ಬಾಳೆಹಣ್ಣು', hi: 'ताज़ा केला' },
  'apple': { kn: 'ಸಿಹಿ ಕಾಶ್ಮೀರಿ ಸೇಬು', hi: 'मीठा कश्मीरी सेब' },
  'apples': { kn: 'ಕಾಶ್ಮೀರಿ ಸೇಬು', hi: 'ताज़ा सेब' },
  'mango': { kn: 'ರುಚಿಕರ ಬಾದಾಮಿ ಮಾವಿನಹಣ್ಣು', hi: 'मीठा बादामी आम' },
  'mangoes': { kn: 'ರುಚಿಕರ ಮಾವಿನಹಣ್ಣು', hi: 'ताज़ा आम' },
  'orange': { kn: 'ಕಿತ್ತಳೆ ಹಣ್ಣು', hi: 'रसीला संतरा' },
  'oranges': { kn: 'ಕಿತ್ತಳೆ ಹಣ್ಣುಗಳು', hi: 'ताज़ा संतरा' },
  'papaya': { kn: 'ಸಿಹಿ ಪರಂಗಿ ಹಣ್ಣು (ಪಪ್ಪಾಯಿ)', hi: 'मीठा पपीता' },
  'pomegranate': { kn: 'ದಾಳಿಂಬೆ ಹಣ್ಣು', hi: 'ताज़ा अनार' },
  'watermelon': { kn: 'ಕಲ್ಲಂಗಡಿ ಹಣ್ಣು', hi: 'ताज़ा तरबूज' },
  'grapes': { kn: 'ಸಿಹಿ ದ್ರಾಕ್ಷಿ', hi: 'मीठे अंगूर' },

  // Flowers & Daily Essentials
  'jasmine': { kn: 'ಮಂಗಳೂರು ಮಲ್ಲಿಗೆ ಹೂವು', hi: 'ताज़ी चमेली' },
  'marigold': { kn: 'ಚೆಂಡು ಹೂವು (ಮಾರಿಗೋಲ್ಡ್)', hi: 'ताज़ा गेंदा फूल' },
  'rose': { kn: 'ಪೂಜಾ ಗುಲಾಬಿ ಹೂಗಳು', hi: 'ताज़े गुलाब' },
  'flowers': { kn: 'ತಾಜಾ ಪೂಜಾ ಹೂವುಗಳು', hi: 'ताज़े पूजा फूल' },
  'coconut': { kn: 'ಕರಾವಳಿ ತೆಂಗಿನಕಾಯಿ', hi: 'ताज़ा नारियल' },
  'milk': { kn: 'ನಂದಿನಿ ಶುದ್ಧ ಹಾಲು', hi: 'नंदिनी ताज़ा दूध' },
  'curd': { kn: 'ನಂದಿನಿ ಗಟ್ಟಿ ಮೊಸರು', hi: 'नंदिनी ताज़ा दही' }
};

/**
 * Returns localized product name based on selected language
 */
export function getLocalizedProductName(product, lang = 'en') {
  if (!product) return '';
  if (lang === 'en') return product.name || '';

  // 1. Direct explicit localized property if set
  if (lang === 'kn' && product.nameKn) return product.nameKn;
  if (lang === 'hi' && product.nameHi) return product.nameHi;

  const lowerName = (product.name || '').toLowerCase();
  const lowerShort = (product.shortName || '').toLowerCase();

  // 2. Dictionary lookup
  for (const [term, trans] of Object.entries(PRODUCT_NAME_TRANSLATIONS)) {
    if (lowerName.includes(term) || lowerShort === term) {
      return trans[lang] || product.name;
    }
  }

  return product.name || '';
}

/**
 * Returns localized product unit (kg, g, bunch, pack, litre)
 */
export function getLocalizedUnit(unit, lang = 'en') {
  if (!unit) return '';
  if (lang === 'kn') {
    if (unit === 'kg') return 'ಕೆ.ಜಿ';
    if (unit === 'g') return 'ಗ್ರಾಂ';
    if (unit === 'bunch') return 'ಕಟ್ಟು';
    if (unit === 'pack') return 'ಪ್ಯಾಕ್';
    if (unit === 'piece' || unit === 'pc') return 'ಪೀಸ್';
    if (unit === 'litre' || unit === 'L') return 'ಲೀಟರ್';
  }
  if (lang === 'hi') {
    if (unit === 'kg') return 'किग्रा';
    if (unit === 'g') return 'ग्राम';
    if (unit === 'bunch') return 'गुच्छा';
    if (unit === 'pack') return 'पैकेट';
    if (unit === 'piece' || unit === 'pc') return 'पीस';
    if (unit === 'litre' || unit === 'L') return 'लीटर';
  }
  return unit;
}
