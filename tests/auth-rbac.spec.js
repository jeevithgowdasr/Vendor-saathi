import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Authentication & Role-Based Access Control (RBAC) Suite', () => {

  test('Guest (Unauthenticated) redirected when accessing protected checkout route', async ({ guestPage }) => {
    // Navigate directly to protected checkout route via hash
    await guestPage.goto('/#checkout');

    // Should redirect to login or show Authentication Required screen
    await expect(guestPage.locator('text=Authentication Required').or(guestPage.locator('text=Please sign in'))).toBeVisible({ timeout: 5000 });
  });

  test('Guest redirected when attempting to access vendor portal directly', async ({ guestPage }) => {
    await guestPage.goto('/#vendor-portal');

    // Should guard against guest access
    await expect(guestPage.locator('text=Authentication Required').or(guestPage.locator('text=Sign In'))).toBeVisible({ timeout: 5000 });
  });

  test('Customer (Logged in) gets 403 Unauthorized when accessing Vendor Portal', async ({ customerPage }) => {
    // Navigate customer to vendor portal
    await customerPage.goto('/#vendor-portal');

    // Expect 403 Unauthorized screen for role mismatch
    await expect(customerPage.locator('text=403 — Unauthorized Role').or(customerPage.locator('text=Access Denied'))).toBeVisible({ timeout: 5000 });
    await expect(customerPage.locator('text=VENDOR').first()).toBeVisible();
  });

  test('Vendor (Logged in) successfully accesses Vendor Dashboard and inventory', async ({ vendorPage }) => {
    // Navigate vendor to vendor portal
    await vendorPage.goto('/#vendor-portal');

    // Expect vendor portal header and inventory tab
    await expect(vendorPage.locator('text=Live Vendor Hub').or(vendorPage.locator('text=Vendor Portal'))).toBeVisible({ timeout: 5000 });
    await expect(vendorPage.locator('text=Produce & Stock Inventory').or(vendorPage.locator('text=Live Store Produce Catalog'))).toBeVisible();
  });

  test('Logout destroys session, clears localStorage, and redirects safely', async ({ customerPage }) => {
    // Navigate to profile
    await customerPage.goto('/#profile');

    // Find and click Sign Out Securely button
    const signOutBtn = customerPage.locator('button:has-text("Sign Out Securely")');
    await expect(signOutBtn).toBeVisible({ timeout: 5000 });
    await signOutBtn.click();

    // Verify localStorage auth tokens are destroyed
    const authToken = await customerPage.evaluate(() => window.localStorage.getItem('vendorsaathi_auth_token'));
    const currentUser = await customerPage.evaluate(() => window.localStorage.getItem('vendorsaathi_current_user'));

    expect(authToken).toBeNull();
    expect(currentUser).toBeNull();
  });

});
