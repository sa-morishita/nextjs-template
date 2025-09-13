import { expect, test } from '@playwright/test';

test.describe('Example E2E Tests', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/');

    // Check if page loads correctly
    await expect(page).toHaveTitle(/Next.js.*Template/i);

    // Take screenshot for visual comparison
    await page.screenshot({ path: 'test-results/homepage.png' });
  });

  test('should navigate to auth pages', async ({ page }) => {
    await page.goto('/');

    // Check if signin link is present
    const signinLink = page.getByRole('link', { name: /sign in|login/i });
    if (await signinLink.isVisible()) {
      await signinLink.click();
      await expect(page).toHaveURL(/\/auth\/signin/);
    }

    // Check if signup link is present
    const signupLink = page.getByRole('link', { name: /sign up|register/i });
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/auth\/signup/);
    }
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/mobile-view.png' });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/tablet-view.png' });

    // Test desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/desktop-view.png' });
  });
});
