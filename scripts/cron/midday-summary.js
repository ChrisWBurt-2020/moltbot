#!/usr/bin/env node

/**
 * Midday Summary Job (Lighter version)
 * 
 * Runs at 2 PM to provide a lighter summary of morning activity
 * Less comprehensive than daily summarization
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

const db = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exocortex',
  user: process.env.DB_USER || 'postgres',
  password: getDBPassword()
});

/**
 * Run midday summary
 */
async function runMiddaySummary() {
  console.log('☀️ Starting midday summary...');
  const startTime = Date.now();

  try {
    // Query morning activity (since midnight)
    const eventsQuery = await db.query(`
      SELECT 
        source,
        type,
        COUNT(*) as count
      FROM core.events 
      WHERE created_at >= CURRENT_DATE
      GROUP BY source, type
      ORDER BY count DESC
    `);

    // Get learnings from morning
    const learningsQuery = await db.query(`
      SELECT source, COUNT(*) as count
      FROM core.learnings 
      WHERE created_at >= CURRENT_DATE
      GROUP BY source
      ORDER BY count DESC
    `);

    const totalEvents = eventsQuery.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const totalLearnings = learningsQuery.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    // Build summary message
    const message = `
☀️ **Midday Exocortex Summary**

**Morning Activity:**
- Total Events: ${totalEvents}
- Total Learnings: ${totalLearnings}

**Top Sources:**
${eventsQuery.rows.slice(0, 5).map(r => 
  `- ${r.source}: ${r.count} ${r.type} events`
).join('\n')}

**Learning Sources:**
${learningsQuery.rows.map(r => 
  `- ${r.source}: ${r.count} learnings`
).join('\n')}

*More details in the evening digest*
    `.trim();

    // Send to Telegram (if configured)
    if (process.env.TELEGRAM_CHAT_ID) {
      try {
        await fetch('http://localhost:3003/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message
          })
        });
        console.log('✓ Midday summary sent to Telegram');
      } catch (error) {
        console.error('Failed to send Telegram message:', error.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Midday summary complete in ${duration}s`);
    
    return {
      success: true,
      totalEvents,
      totalLearnings,
      duration: `${duration}s`
    };

  } catch (error) {
    console.error('❌ Midday summary failed:', error);
    throw error;
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

// Main execution
if (require.main === module) {
  runMiddaySummary()
    .then(result => {
      console.log('\n' + JSON.stringify(result, null, 2));
      return shutdown();
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { runMiddaySummary };
