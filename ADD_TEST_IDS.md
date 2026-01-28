# Adding Test IDs to Heronclient Web App

## Current State
The heronclient web app is a React Native Expo app that doesn't have the test IDs that our Playwright tests expect.

## Solution Options

### Option 1: Add testID to React Native Components (Recommended)
**Effort**: 2 hours
**Result**: Tests work with React Native testID prop

### Option 2: Update Tests to Use ARIA Roles
**Effort**: 30 minutes
**Result**: Tests work but less specific

### Option 3: Test Backend APIs Directly
**Effort**: 1 hour
**Result**: Validate backend without UI

## Implementation Plan

### Step 1: Add testID to Critical Components

**File**: `/home/debian/code/heronclient/app/App.js`

Add testID to main containers:
```javascript
// Main container
<View 
  testID="main-interface"
  accessibilityRole="main"
  accessibilityLabel="Main application"
>
```

**File**: `/home/debian/code/heronclient/app/components/CommandPalette.js`

Add testID to search input:
```javascript
<TextInput
  testID="search-bar"
  accessibilityLabel="Search bar"
  placeholder="Search..."
/>
```

**File**: `/home/debian/code/heronclient/app/components/QuickCaptureFAB.js`

Add testID to create button:
```javascript
<TouchableOpacity
  testID="create-learning-button"
  accessibilityLabel="Create learning"
>
```

### Step 2: Build and Deploy

```bash
cd /home/debian/code/heronclient/app
npm run build:web
# Deploy to https://heronclient.quantumheronlabs.com
```

### Step 3: Update Playwright Tests

**File**: `/home/debian/clawd/playwright-skill/test-suites/heronclient.spec.js`

Update selectors to use React Native testID (which maps to data-testid in web build):
```javascript
// Current (fails):
await page.waitForSelector('[data-testid="main-interface"]');

// After adding testID (works):
// React Native testID maps to data-testid in web build
```

## Testing the Tests

Once test IDs are added, run:

```bash
cd /home/debian/clawd/playwright-skill
npm test heronclient
```

## What We Can Test Right Now (Without UI Tests)

### API-Level Tests (No UI required)

**File**: `/home/debian/clawd/playwright-skill/test-suites/api.spec.js`

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Exocortex API', () => {
  test('learning API endpoint', async ({ request }) => {
    const response = await request.post(
      'http://127.0.0.1:3003/api/learnings',
      {
        data: {
          source: 'test',
          concept: 'Test Concept',
          context: 'Test context'
        }
      }
    );
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('graph API endpoint', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:3003/api/graph/full');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.nodes).toBeDefined();
    expect(data.edges).toBeDefined();
  });
});
```

### WebSocket Tests

**File**: `/home/debian/clawd/playwright-skill/test-suites/api-websocket.spec.js`

```javascript
test('WebSocket connection', async ({ page }) => {
  const wsPromise = page.waitForEvent('websocket');
  await page.goto('https://heronclient.quantumheronlabs.com/ws');
  const ws = await wsPromise;
  
  // Send test message
  await ws.send('{"type":"ping"}');
  
  // Wait for pong
  const frame = await ws.waitForEvent('framereceived');
  expect(frame.text()).toContain('pong');
});
```

## Quick Fix (Today)

**Option A**: Run API tests only (2 hours)
- Add API-level test suite
- Test backend endpoints
- No UI test IDs needed

**Option B**: Add minimal test IDs (3 hours)
- Add testID to 5-10 key components
- Rebuild web app
- Run UI tests

**Option C**: Update tests to use existing selectors (1 hour)
- Use ARIA roles instead of testID
- Less specific but works
- No app changes needed

## Recommendation

**Start with Option C** (update tests, 1 hour):
1. Update tests to use ARIA roles
2. Run tests immediately
3. Learn what breaks
4. Then add testIDs for better coverage

**Then add Option B** (test IDs, 2 hours):
1. Add testID to critical components
2. Rebuild web app
3. Run full test suite
4. Get comprehensive coverage

## Expected Results

**API Tests** (Option A):
- ✅ 8-10 tests validating backend
- ✅ Run immediately
- ✅ No app changes needed

**UI Tests** (Option B):
- ✅ 26 tests validating full system
- ✅ Requires app changes
- ✅ Better end-to-end coverage

**Total Time**: ~3-4 hours to get all tests running