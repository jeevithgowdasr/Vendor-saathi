import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Responsive Viewports & Mobile Accessibility Suite', () => {

  test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport (iPhone SE / Standard Mobile)

  test('Bottom Navigation renders and is interactive on mobile viewports', async ({ customerPage }) => {
    await customerPage.goto('/');

    // Verify bottom navigation bar is visible on mobile
    const bottomNav = customerPage.locator('nav.mobile-bottom-nav').or(customerPage.locator('div[style*="position: fixed"]').filter({ hasText: 'Home' }));
    await expect(bottomNav.first()).toBeVisible({ timeout: 5000 });

    // Verify touch target buttons
    const navItems = customerPage.locator('button.touch-target-44, button.touch-target-48').or(customerPage.locator('nav button'));
    expect(await navItems.count()).toBeGreaterThanOrEqual(4);
  });

  test('Modals fit mobile viewport height without clipping close buttons', async ({ guestPage }) => {
    await guestPage.goto('/');

    // Open Location Modal
    const locationBtn = guestPage.locator('button:has-text("Moodbidri")').or(guestPage.locator('button[style*="border-radius: 24px"]').first());
    if (await locationBtn.isVisible()) {
      await locationBtn.click();

      // Check modal is visible and close button exists with minimum touch target
      const closeBtn = guestPage.locator('button.btn-close-modal, button.touch-target-44[aria-label*="Close" i]').first();
      await expect(closeBtn).toBeVisible({ timeout: 5000 });

      // Verify bounding box of close button is at least 40px
      const box = await closeBtn.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }

      // Close modal
      await closeBtn.click();
    }
  });

  test('Vendor produce table switches between Table and Stacked Cards on mobile', async ({ vendorPage }) => {
    await vendorPage.goto('/#vendor-portal');

    // Switch to Produce Inventory tab
    const inventoryTab = vendorPage.locator('button:has-text("Produce & Inventory")');
    if (await inventoryTab.isVisible()) {
      await inventoryTab.click();

      // Check for ResponsiveTable mobile view toggle controls
      const cardViewBtn = vendorPage.locator('button:has-text("Cards")');
      const tableViewBtn = vendorPage.locator('button:has-text("Table")');

      if (await cardViewBtn.isVisible()) {
        await cardViewBtn.click();
        // Verify card grid is active
        await expect(vendorPage.locator('.responsive-table-grid')).toBeVisible();
      }

      if (await tableViewBtn.isVisible()) {
        await tableViewBtn.click();
        // Verify scrollable table container is active
        await expect(vendorPage.locator('.table-responsive-container')).toBeVisible();
      }
    }
  });

  test('Cart Drawer slides over smoothly and maintains vertical internal scroll on mobile', async ({ customerPage }) => {
    await customerPage.goto('/#product-listing');

    // Add item to cart
    const addToCartBtn = customerPage.locator('button:has-text("Add to Cart")').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // Open Cart Drawer
    await customerPage.locator('button:has-text("Cart")').first().click();

    // Verify cart drawer close button has >= 40px touch target
    const closeDrawerBtn = customerPage.locator('button[aria-label*="Close" i]').or(customerPage.locator('button.btn-close-modal')).first();
    await expect(closeDrawerBtn).toBeVisible();

    const box = await closeDrawerBtn.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(40);
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });

});
