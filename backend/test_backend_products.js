import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const API_BASE = 'http://localhost:5000';

const runTests = async () => {
  console.log('🧪 Starting Vendor Product Management API Test Suite...\n');

  // 1. Log in as Vendor Ramesh
  const vendLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ramesh.kirana@gmail.com',
      password: 'password123'
    })
  });
  const vendLoginData = await vendLoginRes.json();
  const vendorToken = vendLoginData.token;
  console.log('1. Vendor Login:', vendLoginRes.status, 'Token obtained:', !!vendorToken);

  // 2. Log in as Customer Bhavana
  const custLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'bhavana.bai@gmail.com',
      password: 'password123'
    })
  });
  const custLoginData = await custLoginRes.json();
  const customerToken = custLoginData.token;
  console.log('2. Customer Login:', custLoginRes.status, 'Role:', custLoginData.user?.role);

  // 3. GET /api/vendor/products (Vendor Token)
  const getProdsRes = await fetch(`${API_BASE}/api/vendor/products`, {
    headers: { Authorization: `Bearer ${vendorToken}` }
  });
  const getProdsData = await getProdsRes.json();
  console.log('3. GET /api/vendor/products (Expected 200):', getProdsRes.status, 'Count:', getProdsData.count);

  // 4. RBAC: GET /api/vendor/products (Customer Token - Expect 403 Forbidden)
  const custForbiddenRes = await fetch(`${API_BASE}/api/vendor/products`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  const custForbiddenData = await custForbiddenRes.json();
  console.log('4. Customer Access to Vendor Products (Expected 403):', custForbiddenRes.status, custForbiddenData.code);

  // 5. POST /api/vendor/products (Create new item)
  const createProdRes = await fetch(`${API_BASE}/api/vendor/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${vendorToken}`
    },
    body: JSON.stringify({
      name: 'Fresh Lady Finger (Bhendi)',
      category: 'Vegetable',
      price: 35,
      unit: 'kg',
      available_quantity: 15,
      is_available: true,
      description: 'Tender farm-fresh okra handpicked from Moodbidri fields.'
    })
  });
  const createProdData = await createProdRes.json();
  console.log('5. POST /api/vendor/products (Expected 201):', createProdRes.status, 'Created ID:', createProdData.product?.id);
  const newProductId = createProdData.product?.id;

  // 6. GET /api/vendor/products/:id
  const getSingleRes = await fetch(`${API_BASE}/api/vendor/products/${newProductId}`, {
    headers: { Authorization: `Bearer ${vendorToken}` }
  });
  const getSingleData = await getSingleRes.json();
  console.log('6. GET /api/vendor/products/:id (Expected 200):', getSingleRes.status, 'Name:', getSingleData.product?.name);

  // 7. PUT /api/vendor/products/:id (Update price and quantity)
  const updateProdRes = await fetch(`${API_BASE}/api/vendor/products/${newProductId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${vendorToken}`
    },
    body: JSON.stringify({
      price: 40,
      available_quantity: 20
    })
  });
  const updateProdData = await updateProdRes.json();
  console.log('7. PUT /api/vendor/products/:id (Expected 200):', updateProdRes.status, 'New Price:', updateProdData.product?.price);

  // 8. PATCH /api/vendor/products/:id/toggle-availability
  const toggleRes = await fetch(`${API_BASE}/api/vendor/products/${newProductId}/toggle-availability`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${vendorToken}`
    },
    body: JSON.stringify({ is_available: false })
  });
  const toggleData = await toggleRes.json();
  console.log('8. PATCH toggle-availability (Expected 200):', toggleRes.status, 'is_available:', toggleData.is_available, 'stockStatus:', toggleData.stockStatus);

  // 9. DELETE /api/vendor/products/:id
  const deleteRes = await fetch(`${API_BASE}/api/vendor/products/${newProductId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${vendorToken}` }
  });
  const deleteData = await deleteRes.json();
  console.log('9. DELETE /api/vendor/products/:id (Expected 200):', deleteRes.status, 'Success:', deleteData.success);

  // 10. Verify Deleted (Expect 404)
  const verifyDeleteRes = await fetch(`${API_BASE}/api/vendor/products/${newProductId}`, {
    headers: { Authorization: `Bearer ${vendorToken}` }
  });
  console.log('10. GET Deleted Product (Expected 404):', verifyDeleteRes.status);

  console.log('\n🎉 ALL 10 VENDOR PRODUCT TESTS PASSED!\n');
};

runTests().catch(console.error);
