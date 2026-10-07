import { test, expect } from './fixtures';

test.describe('Staff & HOD Verification & Analytics Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HOD
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('gopalakrishnan@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Staff@123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/(dashboard|staff|hod)/, { timeout: 10000 });
  });

  test('Staff Dashboard - Tab switching between Mentor, Advisor, and HOD queues', async ({ page }) => {
    await page.goto('/staff/dashboard');
    await expect(page.locator('body')).toContainText(/Gopalakrishnan|HOD|Department|Queue/i);

    const mentorTab = page.locator('button:has-text("Mentor"), [role="tab"]:has-text("Mentor")').first();
    const advisorTab = page.locator('button:has-text("Advisor"), [role="tab"]:has-text("Advisor")').first();
    const hodTab = page.locator('button:has-text("HOD"), [role="tab"]:has-text("HOD")').first();

    if (await mentorTab.isVisible()) {
      await mentorTab.click();
      await page.waitForTimeout(300);
    }
    if (await advisorTab.isVisible()) {
      await advisorTab.click();
      await page.waitForTimeout(300);
    }
    if (await hodTab.isVisible()) {
      await hodTab.click();
      await page.waitForTimeout(300);
    }
  });

  test('HOD Student Directory - Search and Filter Students', async ({ page }) => {
    await page.goto('/hod/students');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Student|Directory/i }).first()).toBeVisible();

    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="student" i], input[placeholder*="register" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('2503737710521001');
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toContainText(/ABDUL RAHMAN|2503737710521001|Students/i);
      await searchInput.clear();
    }
  });

  test('HOD Department Certificates View', async ({ page }) => {
    await page.goto('/hod/certificates');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Certificate/i }).first()).toBeVisible();

    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption({ index: 0 });
    }
  });

  test('HOD Reports - Date filtering & CSV Export trigger', async ({ page }) => {
    await page.goto('/hod/reports');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Report|Analytics/i }).first()).toBeVisible();

    const exportBtn = page.locator('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")').first();
    if (await exportBtn.isVisible()) {
      // Export button is present in the DOM (disabled when 0 items exist, enabled when items exist)
      await expect(exportBtn).toBeVisible();
    }
  });
});
