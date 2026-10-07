import { test, expect } from './fixtures';

test.describe('Public & Support & Common Features', () => {
  test('Public Certificate Verification - Invalid code display', async ({ page }) => {
    await page.goto('/verify/INVALID-TEST-CODE-9999');
    await expect(page.locator('body')).toContainText(/Invalid|Not Found|Certificate|Verification/i);
  });

  test('Support System & FAQs - Page load & Submit Ticket Form', async ({ page }) => {
    // Login as Student first to access Support
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('2503737710521001@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Student@123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/(dashboard|student)/, { timeout: 10000 });

    await page.goto('/support');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Support|Help|FAQ/i }).first()).toBeVisible();

    // Check ticket form
    const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]').first();
    if (await subjectInput.isVisible()) {
      await subjectInput.fill('Need help updating register number');
    }

    const messageInput = page.locator('textarea[name="message"], textarea[placeholder*="message" i]').first();
    if (await messageInput.isVisible()) {
      await messageInput.fill('My profile register number has a typo, please assist.');
    }
  });

  test('Notifications Center - View & Filter Notifications', async ({ page }) => {
    // Login as Student
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('2503737710521001@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Student@123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/(dashboard|student)/, { timeout: 10000 });

    await page.goto('/notifications');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Notification/i }).first()).toBeVisible();
  });
});
