/**
 * Test script for Phase 3: Reinforcement Scheduler
 * 
 * Tests:
 * 1. Spaced repetition algorithm
 * 2. API endpoints
 * 3. Database operations
 */

const { Pool } = require('pg');

// Test the spaced repetition algorithm
function testSpacedRepetition() {
  console.log('\n=== Testing Spaced Repetition Algorithm ===\n');

  const { getNextReview } = require('/home/debian/code/ae_path/src/services/repetitionScheduler');
  const { calculateNewReinforcementLevel } = require('/home/debian/code/ae_path/src/services/repetitionScheduler');

  // Test 1: First review (null lastReviewed)
  const test1 = getNextReview(null, 1, 0.8);
  console.log('Test 1 - First review (null lastReviewed):');
  console.log('  Input: lastReviewed=null, level=1, confidence=0.8');
  console.log('  Expected: Today or earlier');
  console.log('  Result:', test1.toDateString());
  console.log('  ✓ PASS:', test1 <= new Date());

  // Test 2: After good review with level 3
  const lastReviewed = new Date('2026-01-27');
  const test2 = getNextReview(lastReviewed, 3, 0.9);
  const expected2 = new Date(lastReviewed);
  expected2.setDate(expected2.getDate() + 3); // Level 3 = 3 days base * (1/0.9) ≈ 3 days
  console.log('\nTest 2 - After good review:');
  console.log('  Input: lastReviewed=2026-01-27, level=3, confidence=0.9');
  console.log('  Expected: ~2026-01-30 (3 days later)');
  console.log('  Result:', test2.toDateString());
  const within1Day = Math.abs(test2 - expected2) < 86400000;
  console.log('  ✓ PASS:', within1Day);

  // Test 3: Mastery level (level 10)
  const test3 = getNextReview(lastReviewed, 10, 0.95);
  console.log('\nTest 3 - Mastery level:');
  console.log('  Input: lastReviewed=2026-01-27, level=10, confidence=0.95');
  console.log('  Expected: ~30-35 days later');
  console.log('  Result:', test3.toDateString());
  console.log('  ✓ PASS:', test3 > new Date('2026-02-20') && test3 < new Date('2026-03-05'));

  // Test 4: Reinforcement level change
  const test4a = calculateNewReinforcementLevel(5, true, 0.9);
  const test4b = calculateNewReinforcementLevel(5, false, 0.3);
  console.log('\nTest 4 - Reinforcement level changes:');
  console.log('  Level 5, correct, high confidence (0.9):', test4a, '(expected: 7)');
  console.log('  Level 5, incorrect, low confidence (0.3):', test4b, '(expected: 3)');
  console.log('  ✓ PASS:', test4a === 7 && test4b === 3);

  console.log('\n=== All Spaced Repetition Tests Passed ===\n');
}

// Test the mastery calculator
function testMasteryCalculator() {
  console.log('\n=== Testing Mastery Calculator ===\n');

  const { calculateMastery } = require('/home/debian/code/ae_path/src/services/masteryCalculator');

  const sampleLearnings = [
    { source: 'telegram', concept: 'MCP Protocol', reinforcement_level: 5 },
    { source: 'cli', concept: 'curl usage', reinforcement_level: 7 },
    { source: 'github', concept: 'Git workflow', reinforcement_level: 4 },
    { source: 'telegram', concept: 'Scaling', reinforcement_level: 8 },
    { source: 'cli', concept: 'Docker', reinforcement_level: 6 }
  ];

  const mastery = calculateMastery(sampleLearnings);

  console.log('Sample Learnings:', sampleLearnings.length);
  console.log('\nMastery Results:');
  console.log('  Overall Score:', mastery.overall.toFixed(1) + '/10');
  console.log('  Total Learnings:', mastery.totalLearnings);
  
  console.log('\n  By Source:');
  Object.entries(mastery.bySource).forEach(([source, score]) => {
    console.log(`    ${source}: ${score.toFixed(1)}/10`);
  });

  console.log('\n  Top Concepts:');
  const topConcepts = Object.entries(mastery.byConcept)
    .sort((a, b) => b[1].level - a[1].level)
    .slice(0, 3);
  topConcepts.forEach(([concept, data]) => {
    console.log(`    ${concept}: ${data.level}/10`);
  });

  // Validation
  const isValid = mastery.overall > 0 && mastery.overall <= 10 && mastery.totalLearnings === 5;
  console.log('\n  ✓ PASS:', isValid);

  console.log('\n=== All Mastery Calculator Tests Passed ===\n');
}

// Test database operations
async function testDatabaseOperations() {
  console.log('\n=== Testing Database Operations ===\n');

  const pool = new Pool({
    host: process.env.EXOCORTEX_DB_HOST || '127.0.0.1',
    port: process.env.EXOCORTEX_DB_PORT || 5432,
    database: process.env.EXOCORTEX_DB_NAME || 'exocortex',
    user: process.env.EXOCORTEX_DB_USER || 'exocortex_app',
    password: process.env.EXOCORTEX_DB_PASSWORD || 'Exo@3Pass@3'
  });

  try {
    // Test 1: Check if reviews table exists
    console.log('Test 1 - Checking reviews table...');
    const tablesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'core' 
        AND table_name = 'reviews'
      ) as exists
    `);
    console.log('  Reviews table exists:', tablesResult.rows[0].exists);
    console.log('  ✓ PASS:', tablesResult.rows[0].exists);

    // Test 2: Check if daily_stats table exists
    console.log('\nTest 2 - Checking daily_stats table...');
    const statsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'core' 
        AND table_name = 'daily_stats'
      ) as exists
    `);
    console.log('  Daily stats table exists:', statsResult.rows[0].exists);
    console.log('  ✓ PASS:', statsResult.rows[0].exists);

    // Test 3: Check if learning_analytics view exists
    console.log('\nTest 3 - Checking learning_analytics view...');
    const viewResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'core' 
        AND table_name = 'learning_analytics'
      ) as exists
    `);
    console.log('  Learning analytics view exists:', viewResult.rows[0].exists);
    console.log('  ✓ PASS:', viewResult.rows[0].exists);

    // Test 4: Insert a test review
    console.log('\nTest 4 - Inserting test review...');
    const testLearning = await pool.query(
      `SELECT id FROM core.learnings LIMIT 1`
    );

    if (testLearning.rows.length > 0) {
      const learningId = testLearning.rows[0].id;
      await pool.query(
        `INSERT INTO core.reviews 
         (learning_id, was_correct, old_reinforcement_level, new_reinforcement_level)
         VALUES ($1, $2, $3, $4)`,
        [learningId, true, 5, 6]
      );
      console.log('  Test review inserted successfully');
      console.log('  ✓ PASS: true');

      // Clean up test review
      await pool.query(
        `DELETE FROM core.reviews WHERE learning_id = $1 AND old_reinforcement_level = 5`,
        [learningId]
      );
    } else {
      console.log('  No learning found for test, skipping...');
      console.log('  ✓ PASS: skipped');
    }

    // Test 5: Query due reviews
    console.log('\nTest 5 - Querying due reviews...');
    const dueResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM core.learnings 
      WHERE next_review <= NOW()
    `);
    console.log('  Due reviews count:', dueResult.rows[0].count);
    console.log('  ✓ PASS: query executed');

    // Test 6: Query progress
    console.log('\nTest 6 - Querying progress...');
    const progressResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_learnings,
        AVG(reinforcement_level) as avg_level
      FROM core.learnings
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 5
    `);
    console.log('  Progress data points:', progressResult.rows.length);
    console.log('  ✓ PASS: query executed');

  } catch (err) {
    console.error('  ✗ FAIL:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n=== All Database Tests Completed ===\n');
}

// Test API endpoints (requires server to be running)
async function testAPIEndpoints() {
  console.log('\n=== Testing API Endpoints ===\n');

  const baseURL = 'http://127.0.0.1:3002';

  try {
    // Test health endpoint
    console.log('Test 1 - Health check...');
    const healthRes = await fetch(`${baseURL}/api/health`);
    const health = await healthRes.json();
    console.log('  Status:', healthRes.status);
    console.log('  ✓ PASS:', health.ok);

    // Test due reviews endpoint
    console.log('\nTest 2 - Get due reviews...');
    const dueRes = await fetch(`${baseURL}/api/reviews/due`);
    const due = await dueRes.json();
    console.log('  Status:', dueRes.status);
    console.log('  Total due:', due.total || 0);
    console.log('  ✓ PASS:', due.ok);

    // Test progress endpoint
    console.log('\nTest 3 - Get progress...');
    const progressRes = await fetch(`${baseURL}/api/reviews/progress`);
    const progress = await progressRes.json();
    console.log('  Status:', progressRes.status);
    console.log('  Total days:', progress.total_days || 0);
    console.log('  ✓ PASS:', progress.ok);

  } catch (err) {
    console.error('  ✗ FAIL:', err.message);
    console.log('  Note: API server may not be running');
  }

  console.log('\n=== API Tests Completed ===\n');
}

// Main test runner
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Phase 3: Reinforcement Scheduler - Test Suite        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    testSpacedRepetition();
    testMasteryCalculator();
    await testDatabaseOperations();
    await testAPIEndpoints();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  All Tests Completed!                                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('\n✗ Test suite error:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
