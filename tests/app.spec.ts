import { test, expect } from '@playwright/test';

test.describe('AEO Tracker Application', () => {
  test('should load landing page and admin login', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/AEO Tracker/);
    
    // Look for the quick admin login button
    const adminButton = page.locator('button:has-text("Quick Admin Login")');
    await expect(adminButton).toBeVisible();
    
    // Click admin login
    await adminButton.click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check that admin email is displayed
    await expect(page.locator('text=admin@aeotracker.dev')).toBeVisible();
  });

  test('should allow adding and running queries', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Navigate and login as admin
    await page.goto('/');
    await page.click('button:has-text("Quick Admin Login")');
    await expect(page).toHaveURL('/dashboard');
    
    // Find the query input
    const queryInput = page.locator('input[placeholder="e.g., Mejor hamburguesa de Santiago"]');
    await expect(queryInput).toBeVisible();
    
    // Enter a test query
    const testQuery = 'Best burger in Santiago';
    await queryInput.fill(testQuery);
    
    // Click Add Query button
    const addButton = page.locator('button:has-text("Add Query")');
    await addButton.click();
    
    // Wait for the query to appear in the list
    await expect(page.locator(`text=${testQuery}`)).toBeVisible();
    
    // Check that input was cleared
    await expect(queryInput).toHaveValue('');
    
    // Check that Run buttons appear
    await expect(page.locator('button:has-text("Run on chatgpt")')).toBeVisible();
  });

  test('should handle API run functionality', async ({ page }) => {
    // Navigate and login as admin
    await page.goto('/');
    await page.click('button:has-text("Quick Admin Login")');
    await expect(page).toHaveURL('/dashboard');
    
    // Add a query first
    const queryInput = page.locator('input[placeholder="e.g., Mejor hamburguesa de Santiago"]');
    await queryInput.fill('Test query for API');
    await page.click('button:has-text("Add Query")');
    
    // Wait for the query to appear
    await expect(page.locator('text=Test query for API')).toBeVisible();
    
    // Mock the API endpoint to avoid actual scraping during tests
    await page.route('**/api/run-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          runId: 'mock-run-123',
          mentions: 2,
          brands: ['Streat Burger', 'Local Burger']
        })
      });
    });
    
    // Click Run on ChatGPT button
    const runButton = page.locator('button:has-text("Run on chatgpt")').first();
    await runButton.click();
    
    // Wait for the API call to complete and check for success indication
    // This depends on how your UI handles the response
    await page.waitForTimeout(1000);
  });

  test('should maintain admin session persistence', async ({ page }) => {
    // Navigate and login as admin
    await page.goto('/');
    await page.click('button:has-text("Quick Admin Login")');
    await expect(page).toHaveURL('/dashboard');
    
    // Reload the page
    await page.reload();
    
    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=admin@aeotracker.dev')).toBeVisible();
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    // Clear any existing admin bypass
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('admin-bypass');
    });
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });
}); 