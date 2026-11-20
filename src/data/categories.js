export const CATEGORIES = [
  {
    id: 'vegetables',
    name: 'Vegetables',
    nameKn: 'ತರಕಾರಿಗಳು',
    nameHi: 'ताज़ी सब्जियां',
    shortName: 'Vegetables',
    shortNameKn: 'ತರಕಾರಿ',
    shortNameHi: 'सब्जियां',
    icon: '🥕',
    description: 'Farm-fresh organic & local vegetables delivered daily',
    descKn: 'ಪ್ರತಿದಿನ ತಾಜಾ ಸಾವಯವ ಮತ್ತು ಸ್ಥಳೀಯ ತರಕಾರಿಗಳು ಲಭ್ಯ',
    descHi: 'रोज़ाना खेत से आई जैविक और स्थानीय सब्जियां',
    color: '#0284c7',
    bg: '#eff6ff',
    itemCount: 42,
    image: '/products/product-1.jpg'
  },
  {
    id: 'fruits',
    name: 'Fruits',
    nameKn: 'ಹಣ್ಣುಗಳು',
    nameHi: 'मौसमी फल',
    shortName: 'Fruits',
    shortNameKn: 'ಹಣ್ಣು',
    shortNameHi: 'फल',
    icon: '🍎',
    description: 'Fresh seasonal & local sweet orchard fruits',
    descKn: 'ಸ್ಥಳೀಯ ಮತ್ತು ಮಲೆನಾಡಿನ ರುಚಿಕರ ತಾಜಾ ಹಣ್ಣುಗಳು',
    descHi: 'मीठे और ताज़े मौसमी बागवानी फल',
    color: '#ea580c',
    bg: '#fff7ed',
    itemCount: 28,
    image: '/products/product-2.jpg'
  },
  {
    id: 'greens',
    name: 'Green Vegetables (Greens / Soppu)',
    nameKn: 'ಸೊಪ್ಪುಗಳು (Greens / Soppu)',
    nameHi: 'हरी पत्तेदार सब्जियां (साग / सोप्पु)',
    shortName: 'Greens / Soppu',
    shortNameKn: 'ಸೊಪ್ಪುಗಳು',
    shortNameHi: 'साग / सोप्पु',
    icon: '🥬',
    description: 'Fresh leafy greens, Palak, Methi, Coriander & nutritious Soppu',
    descKn: 'ಪಾಲಕ್, ಮೆಂತ್ಯ, ಕೊತ್ತಂಬರಿ ಹಾಗೂ ಪೌಷ್ಟಿಕ ಸೊಪ್ಪುಗಳು',
    descHi: 'पालक, मेथी, धनिया और पौष्टिक हरी पत्तेदार सब्जियां',
    color: '#0d9488',
    bg: '#f0fdfa',
    itemCount: 24,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'flowers',
    name: 'Flowers',
    nameKn: 'ಪೂಜಾ ಹೂವುಗಳು',
    nameHi: 'पूजा के फूल',
    shortName: 'Flowers',
    shortNameKn: 'ಹೂವುಗಳು',
    shortNameHi: 'फूल',
    icon: '🌸',
    description: 'Fresh Pooja flowers, Jasmine, Marigold, Sevanti & fragrant Roses',
    descKn: 'ಮಲ್ಲಿಗೆ, ಸೇವಂತಿ, ಮಾರಿಗೋಲ್ಡ್ ಮತ್ತು ಸುಗಂಧ ಗುಲಾಬಿ ಹೂಗಳು',
    descHi: 'चमेली, गेंदा, सेवंती और खुशबूदार ताज़े गुलाब',
    color: '#db2777',
    bg: '#fdf2f8',
    itemCount: 18,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80'
  }
];

/**
 * Returns localized category name and description according to active language
 */
export function getLocalizedCategory(cat, lang = 'en') {
  if (!cat) return { name: '', shortName: '', description: '' };
  let target = cat;
  if (typeof cat === 'string') {
    const found = CATEGORIES.find(c => c.id === cat);
    if (found) target = found;
    else return { name: cat, shortName: cat, description: '' };
  }
  if (lang === 'kn') {
    return {
      ...target,
      name: target.nameKn || target.name,
      shortName: target.shortNameKn || target.shortName || target.nameKn || target.name,
      description: target.descKn || target.description
    };
  }
  if (lang === 'hi') {
    return {
      ...target,
      name: target.nameHi || target.name,
      shortName: target.shortNameHi || target.shortName || target.nameHi || target.name,
      description: target.descHi || target.description
    };
  }
  return {
    ...target,
    name: target.name,
    shortName: target.shortName || target.name,
    description: target.description
  };
}

export const ALLOWED_CUSTOMER_CATEGORIES = [
  'vegetables',
  'fruits',
  'greens',
  'flowers'
];

/**
 * Normalizes product category strings into one of the 4 allowed customer categories
 */
export function isAllowedCustomerCategory(categoryStr) {
  if (!categoryStr) return false;
  const s = categoryStr.toLowerCase().trim();
  return (
    s.includes('veg') ||
    s.includes('fruit') ||
    s.includes('green') ||
    s.includes('soppu') ||
    s.includes('flower') ||
    s.includes('pooja')
  );
}

export function normalizeCategoryToCustomerAllowed(categoryStr) {
  if (!categoryStr) return 'vegetables';
  const s = categoryStr.toLowerCase().trim();
  if (s.includes('green') || s.includes('soppu') || s.includes('leaf')) return 'greens';
  if (s.includes('flower') || s.includes('pooja') || s.includes('rose') || s.includes('jasmine')) return 'flowers';
  if (s.includes('fruit') || s.includes('apple') || s.includes('banana') || s.includes('mango')) return 'fruits';
  return 'vegetables';
}
