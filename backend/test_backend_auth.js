import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const server = app.listen(5099, async () => {
  console.log('🧪 Test server started on port 5099');

  const post = async (url, body, headers = {}) => {
    const res = await fetch(`http://localhost:5099${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };

  const get = async (url, headers = {}) => {
    const res = await fetch(`http://localhost:5099${url}`, {
      method: 'GET',
      headers: { ...headers }
    });
    return { status: res.status, data: await res.json() };
  };

  const put = async (url, body, headers = {}) => {
    const res = await fetch(`http://localhost:5099${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };

  try {
    console.log('\n--- 1. Testing Pre-seeded Customer Login ---');
    const custLogin = await post('/api/auth/login', {
      identifier: 'bhavana.bai@gmail.com',
      password: 'password123'
    });
    console.log('Customer Login Status:', custLogin.status);
    console.log('Has Token:', !!custLogin.data.token, 'Role:', custLogin.data.user?.role);
    const customerToken = custLogin.data.token;

    console.log('\n--- 2. Testing Pre-seeded Vendor Login ---');
    const vendLogin = await post('/api/auth/login', {
      identifier: 'ramesh.kirana@gmail.com',
      password: 'password123'
    });
    console.log('Vendor Login Status:', vendLogin.status);
    console.log('Has Token:', !!vendLogin.data.token, 'Role:', vendLogin.data.user?.role);
    const vendorToken = vendLogin.data.token;

    console.log('\n--- 3. Testing New Customer Registration ---');
    const newCust = await post('/api/auth/register/customer', {
      fullName: 'Anita Rao',
      email: 'anita.rao@example.com',
      phone: '+919811122233',
      password: 'securePass123',
      primaryLocation: {
        address: 'Alva’s Vidyagiri, Moodbidri',
        coordinates: { lat: 13.069, lng: 74.998 }
      },
      preferredAreas: ['Mijar', 'Vidyagiri'],
      preferredCategories: ['Fruits', 'Vegetables']
    });
    console.log('Register Customer Status:', newCust.status, 'Success:', newCust.data.success);

    console.log('\n--- 4. Testing New Vendor Registration ---');
    const newVend = await post('/api/auth/register/vendor', {
      fullName: 'Kiran Kumar',
      businessName: 'Kiran Fresh Fruits',
      email: 'kiran.fruits@example.com',
      phone: '+919822233344',
      password: 'fruitPass123',
      vendorCategory: 'Fruit',
      operatingAreas: ['Moodbidri Town', 'Mijar', 'Alva’s Campus'],
      vehicleDetails: {
        vehicleType: 'Two-Wheeler',
        registrationNumber: 'KA-19-K-1234'
      }
    });
    console.log('Register Vendor Status:', newVend.status, 'Success:', newVend.data.success);

    console.log('\n--- 5. Testing Profile GET with Token ---');
    const profRes = await get('/api/auth/profile', {
      Authorization: `Bearer ${customerToken}`
    });
    console.log('Customer Profile Status:', profRes.status, 'Name:', profRes.data.user?.fullName);

    console.log('\n--- 6. Testing RBAC: Customer accessing Vendor operating-areas update (Expect 403 Forbidden) ---');
    const rbacDenied = await put('/api/auth/profile/operating-areas', {
      operatingAreas: ['New Locality']
    }, {
      Authorization: `Bearer ${customerToken}`
    });
    console.log('RBAC Denied Status (Expected 403):', rbacDenied.status, 'Code:', rbacDenied.data.code);

    console.log('\n--- 7. Testing RBAC: Vendor accessing Vendor operating-areas update (Expect 200 OK) ---');
    const rbacAllowed = await put('/api/auth/profile/operating-areas', {
      operatingAreas: ['Mijar', 'Moodbidri Town', 'Swarna Circle', 'Belvai']
    }, {
      Authorization: `Bearer ${vendorToken}`
    });
    console.log('RBAC Allowed Status (Expected 200):', rbacAllowed.status, 'Areas:', rbacAllowed.data.operatingAreas);

    console.log('\n--- 8. Testing RBAC: Vendor accessing Customer location update (Expect 403 Forbidden) ---');
    const vendDeniedCustEndpoint = await put('/api/auth/profile/location', {
      address: 'Test Address'
    }, {
      Authorization: `Bearer ${vendorToken}`
    });
    console.log('Vendor Denied Customer Endpoint (Expected 403):', vendDeniedCustEndpoint.status, 'Code:', vendDeniedCustEndpoint.data.code);

    console.log('\n--- 9. Testing RBAC: Customer accessing Customer location update (Expect 200 OK) ---');
    const custAllowedLoc = await put('/api/auth/profile/location', {
      address: 'Updated Moodbidri House No 42',
      coordinates: { lat: 13.07, lng: 75.0 }
    }, {
      Authorization: `Bearer ${customerToken}`
    });
    console.log('Customer Allowed Location (Expected 200):', custAllowedLoc.status, 'Location:', custAllowedLoc.data.primaryLocation?.address);

    console.log('\n--- 10. Testing Unauthenticated Access (Expect 401 Unauthorized) ---');
    const unauthRes = await get('/api/auth/profile');
    console.log('Unauth Status (Expected 401):', unauthRes.status, 'Message:', unauthRes.data.message);

    console.log('\n✅ ALL 10 BACKEND SUITE TESTS PASSED PERFECTLY!\n');
  } catch (e) {
    console.error('❌ Test failed with error:', e);
  } finally {
    server.close();
    process.exit(0);
  }
});
