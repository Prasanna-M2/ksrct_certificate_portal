import { test, expect } from './fixtures';

test.describe('API Resilience & Network Error Handling', () => {
  test('API Failure - Server 500 handling on auth check', async ({ page }) => {
    // Mock 500 on auth me endpoint
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
      });
    });

    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first()).toBeVisible();
  });

  test('API Validation Error - 400 Bad Request error payload handled gracefully', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid payload format' }),
      });
    });

    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('test@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('button[type="submit"]').first().click();

    // Verify application does not crash
    await expect(page.locator('body')).toBeVisible();
  });
});
