/**
 * Test Accounts, Seed Mock Data & Selectors
 */

export const TEST_USERS = {
  customer: {
    uid: 'test_cust_101',
    name: 'Ananya Rao',
    email: 'ananya.rao@example.com',
    phone: '9845123456',
    role: 'customer',
    village: 'Mijar',
    town: 'Moodbidri',
    district: 'Dakshina Kannada',
    pincode: '574225',
    address: 'Near Alvas College, Main Road, Mijar Village, Moodbidri - 574225',
    isLoggedIn: true,
    preferredLanguage: 'en',
    authToken: 'vs_eyJzdWIiOiJ0ZXN0X2N1c3RfMTAxIiwicm9sZSI6ImN1c3RvbWVyIiwiZXhwIjoyNTM0MDIzMDAwMDAwfQ==.mocksig12345',
    tokenExpiresAt: 2534023000000
  },
  vendor: {
    uid: 'test_vend_202',
    name: 'Ramesh Gowda (Farmer)',
    email: 'ramesh.farmer@example.com',
    phone: '9876543210',
    role: 'vendor',
    village: 'Mijar',
    town: 'Moodbidri',
    district: 'Dakshina Kannada',
    pincode: '574225',
    vendorName: 'Ramesh Organic Veggies',
    isLoggedIn: true,
    preferredLanguage: 'kn',
    authToken: 'vs_eyJzdWIiOiJ0ZXN0X3ZlbmRfMjAyIiwicm9sZSI6InZlbmRvciIsImV4cCI6MjUzNDAyMzAwMDAwMH0=.mocksig67890',
    tokenExpiresAt: 2534023000000
  }
};

export const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Fresh Country Farm Tomatoes (ನಾಟಿ ಟೊಮೆಟೊ)',
    price: 32,
    unit: 'kg',
    category: 'vegetables',
    inStock: true
  },
  {
    id: 2,
    name: 'Mijar Local Green Chillies',
    price: 45,
    unit: '500g',
    category: 'vegetables',
    inStock: true
  }
];
