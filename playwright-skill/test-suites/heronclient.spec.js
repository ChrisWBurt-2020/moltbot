const { test, expect } = require('@playwright/test');

test.describe('Heronclient Web Cockpit', () => {
  test('loads web interface successfully', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    await page.waitForSelector('[data-testid="main-interface"]');
    const title = await page.title();
    expect(title).toContain('Heronclient');
  });

  test('user authentication flow', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for auth screen
    await page.waitForSelector('[data-testid="auth-screen"]');
    
    // Enter test credentials (in CI environment)
    if (process.env.CI) {
      await page.fill('[data-testid="email-input"]', 'test@exocortex.ai');
      await page.fill('[data-testid="password-input"]', process.env.TEST_PASSWORD);
      await page.click('[data-testid="login-button"]');
      
      // Verify login success
      await page.waitForSelector('[data-testid="user-dashboard"]');
    }
  });

  test('dashboard displays SSOT data', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for SSOT sync
    await page.waitForSelector('[data-testid="ssot-synced"]');
    
    // Check learning count
    const learningCount = await page.locator('[data-testid="learning-count"]');
    await expect(learningCount).not.toBeEmpty();
    
    // Verify audit trail exists
    const auditTrail = await page.locator('[data-testid="audit-trail"]');
    await expect(auditTrail).toBeVisible();
  });

  test('search functionality', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    await page.waitForSelector('[data-testid="search-bar"]');
    
    // Type search query
    await page.fill('[data-testid="search-bar"]', 'test learning');
    
    // Press enter
    await page.press('[data-testid="search-bar"]', 'Enter');
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Verify results contain query
    const results = await page.locator('[data-testid="search-result-item"]');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('create new learning', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Click create button
    await page.click('[data-testid="create-learning-button"]');
    
    // Fill form
    await page.fill('[data-testid="concept-input"]', 'Test Concept from Playwright');
    await page.fill('[data-testid="details-input"]', 'Test details for automated testing');
    
    // Submit
    await page.click('[data-testid="submit-learning"]');
    
    // Verify creation
    await page.waitForSelector('[data-testid="learning-created-toast"]', { timeout: 10000 });
    
    // Check SSOT was updated
    await page.waitForSelector('[data-testid="learning-count"] >> text=Test Concept', { timeout: 10000 });
  });
});
