const { chromium } = require('@playwright/test');

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup() {
  // Set test environment variables
  process.env.TEST_ENV = process.env.CI ? 'ci' : 'local';
  process.env.TEST_PASSWORD = process.env.TEST_PASSWORD || 'test-password';
  
  console.log(`🧪 Test Environment: ${process.env.TEST_ENV}`);
  
  // Validate services are running (in CI)
  if (process.env.CI) {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Check if services are up
      await execAsync('curl -sf https://heronclient.quantumheronlabs.com/healthz');
      console.log('✅ Heronclient service is healthy');
    } catch (error) {
      console.error('❌ Heronclient service is not healthy');
      throw error;
    }
  }
}

module.exports = globalSetup;
