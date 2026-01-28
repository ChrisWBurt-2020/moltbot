const { test, expect } = require('@playwright/test');

test.describe('WebSocket Reliability', () => {
  test('websocket connect and maintain state', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for WebSocket connection
    const ws = await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Get initial state
    const initialState = await page.evaluate(() => window.appState);
    
    // Verify connection is stable
    await page.waitForTimeout(2000);
    const stableState = await page.evaluate(() => window.appState);
    
    expect(stableState.synced).toBe(true);
    expect(stableState.lastSync).toBeGreaterThan(initialState.lastSync);
  });

  test('websocket reconnect maintains state', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for WebSocket connection
    const ws = await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Store initial state
    const initialState = await page.evaluate(() => window.appState);
    
    // Simulate connection drop by blocking WebSocket
    await page.route('**/*', route => {
      if (route.request().url().includes('ws://') || route.request().url().includes('wss://')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Wait for offline mode
    await page.waitForSelector('[data-testid="offline-mode"]', { timeout: 5000 });
    
    // Simulate local updates while offline
    await page.evaluate(() => {
      window.appState.localUpdates = (window.appState.localUpdates || 0) + 1;
    });
    
    // Restore connection
    await page.unroute('**/*');
    
    // Wait for reconnection
    await page.waitForSelector('[data-testid="ws-connected"]', { timeout: 15000 });
    
    // Verify state was preserved and synced
    const finalState = await page.evaluate(() => window.appState);
    expect(finalState.synced).toBe(true);
    expect(finalState.learnings.length).toBeGreaterThanOrEqual(initialState.learnings.length);
  });

  test('WebSocket handles message reordering', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for connection
    await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Send multiple updates in sequence
    const updates = [
      { type: 'learning_created', data: { concept: 'First' } },
      { type: 'learning_updated', data: { concept: 'First', newDetails: 'Updated' } },
      { type: 'learning_created', data: { concept: 'Second' } },
      { type: 'learning_deleted', data: { concept: 'First' } }
    ];
    
    // Trigger updates via page evaluation
    await page.evaluate((updates) => {
      updates.forEach((update, index) => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('websocket_message', {
            detail: update
          }));
        }, index * 100);
      });
    }, updates);
    
    // Wait for all updates to process
    await page.waitForTimeout(1000);
    
    // Verify final state is consistent
    const finalState = await page.evaluate(() => window.appState);
    
    // Check that 'First' was deleted and only 'Second' remains
    const hasFirst = finalState.learnings.some(l => l.concept === 'First');
    const hasSecond = finalState.learnings.some(l => l.concept === 'Second');
    
    expect(hasFirst).toBe(false);
    expect(hasSecond).toBe(true);
  });

  test('WebSocket error handling and recovery', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for initial connection
    await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Simulate WebSocket error by aborting all network
    await page.route('**/*', route => route.abort('failed'));
    
    // Verify graceful degradation
    await page.waitForSelector('[data-testid="offline-mode"]', { timeout: 5000 });
    
    // Verify UI remains functional
    const uiStable = await page.locator('[data-testid="main-interface"]');
    await expect(uiStable).toBeVisible();
    
    // Restore network
    await page.unroute('**/*');
    
    // Wait for reconnection with retry logic
    await page.waitForSelector('[data-testid="ws-connected"]', { timeout: 20000 });
    
    // Verify state sync
    const state = await page.evaluate(() => window.appState);
    expect(state.synced).toBe(true);
  });
});
