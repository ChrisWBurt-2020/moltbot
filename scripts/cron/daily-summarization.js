#!/usr/bin/env node

/**
 * Daily Summarization Job
 * 
 * Runs daily at 2 AM to:
 * 1. Aggregate 24h of activity across all sources
 * 2. Detect cross-source patterns
 * 3. Generate Clawdbot insights
 * 4. Store insights to SSOT
 * 5. Send Telegram digest
 */

const { Pool } = require('pg');
const fs = require('fs');

// Read password from file or environment
function getDBPassword() {
  try {
    if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
    const passwordFile = '/home/debian/testproj/secrets/postgres_password';
    if (fs.existsSync(passwordFile)) {
      return fs.readFileSync(passwordFile, 'utf8').trim();
    }
    return 'postgres';
  } catch (error) {
    return 'postgres';
  }
}

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exocortex',
  user: process.env.DB_USER || 'postgres',
  password: getDBPassword()
});

// Import pattern detection and insight generation
const { detectCrossSourcePatterns } = require('./pattern-detector');
const { generateClawdbotInsights, storeInsights } = require('../clawdbot-insights');

/**
 * Main daily summarization function
 */
async function runDailySummarization() {
  console.log('📅 Starting daily summarization...');
  const startTime = Date.now();

  try {
    // Step 1: Query 24h activity
    console.log('📊 Querying 24h activity...');
    const [events, documents, learnings] = await Promise.all([
      db.query(`
        SELECT * FROM core.events 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
      `),
      db.query(`
        SELECT * FROM core.documents 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `),
      db.query(`
        SELECT * FROM core.learnings 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `)
    ]);

    console.log(`  - Events: ${events.rows.length}`);
    console.log(`  - Documents: ${documents.rows.length}`);
    console.log(`  - Learnings: ${learnings.rows.length}`);

    // Step 2: Detect cross-source patterns
    console.log('\n🔍 Detecting cross-source patterns...');
    const patterns = detectCrossSourcePatterns(
      events.rows,
      documents.rows,
      learnings.rows
    );
    console.log(`  - Patterns found: ${patterns.length}`);

    // Step 3: Generate Clawdbot insights
    console.log('\n🧠 Generating Clawdbot insights...');
    const insights = await generateClawdbotInsights(patterns, events.rows);
    console.log(`  - Insights generated: ${insights.length}`);

    // Step 4: Store insights
    console.log('\n💾 Storing insights...');
    const storedCount = await storeInsights(insights);
    console.log(`  - New insights stored: ${storedCount}`);

    // Step 5: Send Telegram digest
    console.log('\n📤 Sending Telegram digest...');
    await sendDailyDigest();
    console.log('  - Digest sent successfully');

    // Step 6: Store daily metrics
    console.log('\n📈 Storing daily metrics...');
    await storeDailyMetrics(events.rows, learnings.rows, insights);
    console.log('  - Daily metrics stored');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Daily summarization complete in ${duration}s`);
    
    return {
      success: true,
      events: events.rows.length,
      documents: documents.rows.length,
      learnings: learnings.rows.length,
      patterns: patterns.length,
      insights: insights.length,
      duration: `${duration}s`
    };

  } catch (error) {
    console.error('❌ Daily summarization failed:', error);
    await logError(error);
    throw error;
  }
}

/**
 * Send daily digest to Telegram
 */
async function sendDailyDigest() {
  try {
    // Get today's insights
    const insightsQuery = await db.query(`
      SELECT * FROM core.learnings 
      WHERE source = 'insight' 
      AND created_at >= CURRENT_DATE
      ORDER BY confidence DESC
      LIMIT 10
    `);

    if (insightsQuery.rows.length === 0) {
      console.log('  - No insights to send today');
      return;
    }

    // Get activity summary
    const activitySummary = await getActivitySummary();

    // Get learning count
    const learningCount = await getLearningCount();

    // Build message
    const message = `
📊 **Daily Exocortex Digest**

**Insights Generated:** ${insightsQuery.rows.length}

**Top Insights:**
${insightsQuery.rows.slice(0, 5).map((i, idx) => 
  `${idx+1}. ${i.concept} (conf: ${(i.confidence*100).toFixed(0)}%)`
).join('\n')}

**Activity Summary:**
${activitySummary}

**Total Learnings Today:** ${learningCount}

Review these insights or add your own:
/learn "concept" "context"
    `.trim();

    // Send to Telegram via heronclient
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '613448429'; // Default to main chat
    const response = await fetch('http://localhost:3003/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('  - Failed to send Telegram message:', errorText);
    } else {
      console.log('  - Telegram message sent successfully');
    }

  } catch (error) {
    console.error('  - Error sending Telegram digest:', error.message);
  }
}

/**
 * Get activity summary for the day
 */
async function getActivitySummary() {
  try {
    const events = await db.query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM core.events
      WHERE created_at >= CURRENT_DATE
      GROUP BY type
      ORDER BY count DESC
    `);

    return events.rows.map(e => `- ${e.type}: ${e.count} events`).join('\n');
  } catch (error) {
    console.error('  - Error getting activity summary:', error.message);
    return 'Unable to fetch activity summary';
  }
}

/**
 * Get total learning count for today
 */
async function getLearningCount() {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count 
      FROM core.learnings 
      WHERE created_at >= CURRENT_DATE
    `);
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('  - Error getting learning count:', error.message);
    return 0;
  }
}

/**
 * Store daily metrics for dashboard
 */
async function storeDailyMetrics(events, learnings, insights) {
  try {
    // Calculate unique sources
    const sourceSet = new Set(events.map(e => e.source));
    const uniqueSources = sourceSet.size;

    // Get top concepts (most frequent learnings)
    const topConcepts = learnings
      .slice(0, 10)
      .map(l => ({ concept: l.concept, confidence: l.confidence }));

    // Insert or update daily metrics
    await db.query(`
      INSERT INTO core.daily_metrics (
        date,
        total_events,
        total_learnings,
        total_insights,
        unique_sources,
        top_concepts
      ) VALUES (
        CURRENT_DATE,
        $1,
        $2,
        $3,
        $4,
        $5::jsonb
      )
      ON CONFLICT (date) 
      DO UPDATE SET
        total_events = EXCLUDED.total_events,
        total_learnings = EXCLUDED.total_learnings,
        total_insights = EXCLUDED.total_insights,
        unique_sources = EXCLUDED.unique_sources,
        top_concepts = EXCLUDED.top_concepts,
        updated_at = NOW()
    `, [
      events.length,
      learnings.length,
      insights.length,
      uniqueSources,
      JSON.stringify(topConcepts)
    ]);

    console.log(`  - Metrics: ${events.length} events, ${learnings.length} learnings, ${insights.length} insights`);

  } catch (error) {
    console.error('  - Error storing daily metrics:', error.message);
  }
}

/**
 * Log error to database
 */
async function logError(error) {
  try {
    await db.query(`
      INSERT INTO core.events (source, type, content, metadata)
      VALUES ($1, $2, $3, $4)
    `, [
      'daily_summarizer',
      'error',
      error.message,
      { stack: error.stack, timestamp: new Date().toISOString() }
    ]);
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('Shutting down...');
  await db.end();
  process.exit(0);
}

// Main execution (if run directly)
if (require.main === module) {
  runDailySummarization()
    .then(result => {
      // Output JSON for cron logs
      console.log('\n' + JSON.stringify(result, null, 2));
      return shutdown();
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });

  // Handle shutdown signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = {
  runDailySummarization,
  sendDailyDigest,
  getActivitySummary,
  getLearningCount,
  storeDailyMetrics
};
