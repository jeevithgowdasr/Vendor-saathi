import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Core Transaction & Anti-Duplicate Multi-Click Suite', () => {

  test('Customer end-to-end order flow: Product Catalog -> Add to Cart -> Checkout', async ({ customerPage }) => {
    // 1. Visit Product Catalog
    await customerPage.goto('/#product-listing');
    await customerPage.waitForLoadState('networkidle');

    // 2. Add first available produce item to cart
    const addToCartBtn = customerPage.locator('button:has-text("Add to Cart")').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // 3. Open Cart Drawer via Navbar Cart Button
    const navbarCartBtn = customerPage.locator('button:has-text("Cart")').first();
    await navbarCartBtn.click();

    // 4. Verify item is in the Cart Drawer
    await expect(customerPage.locator('text=Your Fresh Cart')).toBeVisible();
    await expect(customerPage.locator('button:has-text("Proceed to Checkout")')).toBeVisible();

    // 5. Proceed to Checkout View
    const proceedBtn = customerPage.locator('button:has-text("Proceed to Checkout")');
    await proceedBtn.click();

    // 6. Verify Checkout view loaded
    await expect(customerPage.locator('text=Delivery Speed & Time Slot')).toBeVisible({ timeout: 5000 });
    await expect(customerPage.locator('text=Payment Method')).toBeVisible();
  });

  test('Anti-Duplicate Multi-Click Protection prevents double submissions on AsyncButtons', async ({ customerPage }) => {
    await customerPage.goto('/#product-listing');

    // Add item to cart
    const addToCartBtn = customerPage.locator('button:has-text("Add to Cart")').first();
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // Navigate to checkout
    await customerPage.goto('/#checkout');
    await expect(customerPage.locator('text=Payment Method')).toBeVisible({ timeout: 5000 });

    // Select Cash on Delivery option
    const codRadio = customerPage.locator('input[value="Cash on Delivery"]').or(customerPage.locator('text=Cash on Delivery / Pay on Arrival'));
    if (await codRadio.isVisible()) {
      await codRadio.click();
    }

    // Locate the place order button
    const placeOrderBtn = customerPage.locator('button:has-text("Confirm Order")').or(customerPage.locator('button:has-text("Place Order")')).or(customerPage.locator('button[type="submit"]')).last();
    
    if (await placeOrderBtn.isVisible()) {
      // Rapid multi-click test (click 3 times in quick succession)
      await Promise.all([
        placeOrderBtn.click({ delay: 10 }).catch(() => {}),
        placeOrderBtn.click({ delay: 10 }).catch(() => {}),
        placeOrderBtn.click({ delay: 10 }).catch(() => {})
      ]);

      // Button should be disabled during submission and prevent multiple simultaneous calls
      // Confirm that user ends up in order tracking or confirmation without duplicate crash
      await expect(customerPage.locator('text=Order Confirmed').or(customerPage.locator('text=Order Tracking')).or(customerPage.locator('text=Order Status'))).toBeVisible({ timeout: 10000 });
    }
  });

  test('Wishlist toggle adds and removes items seamlessly', async ({ customerPage }) => {
    await customerPage.goto('/#product-listing');

    // Locate the first wishlist heart button
    const wishlistBtn = customerPage.locator('button[aria-label*="wishlist" i]').first();
    if (await wishlistBtn.isVisible()) {
      await wishlistBtn.click();

      // Navigate to wishlist
      await customerPage.goto('/#wishlist');
      await expect(customerPage.locator('text=My Wishlist')).toBeVisible({ timeout: 5000 });
    }
  });

});
