#!/bin/bash
# Run Playwright tests for Exocortex

set -e

echo "🚀 Starting Playwright Test Suite"

# Ensure services are running
docker compose -f /home/debian/testproj/docker-compose.unified.yml up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🔍 Checking service health..."
curl -sf https://heronclient.quantumheronlabs.com/healthz > /dev/null || {
  echo "❌ heronclient not healthy"
  exit 1
}

echo "✅ Services are healthy"

# Run tests
echo "🧪 Running tests..."
cd /home/debian/code/heronclient

# Test types
TESTS=("$@")
if [ ${#TESTS[@]} -eq 0 ]; then
  TESTS=("heronclient" "cross-surface" "websocket" "performance" "fault-injection")
fi

# Track overall success
OVERALL_SUCCESS=true

for test in "${TESTS[@]}"; do
  echo "▶️  Running: $test"
  
  # Run test and capture exit code
  if npx playwright test "$test" --reporter=html,junit; then
    echo "✅ $test passed"
  else
    echo "❌ $test failed"
    OVERALL_SUCCESS=false
  fi
done

# Generate report
echo "📊 Generating report..."
if [ -d "test-results" ]; then
  npx playwright show-report test-results || true
fi

# Print summary
echo ""
if [ "$OVERALL_SUCCESS" = true ]; then
  echo "✅ Test suite complete - ALL TESTS PASSED"
  exit 0
else
  echo "⚠️  Test suite complete - SOME TESTS FAILED"
  exit 1
fi
