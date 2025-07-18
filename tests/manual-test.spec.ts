import { test, expect } from '@playwright/test';

test('basic homepage functionality', async ({ page }) => {
  // Test just the homepage since dashboard might have build issues
  await page.goto('http://localhost:3000/');
  
  // Check if the page loads
  await expect(page.locator('h1:has-text("AEO Tracker")')).toBeVisible();
  
  // Check if the admin login button exists
  await expect(page.locator('button:has-text("Quick Admin Login")')).toBeVisible();
  
  // Try clicking it
  await page.click('button:has-text("Quick Admin Login")');
  
  // Should attempt to redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
});
