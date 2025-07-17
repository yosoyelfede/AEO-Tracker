import { test, expect } from '@playwright/test'

test.describe('AEO Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000')
    
    // Wait for auth to load (assuming user is already authenticated)
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  })

  test('should display analytics tab and allow brand list filtering', async ({ page }) => {
    // Click on Analytics tab
    await page.click('button:has-text("Analytics")')
    
    // Should see the analytics page title
    await expect(page.locator('h1:has-text("AEO Analytics")')).toBeVisible()
    
    // Should see the subtitle about Answer Engine Optimization
    await expect(page.locator('text=Answer Engine Optimization performance tracking')).toBeVisible()
    
    // Should see brand list selector
    await expect(page.locator('select').first()).toBeVisible()
    
    // Should see time range selectors
    await expect(page.locator('button:has-text("7 days")')).toBeVisible()
    await expect(page.locator('button:has-text("30 days")')).toBeVisible()
    await expect(page.locator('button:has-text("90 days")')).toBeVisible()
  })

  test('should show empty state when no brand list is selected', async ({ page }) => {
    await page.click('button:has-text("Analytics")')
    
    // Should show empty state if no brand list is selected
    const filterIcon = page.locator('svg.lucide-filter')
    await expect(filterIcon).toBeVisible()
    
    const emptyStateText = page.locator('text=Select a Brand List')
    await expect(emptyStateText).toBeVisible()
  })

  test('should show AEO metrics when brand list is selected', async ({ page }) => {
    await page.click('button:has-text("Analytics")')
    
    // Try to select a brand list if available
    const brandListSelect = page.locator('select').first()
    const options = await brandListSelect.locator('option').count()
    
    if (options > 1) { // More than just the "Select Brand List" option
      await brandListSelect.selectOption({ index: 1 })
      
      // Should show key metrics
      await expect(page.locator('text=Total Mentions')).toBeVisible()
      await expect(page.locator('text=Avg. Ranking')).toBeVisible()
      await expect(page.locator('text=Share of Voice')).toBeVisible()
      await expect(page.locator('text=Model Coverage')).toBeVisible()
      
      // Should show charts section
      await expect(page.locator('text=Mentions Over Time')).toBeVisible()
      await expect(page.locator('text=Brand Performance')).toBeVisible()
      await expect(page.locator('text=AI Model Analysis')).toBeVisible()
    }
  })

  test('should be able to switch between time ranges', async ({ page }) => {
    await page.click('button:has-text("Analytics")')
    
    // Test time range selection
    await page.click('button:has-text("7 days")')
    await expect(page.locator('button:has-text("7 days")')).toHaveClass(/bg-/)
    
    await page.click('button:has-text("90 days")')
    await expect(page.locator('button:has-text("90 days")')).toHaveClass(/bg-/)
  })

  test('should not contain hardcoded burger references', async ({ page }) => {
    await page.click('button:has-text("Analytics")')
    
    // Should not contain burger-specific text
    const burgerText = page.locator('text=burger')
    await expect(burgerText).toHaveCount(0)
    
    const burgerBrandText = page.locator('text=burger brand')
    await expect(burgerBrandText).toHaveCount(0)
  })

  test('should show brand list creation form', async ({ page }) => {
    // Go to Query tab first
    await page.click('button:has-text("Query")')
    
    // Should see the brand list manager
    await expect(page.locator('text=Brand Lists')).toBeVisible()
    
    // Click create brand list button
    await page.click('button:has-text("Create Brand List")')
    
    // Should show form with generic placeholder
    const nameInput = page.locator('input[placeholder*="Santiago Restaurants"]')
    await expect(nameInput).toBeVisible()
    
    // Should not have burger-specific placeholder
    const burgerPlaceholder = page.locator('input[placeholder*="Burger"]')
    await expect(burgerPlaceholder).toHaveCount(0)
  })

  test('should show proper query placeholder text', async ({ page }) => {
    await page.click('button:has-text("Query")')
    
    const queryTextarea = page.locator('textarea[placeholder*="restaurant"]')
    await expect(queryTextarea).toBeVisible()
    
    // Should have generic examples, not burger-specific
    const burgerPlaceholder = page.locator('textarea[placeholder*="burger"]')
    await expect(burgerPlaceholder).toHaveCount(0)
  })

  test('should require brand list selection before running query', async ({ page }) => {
    await page.click('button:has-text("Query")')
    
    // Type a query
    await page.fill('textarea[placeholder*="restaurant"]', 'What is the best place to eat?')
    
    // Select a model
    await page.click('button:has([class*="🤖"])')
    
    // The run button should show "Select a brand list to run query"
    const runButton = page.locator('button:has-text("Select a brand list to run query")')
    await expect(runButton).toBeVisible()
    await expect(runButton).toBeDisabled()
  })
})

test.describe('AEO Analytics Charts and Visualizations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
    await page.click('button:has-text("Analytics")')
  })

  test('should display charts when data is available', async ({ page }) => {
    // Try to select a brand list
    const brandListSelect = page.locator('select').first()
    const options = await brandListSelect.locator('option').count()
    
    if (options > 1) {
      await brandListSelect.selectOption({ index: 1 })
      
      // Check for chart containers
      const chartElements = page.locator('[class*="recharts"]')
      const chartCount = await chartElements.count()
      
      // Should have at least one chart if data exists
      if (chartCount > 0) {
        await expect(chartElements.first()).toBeVisible()
      }
    }
  })

  test('should show brand performance table', async ({ page }) => {
    const brandListSelect = page.locator('select').first()
    const options = await brandListSelect.locator('option').count()
    
    if (options > 1) {
      await brandListSelect.selectOption({ index: 1 })
      
      // Should show detailed brand performance table
      await expect(page.locator('text=Detailed Brand Performance')).toBeVisible()
      
      // Should have table headers
      await expect(page.locator('th:has-text("Brand")')).toBeVisible()
      await expect(page.locator('th:has-text("Mentions")')).toBeVisible()
      await expect(page.locator('th:has-text("Avg. Rank")')).toBeVisible()
      await expect(page.locator('th:has-text("Share of Voice")')).toBeVisible()
      await expect(page.locator('th:has-text("AI Models")')).toBeVisible()
    }
  })

  test('should show query effectiveness section', async ({ page }) => {
    const brandListSelect = page.locator('select').first()
    const options = await brandListSelect.locator('option').count()
    
    if (options > 1) {
      await brandListSelect.selectOption({ index: 1 })
      
      // Should show most effective queries section
      await expect(page.locator('text=Most Effective Queries')).toBeVisible()
      await expect(page.locator('text=Queries that generated the most brand mentions')).toBeVisible()
    }
  })
}) 