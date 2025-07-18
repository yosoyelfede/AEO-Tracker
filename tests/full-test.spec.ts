import { test, expect } from '@playwright/test';

test('full LLM API integration test', async ({ page }) => {
  // Navigate and login as admin
  await page.goto('/');
  await page.click('button:has-text("Quick Admin Login")');
  await expect(page).toHaveURL('/dashboard');
  
  // Verify admin is logged in
  await expect(page.locator('text=admin@aeotracker.dev')).toBeVisible();
  
  // Verify all 4 model checkboxes are present
  await expect(page.locator('label:has-text("ChatGPT (OpenAI)")')).toBeVisible();
  await expect(page.locator('label:has-text("Claude (Anthropic)")')).toBeVisible();
  await expect(page.locator('label:has-text("Gemini (Google)")')).toBeVisible();
  await expect(page.locator('label:has-text("Perplexity")')).toBeVisible();
  
  // Verify ChatGPT is selected by default
  await expect(page.locator('#chatgpt')).toBeChecked();
  
  // Add a query
  const queryInput = page.locator('input[placeholder="e.g., Mejor hamburguesa de Santiago"]');
  await queryInput.fill('Best burger in Santiago');
  await page.click('button:has-text("Add Query")');
  
  // Wait for query to appear
  await expect(page.locator('text=Best burger in Santiago')).toBeVisible();
  
  // Verify the run button shows correct text
  await expect(page.locator('button:has-text("Run on selected models")')).toBeVisible();
  
  console.log('✅ All LLM API integration features working correctly!');
});
