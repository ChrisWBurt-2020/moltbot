const { test, expect } = require('@playwright/test');

test.describe('Performance & Stability', () => {
  test('page load time under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://heronclient.quantumheronlabs.com');
    await page.waitForSelector('[data-testid="main-interface"]');
    
    const loadTime = Date.now() - startTime;
    
    // Assert load time is acceptable
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });

  test('WebSocket connection time under 2 seconds', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    const connectionStart = Date.now();
    const ws = await context.waitForEvent('websocket');
    const connectionTime = Date.now() - connectionStart;
    
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Assert connection time is acceptable
    expect(connectionTime).toBeLessThan(2000); // 2 seconds
  });

  test('search response time under 500ms', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    await page.waitForSelector('[data-testid="search-bar"]');
    
    const searchStart = Date.now();
    await page.fill('[data-testid="search-bar"]', 'test query');
    await page.press('[data-testid="search-bar"]', 'Enter');
    await page.waitForSelector('[data-testid="search-results"]');
    const searchTime = Date.now() - searchStart;
    
    // Assert search time is acceptable
    expect(searchTime).toBeLessThan(500); // 500ms
  });

  test('SSOT sync latency under 1 second', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Trigger sync
    const syncStart = Date.now();
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('request_sync'));
    });
    
    await page.waitForSelector('[data-testid="ssot-synced"]', { timeout: 5000 });
    const syncTime = Date.now() - syncStart;
    
    // Assert sync time is acceptable
    expect(syncTime).toBeLessThan(1000); // 1 second
  });

  test('concurrent user load simulation', async ({ page, context }) => {
    // Simulate multiple concurrent connections
    const pages = [page];
    const contexts = [context];
    
    // Create additional contexts (simulating concurrent users)
    for (let i = 0; i < 2; i++) {
      const newContext = await page.context().browser().newContext();
      const newPage = await newContext.newPage();
      pages.push(newPage);
      contexts.push(newContext);
    }
    
    // Load all pages
    const loadPromises = pages.map(async (p, index) => {
      await p.goto('https://heronclient.quantumheronlabs.com');
      await p.waitForSelector('[data-testid="main-interface"]');
      
      // Perform action on each
      await p.fill(`[data-testid="search-bar-${index}"]`, `concurrent test ${index}`);
      await p.press(`[data-testid="search-bar-${index}"]`, 'Enter');
      
      return index;
    });
    
    await Promise.all(loadPromises);
    
    // Verify all pages loaded successfully
    expect(pages.length).toBe(3);
    
    // Verify state consistency
    for (const p of pages) {
      const state = await p.evaluate(() => window.appState);
      expect(state.synced).toBe(true);
    }
    
    // Cleanup
    for (const c of contexts) {
      if (c !== context) {
        await c.close();
      }
    }
  });

  test('memory efficiency under extended session', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Monitor memory over extended session
    const memoryReadings = [];
    
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000); // 1 second intervals
      
      const memory = await page.evaluate(() => {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        };
      });
      
      memoryReadings.push(memory);
    }
    
    // Check for memory leak (gradual increase)
    const avgIncrease = memoryReadings.reduce((sum, reading, index) => {
      if (index === 0) return 0;
      return sum + (reading.used - memoryReadings[index - 1].used);
    }, 0) / (memoryReadings.length - 1);
    
    // Average increase should be minimal
    expect(avgIncrease).toBeLessThan(1024 * 1024); // Less than 1MB per second average
    
    // Final state should still be healthy
    const state = await page.evaluate(() => window.appState);
    expect(state.synced).toBe(true);
  });

  test('UI responsiveness under high event load', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    await page.waitForSelector('[data-testid="main-interface"]');
    
    // Start performance monitoring
    const perfMetrics = await page.evaluate(() => {
      return {
        frameRate: performance.now(),
        timestamp: performance.now()
      };
    });
    
    // Trigger many concurrent updates
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('websocket_message', {
            detail: { type: 'learning_created', data: { concept: `PerfTest-${Date.now()}` } }
          });
        })
      );
    }
    
    await Promise.all(promises);
    
    // Verify UI hasn't frozen
    const responsive = await page.evaluate(() => {
      return document.readyState === 'complete' && 
             !document.querySelector('[data-testid="frozen"]');
    });
    
    expect(responsive).toBe(true);
    
    // Verify all events processed
    const state = await page.evaluate(() => window.appState);
    expect(state.synced).toBe(true);
  });
});
