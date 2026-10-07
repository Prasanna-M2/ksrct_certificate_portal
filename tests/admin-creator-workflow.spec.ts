import { test, expect } from './fixtures';

test.describe('Creator & Admin Capabilities', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Creator
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('creator@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Creator@123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/(dashboard|creator|admin)/, { timeout: 10000 });
  });

  test('Creator Workspace - Canvas layout & template controls', async ({ page }) => {
    await page.goto('/creator/workspace');
    await expect(page.locator('body')).toContainText(/Creator|Template|Canvas|Workspace|Designer/i);

    const addTextBtn = page.locator('button:has-text("Add Text"), button:has-text("Text Field")').first();
    if (await addTextBtn.isVisible()) {
      await addTextBtn.click();
    }
  });

  test('Admin Panel - User Management Directory', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('body')).toContainText(/User|Admin|Role|Department|Users/i);

    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('gopalakrishnan');
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toContainText(/Gopalakrishnan/i);
      await searchInput.clear();
    }
  });

  test('Admin Panel - System Audit Trail Logs', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await expect(page.locator('body')).toContainText(/Audit|Log|Activity|Action/i);

    await expect(page.locator('table, .space-y-4, div:has-text("LOGIN")').first()).toBeVisible();
  });
});
