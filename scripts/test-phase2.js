#!/usr/bin/env node

/**
 * Phase 2 Test Script
 * Tests real-time pattern detection functionality
 */

const http = require('http');
const { exec } = require('child_process');

console.log('🧪 Testing Phase 2: Real-time Pattern Detection\n');

// Test 1: Command Frequency Tracker
async function testCommandTracker() {
  console.log('1. Testing Command Frequency Tracker...');
  try {
    const { tracker } = require('/home/debian/testproj/mcp-servers/cli-router/commandTracker.js');
    
    // Test tracking
    await tracker.track('curl', ['--version'], 0, 'curl 7.88.1');
    await tracker.track('curl', ['--version'], 0, 'curl 7.88.1');
    await tracker.track('curl', ['--version'], 0, 'curl 7.88.1');
    
    const stats = tracker.getStats();
    console.log(`   ✓ Tracked ${stats.totalCommands} commands`);
    console.log(`   ✓ Total executions: ${stats.totalExecutions}`);
    console.log(`   ✓ Patterns detected: ${stats.patternsDetected}`);
    
    return true;
  } catch (err) {
    console.log(`   ✗ Error: ${err.message}`);
    return false;
  }
}

// Test 2: Database Connection
async function testDatabase() {
  console.log('\n2. Testing Database Connection...');
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: '127.0.0.1',
      port: 5432,
      database: 'exocortex',
      user: 'exocortex_app',
      password: 'Exo@3Pass@3'
    });

    const result = await pool.query('SELECT NOW() as now');
    console.log(`   ✓ Database connected: ${result.rows[0].now}`);
    
    // Check for new tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'core' 
      AND table_name IN ('patterns', 'cli_frequency')
    `);
    
    console.log(`   ✓ Tables created: ${tables.rows.map(r => r.table_name).join(', ')}`);
    
    await pool.end();
    return true;
  } catch (err) {
    console.log(`   ✗ Error: ${err.message}`);
    return false;
  }
}

// Test 3: API Endpoints
async function testAPIEndpoints() {
  console.log('\n3. Testing API Endpoints...');
  
  const endpoints = [
    { method: 'GET', path: '/api/patterns/realtime', name: 'Real-time patterns' },
    { method: 'GET', path: '/api/patterns/opportunities', name: 'Learning opportunities' },
    { method: 'GET', path: '/api/patterns/velocity', name: 'Learning velocity' }
  ];
  
  const baseUrl = 'http://localhost:3005';
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint.path}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✓ ${endpoint.name}: ${data.ok ? 'OK' : 'Error'} (${data.total || 0} items)`);
      } else {
        console.log(`   ✗ ${endpoint.name}: HTTP ${response.status}`);
        allPassed = false;
      }
    } catch (err) {
      console.log(`   ✗ ${endpoint.name}: ${err.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test 4: Activity Monitor
async function testActivityMonitor() {
  console.log('\n4. Testing Activity Monitor...');
  try {
    const { ActivityMonitor } = require('/home/debian/clawd/scripts/activity-monitor.js');
    const monitor = new ActivityMonitor();
    
    await monitor.checkForPatterns();
    console.log('   ✓ Pattern check completed');
    
    return true;
  } catch (err) {
    console.log(`   ✗ Error: ${err.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  const results = {
    commandTracker: false,
    database: false,
    apiEndpoints: false,
    activityMonitor: false
  };
  
  results.commandTracker = await testCommandTracker();
  results.database = await testDatabase();
  results.apiEndpoints = await testAPIEndpoints();
  results.activityMonitor = await testActivityMonitor();
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS');
  console.log('='.repeat(50));
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  
  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
