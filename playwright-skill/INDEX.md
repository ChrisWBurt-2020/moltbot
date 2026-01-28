# Playwright Skill - File Index

## Quick Navigation

### Core Files
- [SKILL.md](SKILL.md) - Skill definition and capabilities
- [README.md](README.md) - Main documentation and quick start
- [package.json](package.json) - Dependencies and scripts

### Setup & Installation
- [setup.sh](setup.sh) - Installation script

### Configuration
- [playwright.config.js](playwright.config.js) - Playwright configuration
- [global-setup.js](global-setup.js) - Global test setup

### Test Suites
- [test-suites/heronclient.spec.js](test-suites/heronclient.spec.js) - Web cockpit tests
- [test-suites/cross-surface.spec.js](test-suites/cross-surface.spec.js) - Multi-surface tests
- [test-suites/websocket.spec.js](test-suites/websocket.spec.js) - WebSocket reliability tests
- [test-suites/fault-injection.spec.js](test-suites/fault-injection.spec.js) - Resilience tests
- [test-suites/performance.spec.js](test-suites/performance.spec.js) - Performance tests

### Scripts
- [scripts/run-playwright-tests.sh](scripts/run-playwright-tests.sh) - Test runner script

### Integration
- [commands.js](commands.js) - Clawdbot command integration

### CI/CD
- [.github/workflows/playwright.yml](.github/workflows/playwright.yml) - GitHub Actions workflow

### Documentation
- [TEST-SCENARIOS.md](TEST-SCENARIOS.md) - Comprehensive test scenarios
- [DEBUGGING.md](DEBUGGING.md) - Debugging guide

## File Purposes

### 🎯 Skill Definition
- **SKILL.md** - Defines the skill for Clawdbot

### 📚 Documentation
- **README.md** - Complete guide, usage, commands
- **TEST-SCENARIOS.md** - 8 detailed test scenarios
- **DEBUGGING.md** - Troubleshooting and debugging

### ⚙️ Configuration
- **playwright.config.js** - Browser, timeout, reporter settings
- **global-setup.js** - Test environment setup
- **commands.js** - Clawdbot integration commands

### 🧪 Tests
- **heronclient.spec.js** - 5 web cockpit tests
- **cross-surface.spec.js** - 5 cross-surface tests
- **websocket.spec.js** - 5 WebSocket tests
- **fault-injection.spec.js** - 5 fault injection tests
- **performance.spec.js** - 6 performance tests

### 🚀 Scripts
- **setup.sh** - Automated installation
- **run-playwright-tests.sh** - Test runner with health checks

### 🔄 CI/CD
- **playwright.yml** - GitHub Actions workflow
- Runs on push to main/interconnectivityupgrades
- Uploads artifacts and reports

## Test Coverage

| Suite | Tests | Purpose |
|-------|-------|---------|
| heronclient | 5 | Web cockpit functionality |
| cross-surface | 5 | Multi-surface consistency |
| websocket | 5 | WebSocket reliability |
| fault-injection | 5 | Resilience & recovery |
| performance | 6 | Speed & stability |
| **Total** | **26** | **Comprehensive coverage** |

## Command Reference

### Clawdbot Commands
```bash
/test heronclient           # Run web cockpit tests
/test cross-surface         # Run cross-surface tests
/test websocket             # Run WebSocket tests
/test performance           # Run performance tests
/test fault-injection       # Run fault injection tests
/test-all                   # Run full suite
/test-report                # Generate report
```

### CLI Commands
```bash
# Direct Playwright usage
cd /home/debian/code/heronclient
npx playwright test                    # Run all tests
npx playwright test heronclient        # Run specific suite
npx playwright show-report             # View HTML report

# With options
npx playwright test --trace=on         # Enable tracing
npx playwright test --headed           # Run in headed mode
npx playwright test --repeat-each=3    # Repeat for flakiness
```

### Setup Commands
```bash
# Automated setup
cd /home/debian/clawd/playwright-skill
./setup.sh

# Manual setup
cd /home/debian/code/heronclient
npm ci
npx playwright install --with-deps
```

## Test Scenarios (Quick Reference)

1. **Learning System End-to-End** - Telegram → CLI → Web → Database
2. **WebSocket Reconnect** - Connection drop → Recovery → Sync
3. **Cross-Surface Consistency** - Data consistency across surfaces
4. **Pattern Detection** - 3 commands → Pattern → Insight → Alert
5. **Performance Under Load** - Concurrent users, high event rate
6. **Visual Regression** - Screenshot comparison
7. **Data Recovery** - Corruption → Recovery → Validation
8. **Audit Trail** - Complete event lifecycle

See [TEST-SCENARIOS.md](TEST-SCENARIOS.md) for details.

## Debugging (Quick Reference)

### View Results
```bash
npx playwright show-report
```

### Debug Test
```bash
npx playwright test --trace=on --video=on --screenshot=on
```

### View Trace
```bash
npx playwright show-trace test-results/trace.zip
```

### Enable Logging
```bash
DEBUG=pw:api npx playwright test
```

See [DEBUGGING.md](DEBUGGING.md) for complete guide.

## CI/CD

### GitHub Actions Workflow
- **Trigger**: Push to main/interconnectivityupgrades, PR to main
- **Duration**: ~10 minutes
- **Artifacts**: Report, JUnit XML, Traces, Videos
- **Notifications**: Slack on failure

### Workflow Steps
1. Checkout code
2. Setup Node.js (v20)
3. Install dependencies
4. Start Docker services
5. Run tests
6. Upload artifacts
7. Publish report
8. Notify on failure

## Success Criteria

✅ **Test Suite Structure** - Organized by capability
✅ **Cross-Surface Tests** - All surfaces covered
✅ **Fault Injection** - Network/WS failures tested
✅ **Performance Tests** - Speed metrics tracked
✅ **CI/CD Integration** - GitHub Actions configured
✅ **Reporting** - HTML, JUnit, traces, videos
✅ **Documentation** - Complete guides included

## File Tree

```
playwright-skill/
├── SKILL.md                    # Skill definition
├── README.md                   # Main documentation
├── INDEX.md                    # This file
├── TEST-SCENARIOS.md          # Test scenarios
├── DEBUGGING.md               # Debugging guide
├── package.json               # Dependencies
├── setup.sh                   # Installation script
├── playwright.config.js       # Playwright config
├── global-setup.js            # Global setup
├── commands.js                # Clawdbot integration
│
├── test-suites/
│   ├── heronclient.spec.js
│   ├── cross-surface.spec.js
│   ├── websocket.spec.js
│   ├── fault-injection.spec.js
│   └── performance.spec.js
│
├── scripts/
│   └── run-playwright-tests.sh
│
└── .github/workflows/
    └── playwright.yml
```

## First Time Setup

1. **Run setup script**:
   ```bash
   cd /home/debian/clawd/playwright-skill
   ./setup.sh
   ```

2. **Verify installation**:
   ```bash
   cd /home/debian/code/heronclient
   npx playwright --version
   ```

3. **Run first test**:
   ```bash
   npx playwright test heronclient
   ```

4. **View report**:
   ```bash
   npx playwright show-report
   ```

## Common Workflows

### Development Workflow
```bash
# 1. Write test in test-suites/
# 2. Run test
npx playwright test heronclient

# 3. Debug if needed
npx playwright test heronclient --trace=on

# 4. View results
npx playwright show-report
```

### CI/CD Workflow
```bash
# 1. Push to main
git push origin main

# 2. GitHub Actions runs
# 3. Check Actions tab
# 4. Download artifacts if needed
```

### Production Validation
```bash
# 1. Run full suite
./scripts/run-playwright-tests.sh

# 2. Check report
npx playwright show-report

# 3. Review failures
cat test-results/junit.xml
```

## Support & Resources

- **Playwright Docs**: https://playwright.dev
- **Test Scenarios**: [TEST-SCENARIOS.md](TEST-SCENARIOS.md)
- **Debugging**: [DEBUGGING.md](DEBUGGING.md)
- **Main Docs**: [README.md](README.md)

## Version

**1.0.0** - Initial Release
- 5 test suites
- 26 test cases
- Full CI/CD integration
- Complete documentation
