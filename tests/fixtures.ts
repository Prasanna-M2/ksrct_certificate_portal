import { test as base, Page } from '@playwright/test';

export interface TestLogger {
  consoleErrors: string[];
  failedRequests: { url: string; status: number; method: string }[];
}

export const test = base.extend<{ testLogger: TestLogger }>({
  testLogger: [
    async ({ page }, use) => {
      const testLogger: TestLogger = {
        consoleErrors: [],
        failedRequests: [],
      };

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          testLogger.consoleErrors.push(`[Console Error] ${msg.text()}`);
        }
      });

      page.on('response', (response) => {
        if (response.status() >= 400) {
          testLogger.failedRequests.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method(),
          });
        }
      });

      await use(testLogger);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
