import { test as base, expect } from '@playwright/test';
import { TEST_USERS } from './test-data.js';

/**
 * Extended Playwright Test Fixture with Pre-Authenticated Roles & Helper Actions
 */
export const test = base.extend({
  /**
   * Page fixture pre-authenticated with Customer role
   */
  customerPage: async ({ page }, providePage) => {
    // Inject customer session into localStorage before initial page load
    await page.addInitScript((userData) => {
      window.localStorage.setItem('vendorsaathi_current_user', JSON.stringify(userData));
      window.localStorage.setItem('vendorsaathi_auth_token', userData.authToken);
      window.localStorage.setItem('vendorsaathi_token_expires', String(userData.tokenExpiresAt));
    }, TEST_USERS.customer);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await providePage(page);
  },

  /**
   * Page fixture pre-authenticated with Vendor role
   */
  vendorPage: async ({ page }, providePage) => {
    // Inject vendor session into localStorage before initial page load
    await page.addInitScript((userData) => {
      window.localStorage.setItem('vendorsaathi_current_user', JSON.stringify(userData));
      window.localStorage.setItem('vendorsaathi_auth_token', userData.authToken);
      window.localStorage.setItem('vendorsaathi_token_expires', String(userData.tokenExpiresAt));
    }, TEST_USERS.vendor);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await providePage(page);
  },

  /**
   * Unauthenticated clean page fixture
   */
  guestPage: async ({ page }, providePage) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await providePage(page);
  }
});

export { expect };
