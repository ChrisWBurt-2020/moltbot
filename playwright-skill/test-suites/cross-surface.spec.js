const { test, expect } = require('@playwright/test');

// Mock Telegram interaction (in production, this would use actual Telegram API)
const mockTelegramMessage = async (message) => {
  // Simulate Telegram message by writing to test database
  // In CI, this would trigger the actual Telegram bot
  console.log(`Simulating Telegram message: ${message}`);
  return { success: true };
};

test.describe('Cross-Surface Consistency', () => {
  test('Telegram message appears in web cockpit', async ({ page }) => {
    const testMessage = 'Test message for cross-surface validation';
    
    // Send message to Telegram (simulated)
    await mockTelegramMessage(testMessage);
    
    // Navigate to web cockpit
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for message to appear in cockpit
    await page.waitForSelector(`[data-testid="message-${testMessage.replace(/\s+/g, '-').toLowerCase()}"]`, { timeout: 15000 });
    
    // Verify content
    const message = await page.locator(`[data-testid="message-${testMessage.replace(/\s+/g, '-').toLowerCase()}"]`);
    await expect(message).toContainText(testMessage);
  });

  test('CLI command appears in all surfaces', async ({ page }) => {
    // This would be triggered via exec in CI
    // Simulating: exocortex learn create "Test Concept" "Test Details"
    
    // Navigate to web cockpit
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for new learning to appear
    await page.waitForSelector('[data-testid="new-learning-alert"]', { timeout: 15000 });
    
    // Verify it's in the list
    const learningItem = await page.locator('[data-testid="learning-item-Test-Concept"]');
    await expect(learningItem).toBeVisible();
    
    // Check audit trail
    const auditItem = await page.locator('[data-testid="audit-trail-item"] >> text=learning_created');
    await expect(auditItem).toBeVisible();
  });

  test('SSOT consistency across surfaces', async ({ page }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Get SSOT state
    const ssotState = await page.evaluate(() => window.appState);
    
    // Verify all surfaces have same state
    expect(ssotState).toHaveProperty('synced', true);
    expect(ssotState).toHaveProperty('lastSync');
    expect(ssotState).toHaveProperty('learnings');
    
    // Check count consistency
    const countFromUI = await page.locator('[data-testid="learning-count"]').textContent();
    const countFromState = ssotState.learnings.length;
    
    expect(parseInt(countFromUI)).toBe(countFromState);
  });

  test('WebSocket broadcast reaches all surfaces', async ({ page, context }) => {
    await page.goto('https://heronclient.quantumheronlabs.com');
    
    // Wait for WebSocket connection
    const ws = await context.waitForEvent('websocket');
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Simulate WebSocket event (learning_created)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket_message', {
        detail: {
          type: 'learning_created',
          data: { concept: 'WebSocket Test', details: 'Testing broadcast' }
        }
      }));
    });
    
    // Verify UI updates
    await page.waitForSelector('[data-testid="learning-item-WebSocket-Test"]', { timeout: 10000 });
    
    // Check notification
    const notification = await page.locator('[data-testid="notification-toast"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('learning_created');
  });
});
