/**
 * Daily Insights Generator
 * 
 * Queries SSOT for yesterday's activity and generates insights
 * that are stored in the learnings table.
 * 
 * Schedule: Daily at 2 AM via cron
 */

// Use pg from heronclient daemon
const { Client } = require('/home/debian/code/heronclient/daemon/node_modules/pg');

// Database configuration
const DB_CONFIG = {
  host: process.env.EXOCORTEX_DB_HOST || '127.0.0.1',
  port: process.env.EXOCORTEX_DB_PORT || 5432,
  database: process.env.EXOCORTEX_DB_NAME || 'exocortex',
  user: process.env.EXOCORTEX_DB_USER || 'exocortex_app',
  password: process.env.EXOCORTEX_DB_PASSWORD || 'Exo@3Pass@3',
};

/**
 * Generate insights from activity data
 * This is a simplified version - in production, this would use an LLM
 */
function generateInsightsFromActivity(events) {
  const insights = [];
  
  if (events.length === 0) {
    return [{
      concept: 'No activity yesterday',
      context: 'No events recorded in the last 24 hours',
      confidence: 0.5,
      metadata: { count: 0 }
    }];
  }

  // Group events by type
  const eventTypes = {};
  events.forEach(event => {
    const type = event.type || 'unknown';
    eventTypes[type] = (eventTypes[type] || 0) + 1;
  });

  // Generate summary insight
  const summary = Object.entries(eventTypes)
    .map(([type, count]) => `${count} ${type} event${count > 1 ? 's' : ''}`)
    .join(', ');

  insights.push({
    concept: `Daily activity summary: ${events.length} events`,
    context: `Yesterday's activity included ${summary}. Total events: ${events.length}.`,
    confidence: 0.8,
    metadata: {
      totalEvents: events.length,
      eventTypes: eventTypes,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  // Generate type-specific insights
  for (const [type, count] of Object.entries(eventTypes)) {
    if (count >= 3) {
      insights.push({
        concept: `${type} activity pattern detected`,
        context: `${count} ${type} events occurred yesterday, indicating sustained engagement with ${type} tasks.`,
        confidence: 0.75,
        metadata: {
          type: type,
          count: count,
          pattern: 'sustained'
        }
      });
    }
  }

  // Generate progress insight if telegram events present
  if (eventTypes.telegram || eventTypes.message) {
    const telegramCount = (eventTypes.telegram || 0) + (eventTypes.message || 0);
    insights.push({
      concept: 'Communication activity review',
      context: `Analyzed ${telegramCount} communication events from Telegram. Consider reflecting on key conversations and decisions made.`,
      confidence: 0.7,
      metadata: {
        source: 'telegram',
        count: telegramCount
      }
    });
  }

  // Generate learning opportunity insight
  if (eventTypes.cli || eventTypes.command) {
    const cliCount = (eventTypes.cli || 0) + (eventTypes.command || 0);
    insights.push({
      concept: 'CLI usage pattern analysis',
      context: `Executed ${cliCount} CLI commands yesterday. Consider documenting recurring patterns or creating aliases for frequent operations.`,
      confidence: 0.65,
      metadata: {
        source: 'cli',
        count: cliCount,
        recommendation: 'create_aliases'
      }
    });
  }

  return insights;
}

/**
 * Main function to generate and store daily insights
 */
async function generateDailyInsights() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('[daily-insights] Connected to database');

    // Query SSOT for yesterday's activity
    const query = `
      SELECT * FROM core.events 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(query);
    const events = result.rows;
    
    console.log(`[daily-insights] Found ${events.length} events from last 24 hours`);

    // Generate insights
    const insights = generateInsightsFromActivity(events);
    console.log(`[daily-insights] Generated ${insights.length} insights`);

    // Store insights in learnings table
    let stored = 0;
    for (const insight of insights) {
      try {
        await client.query(
          `INSERT INTO core.learnings (source, concept, context, confidence, metadata) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT DO NOTHING`,
          ['insight', insight.concept, insight.context, insight.confidence, insight.metadata]
        );
        stored++;
        console.log(`[daily-insights] Stored insight: ${insight.concept}`);
      } catch (err) {
        console.error('[daily-insights] Failed to store insight:', err.message);
      }
    }

    console.log(`[daily-insights] Successfully stored ${stored} insights`);
    return { success: true, generated: insights.length, stored };

  } catch (err) {
    console.error('[daily-insights] Error:', err);
    return { success: false, error: err.message };
  } finally {
    await client.end();
  }
}

// CLI mode
if (require.main === module) {
  generateDailyInsights()
    .then(result => {
      console.log('\n=== Daily Insights Report ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { generateDailyInsights, generateInsightsFromActivity };
