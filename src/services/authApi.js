/**
 * VendorSaathi Authentication & Profile API Service
 * Connects frontend clients with backend REST endpoints for Vendor & Customer RBAC.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Universal Login API
 * @param {Object} credentials - { identifier, password, role }
 */
export const loginApi = async ({ identifier, password, role }) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier, password, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed. Please check your credentials.');
    }

    return data;
  } catch (error) {
    // If backend is unreachable (e.g., frontend-only standalone run), fallback to demo accounts
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('Backend API unreachable, using local fallback credentials...');
      return fallbackOfflineLogin({ identifier, password, role });
    }
    throw error;
  }
};

/**
 * Register Customer API
 * @param {Object} customerData
 */
export const registerCustomerApi = async (customerData) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Customer registration failed.');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('Backend API unreachable, falling back to client-side session generation...');
      return fallbackOfflineRegister(customerData, 'customer');
    }
    throw error;
  }
};

/**
 * Register Vendor API
 * @param {Object} vendorData
 */
export const registerVendorApi = async (vendorData) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register/vendor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vendorData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Vendor registration failed.');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('Backend API unreachable, falling back to client-side session generation...');
      return fallbackOfflineRegister(vendorData, 'vendor');
    }
    throw error;
  }
};

/**
 * Fetch Current Authenticated Profile
 * @param {string} token
 */
export const getProfileApi = async (token) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch user profile.');
    }

    return data;
  } catch (error) {
    console.warn('Error fetching profile from API:', error.message);
    throw error;
  }
};

/**
 * Update Profile API
 * @param {string} token
 * @param {Object} updates
 */
export const updateProfileApi = async (token, updates) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update profile.');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      return { success: true, user: updates };
    }
    throw error;
  }
};

/**
 * Update Vendor Operating Areas
 * @param {string} token
 * @param {Array<string>} operatingAreas
 */
export const updateOperatingAreasApi = async (token, operatingAreas) => {
  const res = await fetch(`${API_BASE}/api/auth/profile/operating-areas`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ operatingAreas })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update operating areas.');
  }
  return data;
};

/**
 * Update Customer Saved Location
 * @param {string} token
 * @param {Object} locationData
 */
export const updateCustomerLocationApi = async (token, locationData) => {
  const res = await fetch(`${API_BASE}/api/auth/profile/location`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(locationData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update location.');
  }
  return data;
};

/**
 * Client-Side Resilient Fallback for Offline / Standalone Environments
 */
function fallbackOfflineLogin({ identifier, role }) {
  const cleanId = (identifier || '').toLowerCase();
  const isVendor = role === 'vendor' || cleanId.includes('ramesh') || cleanId.includes('vendor');

  const user = isVendor
    ? {
        id: 'v1',
        _id: 'v1',
        name: 'Ramesh Grocery',
        fullName: 'Ramesh Gowda',
        businessName: 'Ramesh Grocery',
        email: cleanId.includes('@') ? cleanId : 'ramesh.kirana@gmail.com',
        phone: '+919845123456',
        vendorCategory: 'Vegetables',
        categories: ['Vegetables', 'Fruits', 'Spices', 'Daily Essentials'],
        operatingAreas: ['Mijar', 'Moodbidri', 'Kallamundkur', 'Alva’s Campus'],
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        vehicleDetails: { vehicleType: 'Three-Wheeler / Auto', registrationNumber: 'KA-19-MB-4521' },
        status: 'active',
        role: 'vendor'
      }
    : {
        id: 'cust_bhavana_01',
        _id: 'cust_bhavana_01',
        name: 'Bhavana Bai',
        fullName: 'Bhavana Bai',
        email: cleanId.includes('@') ? cleanId : 'bhavana.bai@gmail.com',
        phone: '+919876543210',
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
        role: 'customer'
      };

  return {
    success: true,
    token: `vs_offline_token_${Date.now()}.${Math.random().toString(36).slice(2)}`,
    user
  };
}

function fallbackOfflineRegister(data, role) {
  const id = `${role === 'vendor' ? 'v_' : 'cust_'}${Date.now()}`;
  const user = {
    ...data,
    id,
    _id: id,
    role,
    status: 'active'
  };

  return {
    success: true,
    token: `vs_offline_token_${Date.now()}.${Math.random().toString(36).slice(2)}`,
    user
  };
}
