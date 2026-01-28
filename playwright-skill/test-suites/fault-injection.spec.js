const { test, expect } = require('@playwright/test');

test.describe('Fault Injection - Resilience Testing', () => {
  test('handles network failure gracefully', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="main-interface"]');
    
    // Block all network requests
    await page.route('**/*', route => route.abort('failed'));
    
    // Verify offline mode is triggered
    await page.waitForSelector('[data-testid="offline-mode"]', { timeout: 5000 });
    
    // Verify UI remains accessible
    const searchInput = await page.locator('[data-testid="search-bar"]');
    await expect(searchInput).toBeVisible();
    
    // Try to perform offline action
    await page.fill('[data-testid="search-bar"]', 'offline test');
    await page.press('[data-testid="search-bar"]', 'Enter');
    
    // Should show queued indicator
    await page.waitForSelector('[data-testid="action-queued"]');
    
    // Restore network
    await page.unroute('**/*');
    
    // Verify action was processed
    await page.waitForSelector('[data-testid="action-completed"]', { timeout: 15000 });
  });

  test('WebSocket disconnection during active session', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for WebSocket connection
    await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Start a background task (e.g., long-running search)
    const searchPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('search_complete', () => resolve(), { once: true });
      });
    });
    
    // Start search
    await page.fill('[data-testid="search-bar"]', 'complex query');
    await page.press('[data-testid="search-bar"]', 'Enter');
    
    // Simulate disconnection mid-search
    await page.route('**/*', route => {
      if (route.request().url().includes('ws://') || route.request().url().includes('wss://')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Verify graceful degradation during active task
    await page.waitForSelector('[data-testid="offline-mode"]', { timeout: 5000 });
    
    // Restore connection
    await page.unroute('**/*');
    
    // Wait for search to complete with reconnection
    await Promise.race([
      searchPromise,
      page.waitForTimeout(10000)
    ]);
    
    // Verify final state is consistent
    const state = await page.evaluate(() => window.appState);
    expect(state.synced).toBe(true);
  });

  test('partial data loss recovery', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for connection
    await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Get initial state
    const initialState = await page.evaluate(() => window.appState);
    
    // Simulate partial data loss by corrupting state
    await page.evaluate(() => {
      window.appState.learnings = [];
      window.appState.synced = false;
    });
    
    // Trigger SSOT reconciliation
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('request_sync'));
    });
    
    // Wait for reconciliation
    await page.waitForSelector('[data-testid="reconciling"]', { timeout: 5000 });
    
    // Verify state was restored
    await page.waitForSelector('[data-testid="ssot-synced"]', { timeout: 15000 });
    
    const finalState = await page.evaluate(() => window.appState);
    expect(finalState.synced).toBe(true);
    expect(finalState.learnings.length).toBeGreaterThan(0);
  });

  test('rate limit handling', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Simulate rapid actions
    const actions = [];
    for (let i = 0; i < 10; i++) {
      actions.push(page.evaluate(() => {
        return window.dispatchEvent(new CustomEvent('websocket_message', {
          detail: { type: 'learning_created', data: { concept: `RateTest-${Date.now()}` } }
        });
      }));
    }
    
    // Execute all actions
    await Promise.all(actions);
    
    // Should show rate limit indicator
    await page.waitForSelector('[data-testid="rate-limit-warning"]', { timeout: 5000 });
    
    // Verify system recovers
    await page.waitForSelector('[data-testid="rate-limit-resolved"]', { timeout: 15000 });
    
    // Verify no data loss
    const state = await page.evaluate(() => window.appState);
    expect(state.synced).toBe(true);
  });

  test('memory leak prevention under load', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Monitor memory usage
    const initialMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
    
    // Generate many events
    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('websocket_message', {
          detail: { type: 'learning_created', data: { concept: `Load-${Math.random()}` } }
        });
      });
      if (i % 10 === 0) {
        await page.waitForTimeout(100);
      }
    }
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check memory usage
    const finalMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (not a leak)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    
    // Verify system still responsive
    const state = await page.evaluate(() => window.appState);
    expect(state.synced).toBe(true);
  });
});
