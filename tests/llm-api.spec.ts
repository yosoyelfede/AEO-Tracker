import { test, expect } from '@playwright/test';

test.describe('LLM API Integration', () => {
  test('should show new model selection checkboxes', async ({ page }) => {
    // Navigate and login as admin
    await page.goto('/');
    await page.click('button:has-text("Quick Admin Login")');
    await expect(page).toHaveURL('/dashboard');
    
    // Check that all 4 model checkboxes are present
    await expect(page.locator('label:has-text("ChatGPT (OpenAI)")')).toBeVisible();
    await expect(page.locator('label:has-text("Claude (Anthropic)")')).toBeVisible();
    await expect(page.locator('label:has-text("Gemini (Google)")')).toBeVisible();
    await expect(page.locator('label:has-text("Perplexity")')).toBeVisible();
    
    // Check that ChatGPT is selected by default
    await expect(page.locator('#chatgpt')).toBeChecked();
    await expect(page.locator('#claude')).not.toBeChecked();
    await expect(page.locator('#gemini')).not.toBeChecked();
    await expect(page.locator('#perplexity')).not.toBeChecked();
  });

  test('should allow selecting multiple models', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Quick Admin Login")');
    await expect(page).toHaveURL('/dashboard');
    
    // Select multiple models
    await page.check('#claude');
    await page.check('#gemini');
    
    // Verify multiple models are selected
    await expect(page.locator('#chatgpt')).toBeChecked();
    await expect(page.locator('#claude')).toBeChecked();
    await expect(page.locator('#gemini')).toBeChecked();
    await expect(page.locator('#perplexity')).not.toBeChecked();
  });

  test('should show updated button text', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Quick Admin Login")');
    await expect(page).toHaveURL('/dashboard');
    
    // Add a query to see the run button
    const queryInput = page.locator('input[placeholder="e.g., Mejor hamburguesa de Santiago"]');
    await queryInput.fill('Test query');
    await page.click('button:has-text("Add Query")');
    
    // Wait for query to appear and check button text
    await expect(page.locator('text=Test query')).toBeVisible();
    await expect(page.locator('button:has-text("Run on selected models")')).toBeVisible();
  });

  test('should validate model selection before running', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Quick Admin Login")');
    await expect(page).toHaveURL('/dashboard');
    
    // Add a query
    const queryInput = page.locator('input[placeholder="e.g., Mejor hamburguesa de Santiago"]');
    await queryInput.fill('Test validation');
    await page.click('button:has-text("Add Query")');
    await expect(page.locator('text=Test validation')).toBeVisible();
    
    // Uncheck all models
    await page.uncheck('#chatgpt');
    
    // Try to run with no models selected
    await page.click('button:has-text("Run on selected models")');
    
    // Should see validation message
    await expect(page.locator('text=Please select at least one model')).toBeVisible();
  });
});
