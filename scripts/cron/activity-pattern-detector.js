#!/usr/bin/env node

/**
 * Activity Pattern Detector Cron Job
 * Runs every 5 minutes to detect patterns in user activity
 */

const { ActivityMonitor } = require('../activity-monitor.js');

async function detectPatterns() {
  console.log('[Cron] Starting pattern detection...');
  const monitor = new ActivityMonitor();
  await monitor.checkForPatterns();
  console.log('[Cron] Pattern detection complete');
}

detectPatterns()
  .then(() => {
    console.log('[Cron] Job completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('[Cron] Job failed:', err.message);
    process.exit(1);
  });
