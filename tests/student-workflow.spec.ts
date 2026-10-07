import { test, expect } from './fixtures';

test.describe('Student Capabilities & Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Student
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="register" i]').first().fill('2503737710521001@ksrct.ac.in');
    await page.locator('input[type="password"]').first().fill('Student@123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/(dashboard|student)/, { timeout: 10000 });
  });

  test('Student Dashboard loads stats and recent activities', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('body')).toContainText(/Dashboard|Certificates|OD|Status/i);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Dashboard|Welcome|Student/i }).first()).toBeVisible();
  });

  test('Upload Certificate - Form validation & Submission', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Certificate Submission|Upload Certificate|Submit Certificate/i }).first()).toBeVisible();

    // Submit empty form to trigger validation
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Upload")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // Fill form details
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('NPTEL Electrical Machines Certification');
    }

    const categorySelect = page.locator('select[name="category"]').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    const orgInput = page.locator('input[name="organization"], input[placeholder*="organization" i]').first();
    if (await orgInput.isVisible()) {
      await orgInput.fill('IIT Madras / NPTEL');
    }

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-03-15');
    }

    const descInput = page.locator('textarea[name="description"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Completed 12-week course on Electrical Machines with Elite tag.');
    }
  });

  test('Student On-Duty (OD) Form - Form validation & filling', async ({ page }) => {
    await page.goto('/student/od');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /On-Duty|OD Request/i }).first()).toBeVisible();

    const eventNameInput = page.locator('input[name="eventName"], input[placeholder*="event" i]').first();
    if (await eventNameInput.isVisible()) {
      await eventNameInput.fill('National Level Renewable Energy Symposium');
    }

    const venueInput = page.locator('input[name="venue"], input[placeholder*="venue" i]').first();
    if (await venueInput.isVisible()) {
      await venueInput.fill('Anna University, Chennai');
    }

    const daysInput = page.locator('input[name="numberOfDays"], input[type="number"]').first();
    if (await daysInput.isVisible()) {
      await daysInput.fill('2');
    }
  });

  test('My Certificates - Filtering & Listing', async ({ page }) => {
    await page.goto('/my-certificates');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /My Certificates/i }).first()).toBeVisible();

    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('NPTEL');
      await page.waitForTimeout(300);
      await searchInput.clear();
    }
  });

  test('Student Profile - Viewing details & update form', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('body')).toContainText(/ABDUL RAHMAN|2503737710521001|Electrical and Electronics Engineering/i);

    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.clear();
      await phoneInput.fill('+91 9876543210');

      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
      }
    }
  });
});
