// Register Playwright commands
async function registerPlaywrightCommands(clawdbot) {
  clawdbot.registerCommand({
    name: 'test',
    description: 'Run Playwright tests on Exocortex',
    usage: 'test <scope> [--fault] [--report]',
    handler: async (args, context) => {
      const { scope, fault, report } = args;
      
      if (!scope) {
        return {
          error: 'Missing scope parameter',
          usage: 'test <scope>',
          availableScopes: ['heronclient', 'cross-surface', 'websocket', 'performance', 'fault-injection']
        };
      }
      
      try {
        let result;
        
        if (scope === 'heronclient') {
          result = await runHeronclientTests(fault);
        } else if (scope === 'cross-surface') {
          result = await runCrossSurfaceTests();
        } else if (scope === 'websocket') {
          result = await runWebSocketTests();
        } else if (scope === 'performance') {
          result = await runPerformanceTests();
        } else if (scope === 'fault-injection') {
          result = await runFaultInjectionTests();
        } else {
          return {
            error: 'Invalid scope',
            availableScopes: ['heronclient', 'cross-surface', 'websocket', 'performance', 'fault-injection']
          };
        }
        
        return result;
      } catch (error) {
        return {
          error: error.message,
          details: error.toString()
        };
      }
    }
  });
  
  // Generate report command
  clawdbot.registerCommand({
    name: 'test-report',
    description: 'Generate test report',
    handler: async () => {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      try {
        const { stdout } = await execAsync(
          'npx playwright show-report test-results',
          { cwd: '/home/debian/code/heronclient' }
        );
        
        return {
          success: true,
          report: 'Test report available at /home/debian/code/heronclient/playwright-report/index.html',
          details: stdout
        };
      } catch (error) {
        return {
          error: 'Failed to generate report',
          details: error.message
        };
      }
    }
  });
  
  // Run all tests command
  clawdbot.registerCommand({
    name: 'test-all',
    description: 'Run complete test suite',
    handler: async () => {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      try {
        const { stdout, stderr } = await execAsync(
          'cd /home/debian/testproj && ./scripts/run-playwright-tests.sh',
          { timeout: 600000 } // 10 minute timeout
        );
        
        return {
          passed: stdout.includes('passed') || !stdout.includes('failed'),
          details: stdout,
          traces: '/home/debian/code/heronclient/test-results',
          report: 'View report with: test-report'
        };
      } catch (error) {
        return {
          error: 'Test suite failed',
          details: error.stdout || error.message
        };
      }
    }
  });
}

// Test runner implementations
async function runHeronclientTests(faultInjection = false) {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  const command = faultInjection 
    ? 'npx playwright test heronclient --grep "fault"'
    : 'npx playwright test heronclient';
  
  const { stdout, stderr } = await execAsync(
    command,
    { 
      cwd: '/home/debian/code/heronclient',
      timeout: 300000 // 5 minute timeout
    }
  );
  
  const passed = stdout.includes('passed') && !stdout.includes('failed');
  const summary = extractTestSummary(stdout);
  
  return {
    passed,
    summary,
    details: stdout,
    traces: '/home/debian/code/heronclient/test-results',
    report: 'test-report'
  };
}

async function runCrossSurfaceTests() {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  const { stdout, stderr } = await execAsync(
    'npx playwright test cross-surface',
    { 
      cwd: '/home/debian/code/heronclient',
      timeout: 300000 // 5 minute timeout
    }
  );
  
  const passed = stdout.includes('passed') && !stdout.includes('failed');
  const summary = extractTestSummary(stdout);
  
  return {
    passed,
    summary,
    details: stdout,
    traces: '/home/debian/code/heronclient/test-results'
  };
}

async function runWebSocketTests() {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  const { stdout, stderr } = await execAsync(
    'npx playwright test websocket',
    { 
      cwd: '/home/debian/code/heronclient',
      timeout: 300000 // 5 minute timeout
    }
  );
  
  const passed = stdout.includes('passed') && !stdout.includes('failed');
  const summary = extractTestSummary(stdout);
  
  return {
    passed,
    summary,
    details: stdout,
    traces: '/home/debian/code/heronclient/test-results'
  };
}

async function runPerformanceTests() {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  const { stdout, stderr } = await execAsync(
    'npx playwright test performance',
    { 
      cwd: '/home/debian/code/heronclient',
      timeout: 300000 // 5 minute timeout
    }
  );
  
  const passed = stdout.includes('passed') && !stdout.includes('failed');
  const summary = extractTestSummary(stdout);
  
  return {
    passed,
    summary,
    details: stdout,
    traces: '/home/debian/code/heronclient/test-results'
  };
}

async function runFaultInjectionTests() {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  const { stdout, stderr } = await execAsync(
    'npx playwright test fault-injection',
    { 
      cwd: '/home/debian/code/heronclient',
      timeout: 300000 // 5 minute timeout
    }
  );
  
  const passed = stdout.includes('passed') && !stdout.includes('failed');
  const summary = extractTestSummary(stdout);
  
  return {
    passed,
    summary,
    details: stdout,
    traces: '/home/debian/code/heronclient/test-results'
  };
}

// Helper function to extract test summary from output
function extractTestSummary(output) {
  const summaryMatch = output.match(/(\d+) passed.*(\d+) failed.*(\d+) skipped/);
  if (summaryMatch) {
    return {
      passed: parseInt(summaryMatch[1]),
      failed: parseInt(summaryMatch[2]),
      skipped: parseInt(summaryMatch[3])
    };
  }
  return null;
}

module.exports = {
  registerPlaywrightCommands,
  runHeronclientTests,
  runCrossSurfaceTests,
  runWebSocketTests,
  runPerformanceTests,
  runFaultInjectionTests
};
