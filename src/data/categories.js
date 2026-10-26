export const CATEGORIES = [
  {
    id: 'vegetables',
    name: 'Vegetables',
    shortName: 'Vegetables',
    icon: '🥕',
    description: 'Farm-fresh organic & local vegetables delivered daily',
    color: '#16a34a',
    bg: '#f0fdf4',
    itemCount: 42,
    image: '/products/product-1.jpg'
  },
  {
    id: 'fruits',
    name: 'Fruits',
    shortName: 'Fruits',
    icon: '🍎',
    description: 'Fresh seasonal & local sweet orchard fruits',
    color: '#ea580c',
    bg: '#fff7ed',
    itemCount: 28,
    image: '/products/product-2.jpg'
  },
  {
    id: 'greens',
    name: 'Green Vegetables (Greens / Soppu)',
    shortName: 'Greens / Soppu',
    icon: '🥬',
    description: 'Fresh leafy greens, Palak, Methi, Coriander & nutritious Soppu',
    color: '#059669',
    bg: '#ecfdf5',
    itemCount: 24,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'flowers',
    name: 'Flowers',
    shortName: 'Flowers',
    icon: '🌸',
    description: 'Fresh Pooja flowers, Jasmine, Marigold, Sevanti & fragrant Roses',
    color: '#db2777',
    bg: '#fdf2f8',
    itemCount: 18,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80'
  }
];

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
