# Playwright Skill for Exocortex Testing

A comprehensive Playwright-based testing framework for the Exocortex distributed operator system.

## Overview

Exocortex is a distributed system with multiple surfaces:
- **Telegram Bot** - Mobile-first messaging interface
- **React Native App** - Native mobile experience
- **Expo Web** - Progressive web application
- **ae_path PWA** - Progressive web app for path-based navigation
- **Web Cockpit** - Desktop admin interface

This Playwright skill validates that all surfaces work together correctly, maintaining state consistency across the distributed system.

## Why Playwright?

### The Problem
Exocortex faces distributed system challenges:
- Multiple surfaces with different state transports
- Eventual consistency requirements
- Cross-surface race conditions
- WebSocket reliability issues
- State drift between surfaces

### The Solution
Playwright provides:
- **Real Browser Testing** - Tests actual user interactions
- **WebSocket Testing** - Validates real-time connections
- **Network Interception** - Simulates failures and recovery
- **Multi-Browser Support** - Chromium, Firefox, WebKit
- **Tracing & Video** - Debug hard-to-reproduce issues
- **Cross-Surface Validation** - Ensure consistency

## Architecture

```
Playwright Skill/
├── SKILL.md                    # Skill definition
├── README.md                   # This file
├── TEST-SCENARIOS.md          # Comprehensive test scenarios
├── DEBUGGING.md               # Debugging guide
├── playwright.config.js       # Playwright configuration
├── global-setup.js            # Global test setup
├── commands.js                # Clawdbot integration
├── test-suites/               # Test files
│   ├── heronclient.spec.js
│   ├── cross-surface.spec.js
│   ├── websocket.spec.js
│   ├── fault-injection.spec.js
│   └── performance.spec.js
├── scripts/                   # Helper scripts
│   └── run-playwright-tests.sh
└── .github/workflows/         # CI/CD configuration
    └── playwright.yml
```

## Quick Start

### Prerequisites
```bash
# Install dependencies
cd /home/debian/code/heronclient
npm ci
npx playwright install --with-deps

# Ensure services running
docker compose -f /home/debian/testproj/docker-compose.unified.yml up -d
```

### Run Tests
```bash
# Run all tests
cd /home/debian/testproj
./scripts/run-playwright-tests.sh

# Run specific test suite
cd /home/debian/code/heronclient
npx playwright test heronclient
npx playwright test cross-surface
npx playwright test websocket
npx playwright test performance
npx playwright test fault-injection

# Run with specific browser
npx playwright test heronclient --project=chromium
```

### View Results
```bash
# View HTML report
npx playwright show-report

# View specific report
npx playwright show-report test-results/playwright-report/index.html
```

## Test Suites

### 1. Heronclient Tests (`heronclient.spec.js`)
Tests the web cockpit interface:
- Page load performance
- User authentication
- SSOT data display
- Search functionality
- Learning creation

**Run with:**
```bash
npx playwright test heronclient
```

### 2. Cross-Surface Consistency (`cross-surface.spec.js`)
Validates data consistency across surfaces:
- Telegram → Web cockpit sync
- CLI → Web cockpit sync
- SSOT consistency checks
- WebSocket broadcast validation

**Run with:**
```bash
npx playwright test cross-surface
```

### 3. WebSocket Reliability (`websocket.spec.js`)
Tests WebSocket connection management:
- Connection establishment
- State preservation on reconnect
- Message reordering handling
- Error recovery

**Run with:**
```bash
npx playwright test websocket
```

### 4. Fault Injection (`fault-injection.spec.js`)
Simulates failures and validates recovery:
- Network failure handling
- WebSocket disconnection
- Data corruption recovery
- Rate limiting
- Memory leak prevention

**Run with:**
```bash
npx playwright test fault-injection
```

### 5. Performance (`performance.spec.js`)
Measures system performance:
- Page load times
- WebSocket connection speed
- Search response times
- SSOT sync latency
- Concurrent user load
- Memory efficiency

**Run with:**
```bash
npx playwright test performance
```

## Clawdbot Integration

### Commands
The Playwright skill integrates with Clawdbot via custom commands:

```bash
# Run tests by scope
/test heronclient
/test cross-surface
/test websocket
/test performance
/test fault-injection

# Run with fault injection
/test heronclient --fault

# Run full test suite
/test-all

# Generate test report
/test-report
```

### Example Usage
```
/test heronclient
# → Runs heronclient tests
# → Returns pass/fail status
# → Shows test summary
```

```
/test websocket --fault
# → Runs WebSocket tests with fault injection
# → Tests network failure scenarios
# → Validates recovery logic
```

```
/test-all
# → Runs complete test suite
# → Generates report
# → Returns overall status
```

## CI/CD Integration

### GitHub Actions
The Playwright workflow runs on:
- Push to `main` or `interconnectivityupgrades`
- Pull requests to `main`
- Manual workflow dispatch

### Workflow Steps
1. Checkout code
2. Setup Node.js (v20)
3. Install dependencies
4. Start services (Docker)
5. Wait for services
6. Run tests
7. Upload artifacts
8. Publish test report
9. Notify on failure

### Artifacts
- **Playwright Report** - HTML test results
- **JUnit Results** - XML for CI integration
- **Traces** - Debug traces on failure
- **Videos** - Test videos on failure

## Test Scenarios

### Critical Paths
1. **Learning System End-to-End**
   - Send Telegram message → Create learning → Verify in SSOT → Check Ae_path → Track review

2. **WebSocket Reconnect**
   - Connect → Drop connection → Send offline → Reconnect → Verify state sync

3. **Cross-Surface Consistency**
   - Create via CLI → Verify in Telegram → Check web → Validate database → Audit trail

4. **Pattern Detection**
   - Execute 3 commands → Wait 5 min → Verify pattern → Check insight → Telegram alert

### See [TEST-SCENARIOS.md](./TEST-SCENARIOS.md) for full scenarios

## Debugging

### Quick Debug Commands
```bash
# Run with full tracing
npx playwright test --trace=on --video=on --screenshot=on

# Run specific failing test
npx playwright test --grep "failing test name" --trace=on

# View trace
npx playwright show-trace test-results/trace.zip

# Enable verbose logging
DEBUG=pw:api npx playwright test
```

### Debugging Guide
See [DEBUGGING.md](./DEBUGGING.md) for:
- Common issues and solutions
- Performance profiling
- CI/CD debugging
- Advanced debugging techniques

## Configuration

### Playwright Config
- **Browser**: Chromium, Firefox, WebKit
- **Headless**: Yes (CI) / No (local)
- **Timeouts**: 30s test, 10s action
- **Tracing**: On first retry
- **Video**: Retain on failure
- **Screenshot**: Only on failure
- **Retries**: 2 (CI), 0 (local)
- **Workers**: 1 (CI), 3 (local)

### Environment Variables
```bash
# Required
TEST_ENV=ci|local
TEST_PASSWORD=test-password

# Optional
CI=true
DEBUG=pw:api
```

## Success Criteria

✅ **Test Suite Structure**
- Organized by capability
- Clear test descriptions
- Proper test isolation

✅ **Cross-Surface Tests**
- Telegram, web, mobile covered
- Data consistency validated
- Event ordering verified

✅ **Fault Injection**
- Network failures tested
- WebSocket disconnections
- Data corruption scenarios

✅ **Performance Tests**
- Page load < 3s
- WebSocket connect < 2s
- Search < 500ms
- SSOT sync < 1s

✅ **CI/CD Integration**
- GitHub Actions workflow
- Artifact uploads
- JUnit reporting
- Slack notifications

✅ **Reporting**
- HTML test report
- JUnit XML output
- Trace viewer
- Video playback

## Test Scenarios

### Scenario 1: Learning System End-to-End
1. Send Telegram message with "/learn"
2. Verify learning created in core.learnings
3. Check Ae_path dashboard shows learning
4. Trigger review prompt
5. Verify review tracked

### Scenario 2: WebSocket Reconnect with State Sync
1. Connect to WebSocket
2. Simulate connection drop
3. Send messages during offline
4. Reconnect and verify sync
5. Check no data loss

### Scenario 3: Cross-Surface Consistency
1. Create learning via CLI
2. Verify appears in Telegram bot
3. Verify appears in Ae_path
4. Verify in SSOT database
5. Check audit trail complete

### Scenario 4: Pattern Detection Flow
1. Execute CLI command 3 times
2. Wait for pattern detection (5 min)
3. Verify pattern created
4. Check insight generated
5. Verify Telegram alert sent

## Time Estimate

- **Framework Setup**: 60 minutes
- **Core Tests**: 90 minutes
- **Cross-Surface Tests**: 60 minutes
- **Fault Injection**: 45 minutes
- **CI/CD Integration**: 30 minutes
- **Documentation**: 30 minutes
- **Testing**: 30 minutes

**Total**: ~6 hours

## Why This Skill Matters

### For Exocortex
- Prevents cross-surface regressions
- Validates distributed system consistency
- Provides debug traces for hard bugs
- Maintains audit trail of test runs
- Enables safe rapid development

### For Developers
- Confidence when adding new features
- Early detection of state drift
- Replayable bug scenarios
- Performance baseline tracking
- Automated validation before deploy

## Quick Commands Reference

```bash
# Run tests
cd /home/debian/code/heronclient
npx playwright test <suite>

# View results
npx playwright show-report

# Debug test
npx playwright test <test-name> --trace=on

# Run all
cd /home/debian/testproj
./scripts/run-playwright-tests.sh

# With Clawdbot
/test heronclient
/test-all
/test-report
```

## Maintenance

### Updating Tests
1. Add new tests to `test-suites/`
2. Update configuration if needed
3. Run tests locally
4. Commit changes

### Adding New Scenarios
1. Document in `TEST-SCENARIOS.md`
2. Create test file
3. Add to `playwright.config.js`
4. Update command handler

### Troubleshooting
1. Check service health
2. Verify test credentials
3. Review trace files
4. Check CI logs

## Contributing

1. Follow naming conventions
2. Add descriptive comments
3. Keep tests isolated
4. Update documentation
5. Test before commit

## License

Internal Exocortex testing framework.

## Support

For issues or questions:
- Check [DEBUGGING.md](./DEBUGGING.md)
- Review [TEST-SCENARIOS.md](./TEST-SCENARIOS.md)
- Check Playwright docs: https://playwright.dev
- Contact development team
