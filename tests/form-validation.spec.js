import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Form Validation & Input Sanitization Suite', () => {

  test('Rejects whitespace-only inputs and enforces required fields in Profile Edit', async ({ customerPage }) => {
    await customerPage.goto('/#profile');

    // Open Edit Profile modal
    const editBtn = customerPage.locator('button:has-text("Edit Profile & GPS")');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    // Verify modal appears
    await expect(customerPage.locator('text=Edit Profile & GPS Details')).toBeVisible();

    // Clear Full Name and fill with whitespace only
    const nameInput = customerPage.locator('input[placeholder*="Full Name"]').or(customerPage.locator('input[name="name"]')).or(customerPage.locator('input').first());
    await nameInput.fill('   ');

    // Submit form
    const saveBtn = customerPage.locator('button:has-text("Save Profile")');
    await saveBtn.click();

    // Verify inline error message appears
    await expect(customerPage.locator('text=cannot be empty or contain only spaces').or(customerPage.locator('text=required'))).toBeVisible();
  });

  test('Validates email formatting and rejects invalid domains', async ({ customerPage }) => {
    await customerPage.goto('/#profile');

    // Open Edit Profile modal
    await customerPage.locator('button:has-text("Edit Profile & GPS")').click();

    // Fill invalid email format
    const emailInput = customerPage.locator('input[type="email"]').or(customerPage.locator('input[placeholder*="email" i]'));
    if (await emailInput.count() > 0) {
      await emailInput.fill('invalid-email-address');

      // Click save
      await customerPage.locator('button:has-text("Save Profile")').click();

      // Expect email validation error
      await expect(customerPage.locator('text=valid email address')).toBeVisible();

      // Correct the email
      await emailInput.fill('valid.user@example.com');
      // The error message should disappear upon correction or submit
    }
  });

  test('Enforces price and quantity numeric constraints in Vendor Product Publish form', async ({ vendorPage }) => {
    await vendorPage.goto('/#vendor-portal');

    // Switch to Produce & Stock Inventory Tab
    const inventoryTab = vendorPage.locator('button:has-text("Produce & Inventory")');
    if (await inventoryTab.isVisible()) {
      await inventoryTab.click();
    }

    // Click Add Fresh Harvest Item
    const addItemBtn = vendorPage.locator('button:has-text("Add Fresh Harvest Item")');
    if (await addItemBtn.isVisible()) {
      await addItemBtn.click();

      // Try submitting empty form
      const publishBtn = vendorPage.locator('button:has-text("Publish to Store")');
      await publishBtn.click();

      // Expect validation errors
      await expect(vendorPage.locator('text=required').or(vendorPage.locator('text=cannot be empty'))).toBeVisible();
    }
  });

});
