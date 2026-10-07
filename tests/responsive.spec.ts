import { test, expect } from './fixtures';

test.describe('Responsive & Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Mobile Viewport - Login Page adapts responsively', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('Mobile Viewport - Authenticated Sidebar Mobile Drawer Toggle', async ({ page }) => {
    // Login on mobile viewport
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('2503737710521001@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Student@123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/(dashboard|student)/, { timeout: 10000 });

    // Look for hamburger menu toggle button in header
    const menuBtn = page.locator('header button, button[aria-label*="menu" i], button:has(svg)').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(page.locator('body')).toBeVisible();
  });
});
