const PRODUCTS_MOCK = [
  {
    id: 'p1',
    name: 'Fresh Farm Red Tomatoes',
    shortName: 'Tomato',
    category: 'vegetables',
    price: 25,
    originalPrice: 35,
    unit: 'kg',
    availableStock: 8,
    stockStatus: 'in-stock',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    vendorDistance: '1.8 km',
    rating: 4.7,
    reviewCount: 120,
    isPopular: true,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
    description: 'Fresh and juicy farm tomatoes sourced directly from local Moodbidri farms.'
  },
  {
    id: 'p2',
    name: 'Fresh Local Potatoes',
    shortName: 'Potato',
    category: 'vegetables',
    price: 30,
    originalPrice: 40,
    unit: 'kg',
    availableStock: 2,
    stockStatus: 'low-stock',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    vendorDistance: '1.8 km',
    rating: 4.5,
    reviewCount: 98,
    isPopular: true,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
    description: 'Clean medium-sized local potatoes.'
  },
  {
    id: 'p3',
    name: 'Red Onions (Kanda)',
    shortName: 'Onion',
    category: 'vegetables',
    price: 35,
    originalPrice: 45,
    unit: 'kg',
    availableStock: 20,
    stockStatus: 'in-stock',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    vendorDistance: '1.8 km',
    rating: 4.6,
    reviewCount: 110,
    isPopular: true,
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=500&q=80',
    description: 'Pungent red onions essential for cooking.'
  },
  {
    id: 'p4',
    name: 'Spicy Green Chillies',
    shortName: 'Green Chilli',
    category: 'vegetables',
    price: 40,
    originalPrice: 50,
    unit: '250 g',
    availableStock: 4,
    stockStatus: 'in-stock',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    vendorDistance: '1.8 km',
    rating: 4.8,
    reviewCount: 64,
    isPopular: true,
    image: 'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=500&q=80',
    description: 'Handpicked hot green chillies.'
  },
  {
    id: 'p5',
    name: 'Byadgi Dry Red Chilli',
    shortName: 'Dry Red Chilli',
    category: 'spices',
    price: 180,
    originalPrice: 210,
    unit: 'kg',
    availableStock: 12,
    stockStatus: 'in-stock',
    vendorId: 'v2',
    vendorName: 'Suresh Provision Store',
    vendorDistance: '3.4 km',
    rating: 4.9,
    reviewCount: 88,
    isPopular: true,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80',
    description: 'Authentic Karnataka Byadgi Red Chillies.'
  }
];

export const getProducts = async (req, res) => {
  try {
    const { category, vendorId, search } = req.query;
    let list = PRODUCTS_MOCK;

    if (category) list = list.filter(p => p.category === category);
    if (vendorId) list = list.filter(p => p.vendorId === vendorId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q));
    }

    return res.status(200).json({ success: true, count: list.length, products: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = PRODUCTS_MOCK.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
