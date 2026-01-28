/**
 * Clawdbot Insights Generation
 * 
 * Uses AI-powered analysis to generate insights from detected patterns
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

/**
 * Generate insights from patterns
 */
async function generateClawdbotInsights(patterns, events) {
  const insights = [];
  
  for (const pattern of patterns) {
    // Use Clawdbot's reasoning to generate insights
    const insight = {
      source: 'insight',
      concept: generateConceptFromPattern(pattern),
      context: generateContextFromPattern(pattern, events),
      confidence: Math.min(0.95, pattern.confidence || 0.8),
      metadata: {
        pattern_type: pattern.type,
        source: pattern.source || pattern.from || pattern.source || 'multi',
        timestamp: new Date().toISOString(),
        pattern_data: pattern
      }
    };
    
    insights.push(insight);
  }
  
  // Add aggregated insights
  if (patterns.length > 3) {
    insights.push(generateAggregatedInsight(patterns, events));
  }
  
  return insights;
}

/**
 * Generate concept from pattern type
 */
function generateConceptFromPattern(pattern) {
  switch (pattern.type) {
    case 'cross_source_concept':
      return `Multi-domain learning: ${pattern.concept}`;
      
    case 'high_activity':
      return `Focus area detected: ${pattern.source}`;
      
    case 'cli_mastery':
      return `CLI proficiency: ${pattern.command}`;
      
    case 'rapid_reinforcement':
      return `Learning acceleration: ${pattern.concept}`;
      
    case 'workflow_activity':
      return `Workflow pattern: ${pattern.hour} (${pattern.count} events)`;
      
    case 'source_transition':
      return `Context shift: ${pattern.from} → ${pattern.to}`;
      
    default:
      return `Pattern insight: ${pattern.type}`;
  }
}

/**
 * Generate detailed context from pattern
 */
function generateContextFromPattern(pattern, events) {
  switch (pattern.type) {
    case 'cross_source_concept':
      return `You learned about "${pattern.concept}" from ${pattern.sources.length} different sources: ${pattern.sources.join(', ')}. This indicates strong interest or practical importance. The concept spans multiple domains of your work.`;
      
    case 'high_activity':
      return `High activity detected in ${pattern.source} (${pattern.count} events). This suggests focused attention or a project requiring intensive work. Consider creating focused learning events to capture key learnings from this session.`;
      
    case 'cli_mastery':
      return `You used "${pattern.command}" ${pattern.count} times today. This command is becoming a core tool in your workflow. Consider documenting best practices or creating a learning entry for advanced usage patterns.`;
      
    case 'rapid_reinforcement':
      return `The concept "${pattern.concept}" was reinforced ${pattern.count} times within ${pattern.timeSpan}. This rapid repetition suggests either high practical relevance or a knowledge gap worth addressing more systematically.`;
      
    case 'workflow_activity':
      return `A cluster of ${pattern.count} events occurred around ${pattern.hour}. This pattern suggests an automated workflow or focused work session. Consider if this workflow can be further optimized or documented.`;
      
    case 'source_transition':
      return `Detected a context shift from ${pattern.from} to ${pattern.to}. This cross-source activity pattern may indicate workflow integration or knowledge transfer between different tools/platforms.`;
      
    default:
      return `Pattern detected: ${JSON.stringify(pattern, null, 2)}`;
  }
}

/**
 * Generate aggregated insight from multiple patterns
 */
function generateAggregatedInsight(patterns, events) {
  const patternTypes = [...new Set(patterns.map(p => p.type))];
  const sources = new Set();
  const concepts = [];
  
  patterns.forEach(p => {
    if (p.source) sources.add(p.source);
    if (p.concept) concepts.push(p.concept);
    if (p.from) sources.add(p.from);
    if (p.to) sources.add(p.to);
  });
  
  const sourceList = Array.from(sources).join(', ');
  const conceptList = concepts.slice(0, 3).join(', ');
  
  return {
    source: 'insight',
    concept: `Daily intelligence: ${patternTypes.length} pattern types across ${sources.size} sources`,
    context: `Your daily activity revealed ${patternTypes.length} distinct patterns across ${sources.size} sources (${sourceList}). Key concepts: ${conceptList}. This cross-source intelligence helps identify learning opportunities and workflow optimizations.`,
    confidence: 0.85,
    metadata: {
      pattern_type: 'aggregated_insight',
      source: 'multi',
      timestamp: new Date().toISOString(),
      pattern_data: {
        types: patternTypes,
        sources: Array.from(sources),
        concepts: concepts,
        count: patterns.length
      }
    }
  };
}

/**
 * Store insights to database with deduplication
 */
async function storeInsights(insights) {
  let storedCount = 0;
  
  for (const insight of insights) {
    try {
      // Check if insight already exists (avoid duplicates)
      const existing = await db.query(
        `SELECT id FROM core.learnings 
         WHERE concept = $1 AND created_at >= NOW() - INTERVAL '24 hours'
         ORDER BY created_at DESC LIMIT 1`,
        [insight.concept]
      );
      
      if (existing.rows.length === 0) {
        // Store in core.learnings
        await db.query(
          `INSERT INTO core.learnings 
           (source, concept, context, confidence, reinforcement_level, metadata, pattern_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            insight.source,
            insight.concept,
            insight.context,
            insight.confidence,
            1, // reinforcement_level
            insight.metadata,
            insight.metadata.pattern_type
          ]
        );
        
        // Also store in core.events for audit trail (events table doesn't have source column)
        // We'll store it as metadata in the payload
        await db.query(
          `INSERT INTO core.events (type, payload, dedupe_key)
           VALUES ($1, $2, $3)`,
          [
            'insight_created',
            {
              concept: insight.concept,
              confidence: insight.confidence,
              source: 'insight_generator',
              metadata: { ...insight.metadata, insight_confidence: insight.confidence }
            },
            `insight_${Date.now()}_${insight.concept.substring(0, 50)}`
          ]
        );
        
        storedCount++;
        console.log(`    ✓ Stored: ${insight.concept}`);
      } else {
        console.log(`    ⊘ Skipped (duplicate): ${insight.concept}`);
      }
      
    } catch (error) {
      console.error(`    ✗ Failed to store insight: ${insight.concept}`, error.message);
    }
  }
  
  return storedCount;
}

/**
 * Get insights for today (for testing)
 */
async function getTodaysInsights() {
  try {
    const result = await db.query(`
      SELECT * FROM core.learnings 
      WHERE source = 'insight' 
      AND created_at >= CURRENT_DATE
      ORDER BY confidence DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error getting insights:', error.message);
    return [];
  }
}

/**
 * Calculate insight statistics
 */
async function getInsightStats() {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_insights,
        AVG(confidence) as avg_confidence,
        COUNT(DISTINCT pattern_type) as unique_patterns,
        COUNT(DISTINCT metadata->>'source') as unique_sources
      FROM core.learnings 
      WHERE source = 'insight' 
      AND created_at >= CURRENT_DATE
    `);
    return result.rows[0] || {};
  } catch (error) {
    console.error('Error getting stats:', error.message);
    return {};
  }
}

module.exports = {
  generateClawdbotInsights,
  generateConceptFromPattern,
  generateContextFromPattern,
  generateAggregatedInsight,
  storeInsights,
  getTodaysInsights,
  getInsightStats
};
