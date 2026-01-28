# Playwright Skill - Quick Reference

## 🚀 Installation
```bash
cd /home/debian/clawd/playwright-skill
./setup.sh
```

## 🧪 Run Tests

### Via Clawdbot
```
/test heronclient
/test cross-surface
/test websocket
/test performance
/test fault-injection
/test-all
/test-report
```

### Direct Playwright
```bash
cd /home/debian/code/heronclient

# All tests
npx playwright test

# Specific suite
npx playwright test heronclient

# With debugging
npx playwright test --trace=on --video=on --screenshot=on

# View report
npx playwright show-report
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `SKILL.md` | Skill definition |
| `README.md` | Main documentation |
| `commands.js` | Clawdbot integration |
| `playwright.config.js` | Playwright config |
| `test-suites/*.spec.js` | Test files (5 suites, 26 tests) |
| `scripts/run-playwright-tests.sh` | Test runner |
| `TEST-SCENARIOS.md` | 8 test scenarios |
| `DEBUGGING.md` | Debugging guide |
| `setup.sh` | Installation script |

## 🎯 Test Suites

### 1. heronclient.spec.js (5 tests)
- Page load
- Authentication
- SSOT display
- Search
- Create learning

### 2. cross-surface.spec.js (5 tests)
- Telegram → Web
- CLI → Web
- SSOT consistency
- WebSocket broadcast
- Multi-surface sync

### 3. websocket.spec.js (5 tests)
- Connection
- Reconnect
- Message reordering
- Error recovery
- State preservation

### 4. fault-injection.spec.js (5 tests)
- Network failure
- WS disconnection
- Data corruption
- Rate limiting
- Memory leaks

### 5. performance.spec.js (6 tests)
- Page load time
- WS connect time
- Search response
- SSOT sync latency
- Concurrent load
- Memory efficiency

## 🔧 Common Commands

```bash
# Installation
./setup.sh
npm ci
npx playwright install --with-deps

# Testing
npx playwright test heronclient
npx playwright test --grep "websocket"

# Debugging
npx playwright test --trace=on
npx playwright show-trace test-results/trace.zip

# CI/CD
npx playwright test --reporter=junit,html
./scripts/run-playwright-tests.sh
```

## 📊 Success Metrics

- ✅ Page load < 3s
- ✅ WS connect < 2s
- ✅ Search < 500ms
- ✅ SSOT sync < 1s
- ✅ Pass rate > 95%
- ✅ No data loss

## 🔍 Debugging

```bash
# View report
npx playwright show-report

# Enable verbose logging
DEBUG=pw:api npx playwright test

# Capture trace
npx playwright test --trace=on

# View trace
npx playwright show-trace test-results/trace.zip
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | Complete guide |
| `TEST-SCENARIOS.md` | 8 detailed scenarios |
| `DEBUGGING.md` | Troubleshooting |
| `INSTALLATION.md` | Setup steps |
| `INDEX.md` | File index |
| `SUMMARY.md` | Project summary |

## 🎓 Test Scenarios

1. **Learning End-to-End** - Telegram → CLI → Web → DB → Review
2. **WebSocket Reconnect** - Drop → Offline → Reconnect → Sync
3. **Cross-Surface** - CLI → Telegram → Web consistency
4. **Pattern Detection** - 3 cmds → Pattern → Insight → Alert
5. **Performance** - Load, stress, memory tests
6. **Visual Regression** - Screenshot comparison
7. **Data Recovery** - Corrupt → Recover → Validate
8. **Audit Trail** - Event lifecycle tracking

## 🔄 CI/CD

### GitHub Actions
- **Trigger**: Push to main/interconnectivityupgrades, PR to main
- **Duration**: ~10 minutes
- **Artifacts**: Report, JUnit, traces, videos
- **Notifications**: Slack on failure

## ⚡ Quick Start

```bash
# 1. Install
cd /home/debian/clawd/playwright-skill
./setup.sh

# 2. Run first test
cd /home/debian/code/heronclient
npx playwright test heronclient

# 3. View results
npx playwright show-report

# 4. Use Clawdbot
/test heronclient
/test-all
```

## 📞 Support

- **Playwright Docs**: https://playwright.dev
- **Exocortex Docs**: Internal
- **GitHub Issues**: https://github.com/microsoft/playwright/issues

---

**Version**: 1.0.0 | **Status**: ✅ Ready
