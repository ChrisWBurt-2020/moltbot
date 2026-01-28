#!/bin/bash
# Playwright Skill Setup Script

set -e

echo "🔧 Setting up Playwright Skill for Exocortex Testing"

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Found: $NODE_VERSION"

# Check if in correct directory
if [ ! -d "/home/debian/code/heronclient" ]; then
  echo "❌ Directory /home/debian/code/heronclient not found"
  exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
cd /home/debian/code/heronclient
npm ci

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install --with-deps

# Check Docker Compose
echo "🐳 Checking Docker Compose..."
if [ ! -f "/home/debian/testproj/docker-compose.unified.yml" ]; then
  echo "⚠️  docker-compose.unified.yml not found"
  echo "   Make sure Exocortex services are configured"
fi

# Create test directories
echo "📁 Creating test directories..."
mkdir -p /home/debian/code/heronclient/test-results
mkdir -p /home/debian/code/heronclient/playwright-report

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x /home/debian/clawd/playwright-skill/scripts/run-playwright-tests.sh

# Validate installation
echo "✅ Validating installation..."
cd /home/debian/code/heronclient
if npx playwright --version > /dev/null 2>&1; then
  echo "   Playwright installed: $(npx playwright --version)"
else
  echo "❌ Playwright installation failed"
  exit 1
fi

echo ""
echo "🎉 Playwright Skill setup complete!"
echo ""
echo "Quick Start:"
echo "  cd /home/debian/code/heronclient"
echo "  npx playwright test heronclient"
echo ""
echo "Or use Clawdbot:"
echo "  /test heronclient"
echo "  /test-all"
echo ""
echo "View results:"
echo "  npx playwright show-report"
