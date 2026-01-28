#!/usr/bin/env node

/**
 * Concept Linker Runner
 * 
 * Runs the concept linker to discover and create relationships between learning concepts
 */

const { Pool } = require('pg');
const ConceptLinker = require('/home/debian/code/ae_path/src/services/conceptLinker');

async function main() {
  console.log('🔄 Starting Concept Linker...\n');

  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'exocortex',
    user: process.env.DB_USER || 'exocortex_app',
    password: process.env.DB_PASSWORD
  };

  try {
    // Create database pool
    const pool = new Pool(dbConfig);

    // Initialize concept linker
    const linker = new ConceptLinker(pool);

    // Run batch linking
    console.log('📊 Analyzing learnings and creating relationships...');
    const result = await linker.batchLinkConcepts();

    console.log('\n✅ Concept Linking Complete!');
    console.log(`   • Learnings processed: ${result.learningsProcessed}`);
    console.log(`   • Relationships created: ${result.count}`);
    console.log(`   • Message: ${result.message}`);

    // Get stats
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM core.concept_relationships) as total_relationships,
        (SELECT COUNT(*) FROM core.concept_clusters) as total_clusters,
        (SELECT COUNT(*) FROM core.learnings) as total_learnings
    `);

    const stats = statsResult.rows[0];
    console.log('\n📈 Current Statistics:');
    console.log(`   • Total learnings: ${stats.total_learnings}`);
    console.log(`   • Total relationships: ${stats.total_relationships}`);
    console.log(`   • Total clusters: ${stats.total_clusters}`);

    // Show top relationships
    const topRelResult = await pool.query(`
      SELECT 
        l1.concept as concept1,
        l2.concept as concept2,
        lr.similarity_score
      FROM core.concept_relationships lr
      JOIN core.learnings l1 ON lr.learning_id = l1.id
      JOIN core.learnings l2 ON lr.related_learning_id = l2.id
      ORDER BY lr.similarity_score DESC
      LIMIT 5
    `);

    if (topRelResult.rows.length > 0) {
      console.log('\n🔗 Top Relationships:');
      topRelResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. "${row.concept1}" ↔ "${row.concept2}" (${row.similarity_score.toFixed(2)})`);
      });
    }

    // Show clusters
    const clustersResult = await pool.query(`
      SELECT concepts, size 
      FROM core.concept_clusters 
      ORDER BY size DESC 
      LIMIT 3
    `);

    if (clustersResult.rows.length > 0) {
      console.log('\n🌐 Top Clusters:');
      clustersResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ${row.concepts.join(', ')} (${row.size} concepts)`);
      });
    }

    // Close connection
    await pool.end();

    console.log('\n✨ Done!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error running concept linker:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Concept Linker Runner

Usage:
  node run-concept-linker.js

Description:
  Discovers and creates relationships between learning concepts based on:
  • Same source
  • Similar context (text similarity)
  • Time proximity
  • User patterns

Environment Variables:
  DB_HOST          - Database host (default: localhost)
  DB_PORT          - Database port (default: 5432)
  DB_NAME          - Database name (default: exocortex)
  DB_USER          - Database user (default: exocortex_app)
  DB_PASSWORD      - Database password (required)

Example:
  DB_PASSWORD=yourpassword node run-concept-linker.js
  `);
  process.exit(0);
}

// Run the script
main();
