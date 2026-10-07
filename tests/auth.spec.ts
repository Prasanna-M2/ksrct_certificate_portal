import { test, expect } from './fixtures';

test.describe('Authentication & Authorization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage & cookies to ensure clean state
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('Page loading - Login page displays institutional portal branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Student Certificate Management Portal|Rangasamy|KSRCT/i);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Rangasamy|KSRCT|Certificate|Student|Login|Sign in/i }).first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('Authentication Failure - Invalid credentials display error notification', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('invalid_user@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('WrongPassword123');
    await page.locator('button[type="submit"]').first().click();

    // Verify error notification or message
    await expect(page.locator('.text-red-500, .bg-red-50, [role="alert"], div:has-text("Invalid credentials")').first()).toBeVisible({ timeout: 10000 });
  });

  test('Form Validation - Empty login submission is handled cleanly', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').first().click();
    // HTML5 or app level validation prevents login or shows alert
    await expect(page.url()).toContain('/login');
  });

  test('Student Authentication & Token Persistence', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('2503737710521001@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Student@123');
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL(/\/(dashboard|student)/, { timeout: 10000 });
    await expect(page.url()).not.toContain('/login');

    // Check header or user profile text
    await expect(page.locator('body')).toContainText(/ABDUL RAHMAN|Student|Dashboard/i);

    // Logout
    const logoutBtn = page.locator('button:has-text("Logout"), button[title="Logout"], button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });
    }
  });

  test('Staff / HOD Authentication', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('gopalakrishnan@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Staff@123');
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL(/\/(dashboard|staff|hod)/, { timeout: 10000 });
    await expect(page.url()).not.toContain('/login');
    await expect(page.locator('body')).toContainText(/Gopalakrishnan|HOD|Staff|Dashboard/i);
  });

  test('Master Creator Authentication', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('creator@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Creator@123');
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL(/\/(dashboard|creator|admin)/, { timeout: 10000 });
    await expect(page.url()).not.toContain('/login');
  });

  test('Protected Routes - Direct unauthenticated navigation redirects to Login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/my-certificates');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page.url()).toContain('/login');

    await page.goto('/hod/reports');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page.url()).toContain('/login');
  });
});
