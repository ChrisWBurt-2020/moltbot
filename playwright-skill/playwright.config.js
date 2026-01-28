module.exports = {
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    testIdAttribute: 'data-testid',
    // Increase timeout for distributed system testing
    timeout: 30000,
    actionTimeout: 10000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
  
  // Test directory
  testDir: './test-suites',
  
  // Output directory
  outputDir: './test-results',
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  // Web server configuration for Exocortex
  webServer: {
    command: 'cd /home/debian/code/heronclient && npm start',
    url: 'https://heronclient.quantumheronlabs.com',
    timeout: 120000,
    reuseExistingServer: true,
    ignoreHTTPSErrors: true,
  },
  
  // Global setup for test environment
  globalSetup: './global-setup.js',
  
  // Retry configuration for flaky tests
  retries: process.env.CI ? 2 : 0,
  
  // Maximum parallel tests
  workers: process.env.CI ? 1 : 3,
  
  // Test timeout
  timeout: 30000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
  },
};
