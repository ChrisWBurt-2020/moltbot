# Playwright Debugging Guide

## Quick Reference

### View Test Results
```bash
# View HTML report
npx playwright show-report

# View specific report
npx playwright show-report test-results/playwright-report/index.html
```

### Trace Viewer
```bash
# View trace for failed test
npx playwright show-trace test-results/trace.zip

# View multiple traces
for trace in test-results/traces/*.zip; do
  npx playwright show-trace "$trace"
done
```

### Video Playback
```bash
# Videos are saved on test failure
open test-results/video.webm

# Batch convert if needed
ffmpeg -i test-results/video.webm -c:v libx264 test-results/video.mp4
```

### Network Analysis
```bash
# View network logs (HAR format)
cat test-results/network.har | jq '.'

# Extract specific requests
cat test-results/network.har | jq '.log.entries[] | .request.url'
```

### Console Logs
```bash
# View console output
cat test-results/console.log
```

## Debugging Scenarios

### 1. Test Failing Intermittently

**Symptoms**: Tests pass locally but fail in CI

**Debug Steps**:
1. Check trace file for the failure
2. Look for timing issues
3. Verify network conditions
4. Check for race conditions

**Commands**:
```bash
# Run with retries to capture failure
npx playwright test --repeat-each=3 --retries=3

# Capture trace on every run
npx playwright test --trace=on
```

### 2. WebSocket Connection Issues

**Symptoms**: WebSocket tests fail, connection timeouts

**Debug Steps**:
1. Check WebSocket URL in network logs
2. Verify connection state in trace
3. Check for CORS issues
4. Review console for errors

**Commands**:
```bash
# Enable verbose logging
DEBUG=pw:api npx playwright test websocket

# Capture full trace
npx playwright test websocket --trace=on
```

### 3. State Drift Issues

**Symptoms**: UI shows different data than SSOT

**Debug Steps**:
1. Compare UI state vs database state
2. Check sync timestamps
3. Review audit trail
4. Look for missing sync events

**Debug Code** (add to test):
```javascript
// Capture current state
const uiState = await page.evaluate(() => window.appState);
const dbState = await getDbState(); // your function

console.log('UI State:', JSON.stringify(uiState, null, 2));
console.log('DB State:', JSON.stringify(dbState, null, 2));

// Compare
expect(uiState.synced).toBe(true);
expect(uiState.learnings.length).toBe(dbState.learnings.length);
```

### 4. Memory Leaks

**Symptoms**: Tests slow down over time, memory usage increases

**Debug Steps**:
1. Monitor memory during test
2. Check for event listener accumulation
3. Verify cleanup in after hooks
4. Use Chrome DevTools Protocol

**Commands**:
```bash
# Monitor memory
npx playwright test --repeat-each=10

# Take heap snapshots
DEBUG=pw:api npx playwright test
```

**Debug Code**:
```javascript
// Capture memory usage
const memory = await page.evaluate(() => ({
  usedJSHeapSize: performance.memory.usedJSHeapSize,
  totalJSHeapSize: performance.memory.totalJSHeapSize,
  jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
}));

console.log('Memory Usage:', memory);
```

### 5. Flaky UI Elements

**Symptoms**: Tests fail finding elements (timing issues)

**Debug Steps**:
1. Increase timeout
2. Add waiting strategies
3. Check element selectors
4. Review UI updates

**Debug Code**:
```javascript
// Add explicit waits
await page.waitForSelector('[data-testid="element"]', { 
  timeout: 10000,
  state: 'visible' 
});

// Debug selector
console.log(await page.locator('[data-testid="element"]').count());

// Wait for multiple conditions
await Promise.all([
  page.waitForSelector('[data-testid="element"]'),
  page.waitForSelector('[data-testid="other-element"]')
]);
```

## Common Issues & Solutions

### Issue 1: "Page context was closed" error
**Cause**: Trying to use page after it's closed

**Solution**:
```javascript
// Check if page is still open
if (page && !page.isClosed()) {
  await page.click('[data-testid="button"]');
}
```

### Issue 2: "Target closed" error
**Cause**: Browser crashed or context closed prematurely

**Solution**:
```javascript
// Increase timeout and add retry
await page.goto(url, { timeout: 30000 });
await page.waitForLoadState('networkidle');
```

### Issue 3: WebSocket not connecting
**Cause**: CORS, network issues, or server not ready

**Solution**:
```javascript
// Wait for server to be ready
await page.goto(url);
await page.waitForSelector('[data-testid="ws-connected"]', { timeout: 15000 });

// Check connection status
const wsStatus = await page.evaluate(() => window.ws?.readyState);
console.log('WS Status:', wsStatus); // Should be 1 (OPEN)
```

### Issue 4: Test data not cleaning up
**Cause**: No cleanup between test runs

**Solution**:
```javascript
// Add cleanup in beforeEach or afterEach
test.beforeEach(async () => {
  // Clean test database
  await execAsync('npm run db:reset');
});

test.afterEach(async () => {
  // Clean any created data
  await execAsync('npm run db:cleanup');
});
```

## Performance Profiling

### Measure Test Execution Time
```javascript
test('performance test', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('https://heronclient.quantumheronlabs.com');
  await page.waitForSelector('[data-testid="main-interface"]');
  
  const loadTime = Date.now() - startTime;
  console.log(`Page load: ${loadTime}ms`);
  
  expect(loadTime).toBeLessThan(3000);
});
```

### Profile Specific Actions
```javascript
// Measure individual actions
const metrics = {
  navigation: 0,
  wsConnection: 0,
  action: 0
};

// Navigation
let start = Date.now();
await page.goto(url);
metrics.navigation = Date.now() - start;

// WebSocket
start = Date.now();
await context.waitForEvent('websocket');
metrics.wsConnection = Date.now() - start;

// Action
start = Date.now();
await page.click('[data-testid="button"]');
await page.waitForSelector('[data-testid="result"]');
metrics.action = Date.now() - start;

console.log('Metrics:', metrics);
```

## Visual Debugging

### Screenshot on Failure
```javascript
test('critical path', async ({ page }) => {
  await page.goto(url);
  
  // Screenshot before action
  await page.screenshot({ path: 'screenshot-before.png' });
  
  // Perform action
  await page.click('[data-testid="button"]');
  
  // Screenshot after action
  await page.screenshot({ path: 'screenshot-after.png' });
});
```

### Visual Comparison
```javascript
// Compare screenshots
const fs = require('fs');
const pixelmatch = require('pixelmatch');

const baseline = fs.readFileSync('baseline.png');
const current = fs.readFileSync('current.png');

const diff = pixelmatch(baseline, current, null, 800, 600);
expect(diff).toBeLessThan(100); // Less than 100 pixels different
```

## CI/CD Debugging

### Run Tests Locally Like CI
```bash
# Set CI environment
CI=true npx playwright test

# Run with same retries as CI
CI=true npx playwright test --retries=2

# Run with same workers as CI
CI=true npx playwright test --workers=1
```

### Debug CI Failures
1. Download artifacts from CI
2. Open trace files locally
3. Check console logs
4. Review network logs

### Common CI Issues
1. **Service not ready**: Add health check with retry
2. **Timeout**: Increase timeouts in CI
3. **Resource limits**: Reduce workers or parallelism
4. **Network issues**: Use localhost instead of external URLs

## Advanced Debugging

### Enable Verbose Logging
```bash
DEBUG=pw:api,pw:protocol,pw:browser npx playwright test
```

### Use Browser DevTools Protocol
```javascript
const client = await page.context().newCDPSession(page);
await client.send('Network.enable');
await client.send('Network.setCacheDisabled', { cacheDisabled: true });

// Monitor network
client.on('Network.requestWillBeSent', (event) => {
  console.log('Request:', event.request.url);
});
```

### Debug Playwright Internals
```bash
# Enable internal logging
DEBUG=pw:browser,pw:connection,pw:browsercontext,pw:page npx playwright test
```

## Testing Checklist

### Before Running Tests
- [ ] Services are running
- [ ] Database is in clean state
- [ ] Test credentials available
- [ ] Environment variables set
- [ ] Dependencies installed

### During Test Run
- [ ] Monitor resource usage
- [ ] Check for flakiness
- [ ] Watch for timeouts
- [ ] Track test duration

### After Test Run
- [ ] Review test report
- [ ] Check trace files for failures
- [ ] Verify all artifacts uploaded
- [ ] Clean up test data

## Tools & Resources

### Useful Commands
```bash
# Run single test
npx playwright test test-name

# Run with specific browser
npx playwright test --project=chromium

# Run in headed mode
npx playwright test --headed

# Run with slow motion
npx playwright test --repeat-each=3 --retries=3

# Generate code
npx playwright codegen heronclient.quantumheronlabs.com
```

### View Results
- **HTML Report**: `playwright-report/index.html`
- **JUnit XML**: `test-results/junit.xml`
- **Traces**: `test-results/traces/`
- **Videos**: `test-results/videos/`
- **Screenshots**: `test-results/screenshots/`

### External Tools
- [Playwright Trace Viewer](https://trace.playwright.dev/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [WebSockets Inspector](https://www.websocket.org/echo.html)
- [Network Analyzer](https://developer.chrome.com/docs/devtools/network/)

## Best Practices

1. **Always use testIdAttribute** (`data-testid`)
2. **Add timeouts for CI** (at least 10s)
3. **Retry flaky tests** (2-3 retries)
4. **Clean up after tests**
5. **Use descriptive test names**
6. **Add console logs for debugging**
7. **Take screenshots on failure**
8. **Monitor resource usage**

## Quick Debug Commands

```bash
# Most useful for quick debugging
npx playwright test --trace=on --video=on --screenshot=on --reporter=html

# For CI-like environment
CI=true npx playwright test --workers=1 --retries=2 --trace=on

# For specific test failure
npx playwright test --grep "failing test name" --trace=on

# Generate trace viewer link
npx playwright show-trace test-results/trace.zip
```

## Getting Help

1. **Playwright Docs**: https://playwright.dev
2. **GitHub Issues**: https://github.com/microsoft/playwright/issues
3. **Stack Overflow**: Tag with `playwright`
4. **Slack Community**: https://aka.ms/playwright-slack
5. **Discord**: https://aka.ms/playwright-discord
