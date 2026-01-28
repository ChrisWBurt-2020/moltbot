# Playwright Skill Installation Guide

## Quick Install

```bash
cd /home/debian/clawd/playwright-skill
./setup.sh
```

## Manual Installation

### 1. Install Dependencies
```bash
cd /home/debian/code/heronclient
npm ci
```

### 2. Install Playwright Browsers
```bash
cd /home/debian/code/heronclient
npx playwright install --with-deps
```

### 3. Verify Installation
```bash
npx playwright --version
# Should show: Playwright vX.X.X

npx playwright test --list
# Should list all test files
```

### 4. Ensure Services Running
```bash
cd /home/debian/testproj
docker compose -f docker-compose.unified.yml up -d

# Check health
curl -sf https://heronclient.quantumheronlabs.com/healthz
```

## Test Installation

### Run Sample Test
```bash
cd /home/debian/code/heronclient
npx playwright test heronclient --headed
```

### Expected Output
```
Running 1 test using 1 worker
✓ should load web interface successfully
  - Page: https://heronclient.quantumheronlabs.com
  - Duration: 1234ms

1 passed (1.2s)
```

## Verify Clawdbot Integration

### Check Commands Are Registered
In Clawdbot:
```
/help
```

Should show:
- `/test` - Run Playwright tests
- `/test-report` - Generate test report
- `/test-all` - Run full test suite

### Test Commands
```
/test heronclient
/test websocket
/test-all
/test-report
```

## Troubleshooting

### Issue: "playwright not found"
**Solution**:
```bash
cd /home/debian/code/heronclient
npm install -g @playwright/test
npx playwright install --with-deps
```

### Issue: "Cannot connect to services"
**Solution**:
```bash
# Check services
docker ps

# Check health
curl -sf https://heronclient.quantumheronlabs.com/healthz

# Start services if down
docker compose -f /home/debian/testproj/docker-compose.unified.yml up -d
```

### Issue: "Test timeout"
**Solution**:
- Increase timeout in `playwright.config.js`
- Check service health
- Verify network connectivity

### Issue: "Permission denied"
**Solution**:
```bash
chmod +x /home/debian/clawd/playwright-skill/setup.sh
chmod +x /home/debian/clawd/playwright-skill/scripts/run-playwright-tests.sh
```

## Configuration

### Environment Variables
Set these in your environment or shell profile:

```bash
# Required
export TEST_ENV=local
export TEST_PASSWORD=test-password

# Optional
export DEBUG=pw:api  # Enable verbose logging
export CI=false      # Running locally
```

### File Permissions
Ensure scripts are executable:
```bash
chmod +x /home/debian/clawd/playwright-skill/setup.sh
chmod +x /home/debian/clawd/playwright-skill/scripts/run-playwright-tests.sh
```

## Next Steps

1. **Run your first test**:
   ```bash
   npx playwright test heronclient
   ```

2. **View test report**:
   ```bash
   npx playwright show-report
   ```

3. **Explore test scenarios**:
   - Read [TEST-SCENARIOS.md](TEST-SCENARIOS.md)
   - Review test files in `test-suites/`

4. **Configure CI/CD**:
   - Review [.github/workflows/playwright.yml](.github/workflows/playwright.yml)
   - Customize for your CI environment

## Support

### Documentation
- **Quick Start**: [README.md](README.md)
- **Test Scenarios**: [TEST-SCENARIOS.md](TEST-SCENARIOS.md)
- **Debugging**: [DEBUGGING.md](DEBUGGING.md)
- **Index**: [INDEX.md](INDEX.md)

### Common Commands
```bash
# Run tests
npx playwright test

# Debug test
npx playwright test --trace=on

# View report
npx playwright show-report

# List tests
npx playwright test --list

# Run specific test
npx playwright test test-name
```

## Success Checklist

- [ ] Node.js v18+ installed
- [ ] Playwright browsers installed
- [ ] Services running (Docker)
- [ ] Tests execute successfully
- [ ] Reports generate correctly
- [ ] Clawdbot commands work
- [ ] CI/CD workflow configured (optional)

## File Structure

```
/home/debian/clawd/playwright-skill/
├── setup.sh              # Installation script
├── README.md            # Main documentation
├── INDEX.md             # File index
├── INSTALLATION.md      # This file
├── playwright.config.js # Playwright config
├── commands.js          # Clawdbot integration
└── test-suites/         # Test files
    └── *.spec.js
```

## Version Check

```bash
# Node.js
node --version
# Should be v18 or higher

# npm
npm --version
# Should be v9 or higher

# Playwright
npx playwright --version
# Should be v1.40 or higher
```

## Clean Install (If Needed)

```bash
# Remove old installation
cd /home/debian/code/heronclient
rm -rf node_modules
rm -rf package-lock.json

# Reinstall
npm ci
npx playwright install --with-deps

# Verify
npx playwright --version
```

## Post-Installation

After successful installation:

1. **Run smoke tests**:
   ```bash
   npx playwright test heronclient
   ```

2. **Check test coverage**:
   ```bash
   npx playwright test --reporter=html
   ```

3. **Review test results**:
   - Open `playwright-report/index.html`
   - Check for any failures
   - Review trace files if needed

4. **Configure CI/CD** (if using):
   - Review GitHub Actions workflow
   - Set up secrets if needed
   - Customize triggers

## Quick Verification Script

```bash
#!/bin/bash
# Save as verify-playwright.sh

echo "🔍 Verifying Playwright Installation..."

# Check Node.js
node --version || echo "❌ Node.js not found"

# Check npm
npm --version || echo "❌ npm not found"

# Check Playwright
npx playwright --version || echo "❌ Playwright not found"

# Check services
curl -sf https://heronclient.quantumheronlabs.com/healthz > /dev/null && echo "✅ Services healthy" || echo "❌ Services not healthy"

# List tests
echo "📋 Test suites:"
npx playwright test --list 2>/dev/null | grep "spec.js" | head -5

echo "✅ Verification complete"
```

Make it executable: `chmod +x verify-playwright.sh`
