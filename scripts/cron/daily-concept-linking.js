#!/usr/bin/env node

/**
 * Daily Concept Linking Job
 * 
 * Runs automatically via cron to update concept relationships
 * Should be scheduled to run daily at a low-traffic time (e.g., 2 AM)
 */

const { Pool } = require('pg');
const ConceptLinker = require('/home/debian/code/ae_path/src/services/conceptLinker');

async function runDailyConceptLinking() {
  const startTime = Date.now();
  console.log(`[Daily Concept Linking] Starting at ${new Date().toISOString()}`);

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'exocortex',
    user: process.env.DB_USER || 'exocortex_app',
    password: process.env.DB_PASSWORD
  };

  try {
    const pool = new Pool(dbConfig);
    const linker = new ConceptLinker(pool);

    const result = await linker.batchLinkConcepts();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`[Daily Concept Linking] Completed in ${duration}s`);
    console.log(`  - Learnings processed: ${result.learningsProcessed}`);
    console.log(`  - Relationships created: ${result.count}`);
    
    await pool.end();
    
    return {
      success: true,
      duration: parseFloat(duration),
      ...result
    };

  } catch (error) {
    console.error('[Daily Concept Linking] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other scripts
module.exports = { runDailyConceptLinking };

// Run if called directly
if (require.main === module) {
  runDailyConceptLinking().then(result => {
    if (result.success) {
      console.log('\n✅ Daily concept linking completed successfully');
      process.exit(0);
    } else {
      console.error('\n❌ Daily concept linking failed');
      process.exit(1);
    }
  });
}
