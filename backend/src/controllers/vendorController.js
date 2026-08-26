const VENDORS_MOCK = [
  {
    id: 'v1',
    name: 'Ramesh Grocery',
    owner: 'Ramesh Gowda',
    status: 'online',
    distance: '1.8 km',
    location: 'Mijar Cross, Moodbidri',
    rating: 4.7,
    reviewCount: 120,
    deliveryTime: '20–30 min delivery',
    isOpen: true,
    phone: '+91 98451 23456',
    verified: true,
    categories: ['Vegetables', 'Fruits', 'Spices', 'Daily Essentials'],
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    address: 'Near Alva’s Campus Entrance, Mijar, Moodbidri - 574225'
  },
  {
    id: 'v2',
    name: 'Suresh Provision Store',
    owner: 'Suresh Shetty',
    status: 'online',
    distance: '3.4 km',
    location: 'Main Market, Moodbidri',
    rating: 4.5,
    reviewCount: 142,
    deliveryTime: '25–35 min delivery',
    isOpen: true,
    phone: '+91 98452 34567',
    verified: true,
    categories: ['Grains', 'Spices', 'Dry Fruits', 'Grocery'],
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    address: 'Shop No 14, Bus Stand Complex, Moodbidri - 574227'
  },
  {
    id: 'v3',
    name: 'Mahesh Kirana & Fresh',
    owner: 'Mahesh Poojary',
    status: 'busy',
    distance: '4.6 km',
    location: 'Kallamundkur Circle',
    rating: 4.6,
    reviewCount: 96,
    deliveryTime: '30–40 min delivery',
    isOpen: true,
    phone: '+91 98453 45678',
    verified: true,
    categories: ['Vegetables', 'Fruits', 'Daily Essentials'],
    image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    address: 'Kallamundkur Junction, Moodbidri - 574213'
  },
  {
    id: 'v4',
    name: 'Lakshmi Stores',
    owner: 'Lakshmi Bhat',
    status: 'online',
    distance: '0.8 km',
    location: 'Mijar Village Center',
    rating: 4.8,
    reviewCount: 215,
    deliveryTime: '15–20 min delivery',
    isOpen: true,
    phone: '+91 98454 56789',
    verified: true,
    categories: ['Grocery', 'Rice', 'Pulses', 'Spices'],
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    address: 'Opposite Health Center, Mijar Village - 574225'
  }
];

export const getVendors = async (req, res) => {
  try {
    const { location } = req.query;
    return res.status(200).json({
      success: true,
      count: VENDORS_MOCK.length,
      vendors: VENDORS_MOCK
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const vendor = VENDORS_MOCK.find(v => v.id === req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor store not found' });
    return res.status(200).json({ success: true, vendor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
