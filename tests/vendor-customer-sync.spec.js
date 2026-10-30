import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant Marketplace: Dual-Role Auth, Inventory Sync & Live Orders', () => {

  test('Vendor logs in via LoginView and reaches Vendor Portal successfully', async ({ page }) => {
    // Navigate to Login View
    await page.goto('/#login?role=vendor&mode=signin', { waitUntil: 'domcontentloaded' });

    // Verify Sign In view is loaded
    await expect(page.locator('h1:has-text("Sign In to VendorSaathi")')).toBeVisible({ timeout: 10000 });

    // Click 1-Click Quick Demo Sign-in for Suresh Provision Store
    const sureshQuickBtn = page.locator('button:has-text("Vendor (Suresh)")').first();
    await expect(sureshQuickBtn).toBeVisible({ timeout: 5000 });
    await sureshQuickBtn.click();

    // Click Sign In button to submit form
    const submitBtn = page.locator('button:has-text("Sign in as Vendor Partner")').first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // Verify immediate redirect to Vendor Portal
    await expect(page.locator('h1:has-text("VendorSaathi Partner Portal")')).toBeVisible({ timeout: 12000 });
  });

  test('High-accuracy GPS access succeeds and updates user location', async ({ page, context }) => {
    // Grant geolocation permissions and mock coordinates for Moodbidri / Mijar
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({
      latitude: 13.0085,
      longitude: 74.9805,
      accuracy: 10
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Click location button in header to open LocationModal
    const locationBtn = page.locator('header button:has-text("Mijar")').first();
    await expect(locationBtn).toBeVisible({ timeout: 5000 });
    await locationBtn.click();

    // Verify Location modal opens
    await expect(page.locator('text=Exact Delivery Location')).toBeVisible({ timeout: 5000 });

    // Click Detect GPS Location
    const detectGpsBtn = page.locator('button:has-text("Auto-Detect Exact Live GPS Location")').first();
    await expect(detectGpsBtn).toBeVisible({ timeout: 5000 });
    await detectGpsBtn.click();

    // Expect modal to close upon success and show GPS locked feedback
    await expect(page.locator('text=Exact Delivery Location')).not.toBeVisible({ timeout: 8000 });
  });

  test('Real-time Catalog Sync: Vendor adds new produce item, Customer catalog updates in real-time', async ({ page }) => {
    // 1. Visit Product Listing view as customer
    await page.goto('/#product-listing', { waitUntil: 'domcontentloaded' });

    // 2. Dispatch a vendor product add via the real-time broadcast engine
    const testProduct = {
      id: `p_sync_${Date.now()}`,
      name: 'Organic Moodbidri Jackfruit',
      price: 120,
      unit: 'kg',
      category: 'fruits',
      vendorId: 'v1',
      vendorName: 'Suresh Vegetable Stall',
      availableStock: 25,
      is_available: true,
      stockStatus: 'in-stock',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80'
    };

    await page.evaluate((prod) => {
      // Simulate real-time vendor product broadcast
      const raw = localStorage.getItem('vendorsaathi_dynamic_products');
      const current = raw ? JSON.parse(raw) : [];
      const updated = [prod, ...current];
      localStorage.setItem('vendorsaathi_dynamic_products', JSON.stringify(updated));
      localStorage.setItem('vs_firebase_products_cache', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('vendorsaathi_catalog_updated', { detail: { action: 'UPDATE', data: prod } }));
      window.dispatchEvent(new Event('storage'));
    }, testProduct);

    // 3. Customer catalog must reflect the new item in real-time
    await expect(page.locator(`text=${testProduct.name}`).first()).toBeVisible({ timeout: 8000 });
  });

  test('Bi-directional Order Workflow: Customer places order -> Vendor alert -> Vendor accepts', async ({ page }) => {
    // 1. Set up Vendor Session in page
    const vendorUser = {
      uid: 'v1',
      name: 'Suresh Veggies',
      email: 'suresh@vendorsaathi.in',
      phone: '9845123456',
      role: 'vendor',
      vendorName: 'Suresh Vegetable Stall',
      isLoggedIn: true,
      preferredLanguage: 'en',
      authToken: 'vs_eyJzdWIiOiJ2MSIsInJvbGUiOiJ2ZW5kb3IiLCJleHAiOjI1MzQwMjMwMDAwMDB9.mocksig999',
      tokenExpiresAt: 2534023000000
    };

    await page.addInitScript((u) => {
      window.localStorage.setItem('vendorsaathi_current_user', JSON.stringify(u));
      window.localStorage.setItem('vendorsaathi_auth_token', u.authToken);
      window.localStorage.setItem('vendorsaathi_token_expires', String(u.tokenExpiresAt));
    }, vendorUser);

    // 2. Open Vendor Portal Orders tab
    await page.goto('/#vendor-portal', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("VendorSaathi Partner Portal")')).toBeVisible({ timeout: 10000 });

    // 3. Simulate customer placing an order via real-time broadcast
    const testOrderId = `VS${Math.floor(10000 + Math.random() * 90000)}`;
    const testOrder = {
      id: testOrderId,
      orderId: testOrderId,
      customerId: 'cust_ananya_101',
      customerName: 'Ananya Rao',
      date: 'Just now',
      timestamp: Date.now(),
      vendorId: 'v1',
      vendorName: 'Suresh Vegetable Stall',
      deliveryAddress: 'Near Alvas College, Mijar Village, Moodbidri - 574225',
      deliveryContact: '+91 98451 23456',
      items: [
        { id: 1, name: 'Country Farm Tomatoes', price: 32, unit: 'kg', quantity: 2 }
      ],
      subtotal: 64,
      deliveryFee: 20,
      total: 84,
      totalAmount: 84,
      paymentMethod: 'Cash on Delivery',
      status: 'Placed',
      timeline: [
        { status: 'Placed', label: 'Order Placed', time: 'Just now', completed: true },
        { status: 'Accepted', label: 'Vendor Accepted', time: 'Pending', completed: false }
      ]
    };

    await page.evaluate((ord) => {
      const raw = localStorage.getItem('vendorsaathi_sync_orders');
      const current = raw ? JSON.parse(raw) : [];
      const updated = [ord, ...current];
      localStorage.setItem('vendorsaathi_sync_orders', JSON.stringify(updated));
      localStorage.setItem('vendorsaathi_new_order_placed', JSON.stringify({ order: ord, timestamp: Date.now() }));
      window.dispatchEvent(new CustomEvent('vendorsaathi_new_order', { detail: ord }));
      window.dispatchEvent(new Event('storage'));
    }, testOrder);

    // 4. Verify incoming order alert banner appears in Vendor Portal
    await expect(page.locator(`text=Order #${testOrderId}`).first()).toBeVisible({ timeout: 8000 });

    // 5. Vendor clicks Accept Order button
    const acceptBtn = page.locator(`button:has-text("1. Accept Order")`).first();
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();

    // 6. Verify order status badge transitions to Accepted
    await expect(page.locator('span:has-text("Accepted")').first()).toBeVisible({ timeout: 5000 });
  });

  test('Out-of-Stock Checkout Guard: Prevents checkout when produce item is marked out-of-stock', async ({ page }) => {
    // 1. Authenticate customer with an out-of-stock item in cart
    const customerUser = {
      uid: 'test_cust_101',
      name: 'Ananya Rao',
      email: 'ananya.rao@example.com',
      role: 'customer',
      isLoggedIn: true,
      authToken: 'vs_eyJzdWIiOiJ0ZXN0X2N1c3RfMTAxIiwicm9sZSI6ImN1c3RvbWVyIiwiZXhwIjoyNTM0MDIzMDAwMDAwfQ==.mocksig12345',
      tokenExpiresAt: 2534023000000
    };

    const outOfStockCart = [
      {
        product: {
          id: 9999,
          name: 'Scarce Exotic Herbs',
          price: 50,
          unit: 'bunch',
          stockStatus: 'out-of-stock',
          is_available: false,
          availableStock: 0,
          vendorId: 'v1'
        },
        quantity: 1
      }
    ];

    await page.addInitScript(({ u, c }) => {
      window.localStorage.setItem('vendorsaathi_current_user', JSON.stringify(u));
      window.localStorage.setItem('vendorsaathi_auth_token', u.authToken);
      window.localStorage.setItem('vendorsaathi_token_expires', String(u.tokenExpiresAt));
      window.localStorage.setItem('vendorsaathi_cart', JSON.stringify(c));
    }, { u: customerUser, c: outOfStockCart });

    // 2. Navigate to Checkout view
    await page.goto('/#checkout', { waitUntil: 'domcontentloaded' });

    // 3. Expect Out-of-Stock Alert banner to be displayed
    await expect(page.locator('text=Produce Stock Telemetry Alert').or(page.locator('text=Item Availability Alert'))).toBeVisible({ timeout: 8000 });

    // 4. Expect Submit Button to be disabled with Out-of-stock warning label
    const orderBtn = page.locator('button:has-text("REMOVE OUT-OF-STOCK ITEMS")').first();
    await expect(orderBtn).toBeVisible({ timeout: 5000 });
    await expect(orderBtn).toBeDisabled();
  });

});
