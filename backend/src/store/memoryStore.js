import bcrypt from 'bcryptjs';

// Pre-computed hash of 'password123' and 'admin123'
const HASHED_DEMO_PASSWORD = bcrypt.hashSync('password123', 10);
const HASHED_ADMIN_PASSWORD = bcrypt.hashSync('admin123', 10);

export const memoryStore = {
  customers: [
    {
      id: 'cust_bhavana_01',
      _id: 'cust_bhavana_01',
      fullName: 'Bhavana Bai',
      name: 'Bhavana Bai',
      email: 'bhavana.bai@gmail.com',
      phone: '+919876543210',
      passwordHash: HASHED_DEMO_PASSWORD,
      primaryLocation: {
        address: 'Bhavana Bai, Near Alva’s College Campus, Mijar, Moodbidri - 574225',
        coordinates: { lat: 13.0682, lng: 74.9961 },
        village: 'Mijar',
        town: 'Moodbidri',
        district: 'Dakshina Kannada',
        pincode: '574225'
      },
      preferredAreas: ['Mijar', 'Moodbidri', 'Alva’s Campus'],
      preferredCategories: ['Vegetables', 'Fruits', 'Dairy'],
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      status: 'active',
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],

  vendors: [
    {
      id: 'v1',
      _id: 'v1',
      fullName: 'Ramesh Gowda',
      name: 'Ramesh Grocery',
      businessName: 'Ramesh Grocery',
      email: 'ramesh.kirana@gmail.com',
      phone: '+919845123456',
      passwordHash: HASHED_DEMO_PASSWORD,
      vendorCategory: 'Vegetables',
      categories: ['Vegetables', 'Fruits', 'Spices', 'Daily Essentials'],
      operatingAreas: ['Mijar', 'Moodbidri', 'Kallamundkur', 'Alva’s Campus'],
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      vehicleDetails: {
        vehicleType: 'Three-Wheeler / Auto',
        registrationNumber: 'KA-19-MB-4521'
      },
      status: 'active',
      role: 'vendor',
      locationName: 'Mijar Cross, Moodbidri',
      address: 'Near Alva’s Campus Entrance, Mijar, Moodbidri - 574225',
      coordinates: { lat: 13.0682, lng: 74.9961 },
      distanceKm: 1.8,
      rating: 4.8,
      reviewCount: 120,
      deliveryTime: '20–30 min delivery',
      isOpen: true,
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'v2',
      _id: 'v2',
      fullName: 'Suresh Shetty',
      name: 'Suresh Provision Store',
      businessName: 'Suresh Provision Store',
      email: 'suresh.store@gmail.com',
      phone: '+919845234567',
      passwordHash: HASHED_DEMO_PASSWORD,
      vendorCategory: 'Dairy',
      categories: ['Dairy', 'Grains', 'Spices', 'Grocery'],
      operatingAreas: ['Main Market', 'Moodbidri', 'Bus Stand Area'],
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      vehicleDetails: {
        vehicleType: 'Two-Wheeler',
        registrationNumber: 'KA-19-EX-8899'
      },
      status: 'active',
      role: 'vendor',
      locationName: 'Main Market, Moodbidri',
      address: 'Shop No 14, Bus Stand Complex, Moodbidri - 574227',
      coordinates: { lat: 13.072, lng: 74.998 },
      distanceKm: 3.4,
      rating: 4.5,
      reviewCount: 142,
      deliveryTime: '25–35 min delivery',
      isOpen: true,
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],

  admins: [
    {
      id: 'admin_01',
      _id: 'admin_01',
      fullName: 'Platform Administrator',
      name: 'Platform Administrator',
      email: 'admin@vendorsaathi.com',
      phone: '+919999999999',
      passwordHash: HASHED_ADMIN_PASSWORD,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ],

  products: [
    {
      id: 'p1',
      _id: 'p1',
      vendor_id: 'v1',
      vendorId: 'v1',
      vendorName: 'Ramesh Grocery',
      name: 'Fresh Farm Red Tomatoes',
      shortName: 'Tomato',
      category: 'Vegetable',
      price: 25,
      unit: 'kg',
      available_quantity: 18,
      availableStock: 18,
      is_available: true,
      stockStatus: 'in-stock',
      image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
      description: 'Fresh and juicy farm tomatoes sourced directly from local Moodbidri farms.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p2',
      _id: 'p2',
      vendor_id: 'v1',
      vendorId: 'v1',
      vendorName: 'Ramesh Grocery',
      name: 'Fresh Local Potatoes',
      shortName: 'Potato',
      category: 'Vegetable',
      price: 30,
      unit: 'kg',
      available_quantity: 12,
      availableStock: 12,
      is_available: true,
      stockStatus: 'in-stock',
      image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
      description: 'Clean medium-sized local potatoes.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p3',
      _id: 'p3',
      vendor_id: 'v1',
      vendorId: 'v1',
      vendorName: 'Ramesh Grocery',
      name: 'Pooja Red Roses',
      shortName: 'Rose',
      category: 'Flower',
      price: 60,
      unit: 'bunch',
      available_quantity: 15,
      availableStock: 15,
      is_available: true,
      stockStatus: 'in-stock',
      image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
      description: 'Fresh scented roses for temple pooja and home decoration.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p4',
      _id: 'p4',
      vendor_id: 'v1',
      vendorId: 'v1',
      vendorName: 'Ramesh Grocery',
      name: 'Fresh Dairy Milk',
      shortName: 'Milk',
      category: 'Dairy',
      price: 28,
      unit: 'litre',
      available_quantity: 25,
      availableStock: 25,
      is_available: true,
      stockStatus: 'in-stock',
      image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
      description: 'Pure pasture cow milk packaged fresh every morning.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p5',
      _id: 'p5',
      vendor_id: 'v1',
      vendorId: 'v1',
      vendorName: 'Ramesh Grocery',
      name: 'Crispy Banana Chips',
      shortName: 'Snacks',
      category: 'Snacks',
      price: 50,
      unit: 'packet',
      available_quantity: 0,
      availableStock: 0,
      is_available: false,
      stockStatus: 'out-of-stock',
      image_url: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80',
      image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80',
      description: 'Authentic South Canara coconut oil fried banana chips.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],

  // Helpers
  cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  },

  findCustomerByIdentifier(identifier) {
    if (!identifier) return null;
    const lowerId = identifier.trim().toLowerCase();
    const isEmail = lowerId.includes('@');
    const cleanId = this.cleanPhone(identifier);

    return this.customers.find(c => {
      if (isEmail) {
        return c.email && c.email.toLowerCase() === lowerId;
      }
      if (cleanId.length >= 10) {
        const cPhoneClean = this.cleanPhone(c.phone);
        return cPhoneClean === cleanId || cPhoneClean.endsWith(cleanId.slice(-10));
      }
      return c.phone === identifier;
    });
  },

  findVendorByIdentifier(identifier) {
    if (!identifier) return null;
    const lowerId = identifier.trim().toLowerCase();
    const isEmail = lowerId.includes('@');
    const cleanId = this.cleanPhone(identifier);

    return this.vendors.find(v => {
      if (isEmail) {
        return v.email && v.email.toLowerCase() === lowerId;
      }
      if (cleanId.length >= 10) {
        const vPhoneClean = this.cleanPhone(v.phone);
        return vPhoneClean === cleanId || vPhoneClean.endsWith(cleanId.slice(-10));
      }
      return v.phone === identifier;
    });
  },

  findAdminByIdentifier(identifier) {
    if (!identifier) return null;
    const lowerId = identifier.trim().toLowerCase();
    return this.admins.find(a => a.email.toLowerCase() === lowerId || a.phone === identifier);
  },

  findById(id) {
    const cust = this.customers.find(c => c.id === id || c._id === id);
    if (cust) return cust;
    const vend = this.vendors.find(v => v.id === id || v._id === id);
    if (vend) return vend;
    const adm = this.admins.find(a => a.id === id || a._id === id);
    return adm || null;
  },

  // Product Methods
  findProductsByVendor(vendorId, { category, search } = {}) {
    let list = this.products.filter(p => p.vendor_id === vendorId || p.vendorId === vendorId);
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      list = list.filter(p => (p.category || '').toLowerCase() === catLower);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(p => 
        (p.name || '').toLowerCase().includes(q) || 
        (p.shortName || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  },

  findProductById(id) {
    return this.products.find(p => p.id === id || p._id === id);
  },

  createProduct(data) {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const newProduct = {
      id,
      _id: id,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.products.unshift(newProduct);
    return newProduct;
  },

  updateProduct(id, updates) {
    const idx = this.products.findIndex(p => p.id === id || p._id === id);
    if (idx === -1) return null;
    this.products[idx] = {
      ...this.products[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return this.products[idx];
  },

  deleteProduct(id) {
    const idx = this.products.findIndex(p => p.id === id || p._id === id);
    if (idx === -1) return false;
    this.products.splice(idx, 1);
    return true;
  }
};
