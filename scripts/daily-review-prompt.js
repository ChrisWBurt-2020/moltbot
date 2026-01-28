/**
 * Daily Review Prompt Job
 * 
 * Sends daily reminders for due reviews to Telegram.
 * Runs at 9 AM daily via cron.
 * 
 * Usage: node /home/debian/clawd/scripts/daily-review-prompt.js
 */

const { Pool } = require('pg');
const { sendTelegramMessage } = require('/home/debian/code/heronclient/daemon/telegram/send-message');

// Database connection configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heronclient',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres'
};

// Telegram chat ID (default from environment)
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function main() {
  console.log('[daily-review-prompt] Starting daily review prompt job...');

  if (!TELEGRAM_CHAT_ID) {
    console.error('[daily-review-prompt] ERROR: TELEGRAM_CHAT_ID not set');
    process.exit(1);
  }

  const pool = new Pool(DB_CONFIG);

  try {
    // 1. Get due reviews
    console.log('[daily-review-prompt] Querying due reviews...');
    const dueResult = await pool.query(`
      SELECT 
        id,
        concept,
        context,
        reinforcement_level,
        next_review,
        last_reviewed,
        source
      FROM core.learnings 
      WHERE next_review <= NOW() 
      ORDER BY reinforcement_level ASC, next_review ASC
    `);

    const due = dueResult.rows;

    console.log(`[daily-review-prompt] Found ${due.length} reviews due`);

    // 2. Send to Telegram if any
    if (due.length > 0) {
      const message = buildReviewMessage(due);
      
      console.log('[daily-review-prompt] Sending review queue to Telegram...');
      await sendTelegramMessage({
        chatId: TELEGRAM_CHAT_ID,
        text: message,
        parseMode: 'HTML'
      });

      console.log('[daily-review-prompt] Review queue sent successfully');
    } else {
      console.log('[daily-review-prompt] No reviews due, skipping notification');
    }

    // 3. Track review stats in daily_stats table
    console.log('[daily-review-prompt] Updating daily stats...');
    await pool.query(
      `INSERT INTO core.daily_stats (date, due_reviews, completed_reviews)
       VALUES (CURRENT_DATE, $1, 0)
       ON CONFLICT (date) DO UPDATE
       SET due_reviews = EXCLUDED.due_reviews,
           updated_at = NOW()`,
      [due.length]
    );

    console.log('[daily-review-prompt] Daily stats updated');

    // 4. Clean up old daily stats (keep last 90 days)
    await pool.query(
      `DELETE FROM core.daily_stats 
       WHERE date < CURRENT_DATE - INTERVAL '90 days'`
    );

    console.log('[daily-review-prompt] Old stats cleaned up');

  } catch (err) {
    console.error('[daily-review-prompt] Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('[daily-review-prompt] Job completed');
  }
}

function buildReviewMessage(due) {
  let message = `📚 <b>Daily Review Queue</b>\n\n`;
  message += `You have <b>${due.length}</b> concept${due.length > 1 ? 's' : ''} due for review:\n\n`;

  const toShow = due.slice(0, 5);
  toShow.forEach((item, index) => {
    message += `${index + 1}. <b>${item.concept}</b> (Level ${item.reinforcement_level})\n`;
    message += `   <i>${item.context.substring(0, 60)}${item.context.length > 60 ? '...' : ''}</i>\n`;
  });

  if (due.length > 5) {
    message += `\n...and ${due.length - 5} more concepts\n`;
  }

  message += `\n<b>Commands:</b>\n`;
  message += `/review - See all due reviews\n`;
  message += `/recall <topic> - Test yourself on specific topics\n`;
  message += `/mastery - View your mastery dashboard\n`;

  message += `\n\n📅 <i>Keep your knowledge fresh!</i>`;

  return message;
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { main };
