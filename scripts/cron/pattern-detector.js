/**
 * Pattern Detector
 * 
 * Detects cross-source patterns and interesting activity trends
 */

/**
 * Main pattern detection function
 */
function detectCrossSourcePatterns(events, documents, learnings) {
  const patterns = [];
  
  // Pattern 1: Same concept across multiple sources (Cross-Source Concepts)
  patterns.push(...detectCrossSourceConcepts(learnings));
  
  // Pattern 2: High activity in specific domain
  patterns.push(...detectHighActivitySources(events));
  
  // Pattern 3: CLI commands leading to insights
  patterns.push(...detectCLIMastery(events));
  
  // Pattern 4: Rapid learning reinforcement (same concept learned quickly)
  patterns.push(...detectRapidReinforcement(learnings));
  
  // Pattern 5: Document-Event alignment (doc created and events around it)
  patterns.push(...detectDocumentEventAlignment(events, documents));
  
  return patterns;
}

/**
 * Pattern 1: Cross-Source Concepts
 * Same concept learned from multiple sources
 */
function detectCrossSourceConcepts(learnings) {
  const patterns = [];
  const conceptMap = {};
  
  learnings.forEach(l => {
    if (!conceptMap[l.concept]) {
      conceptMap[l.concept] = [];
    }
    if (!conceptMap[l.concept].includes(l.source)) {
      conceptMap[l.concept].push(l.source);
    }
  });
  
  for (const [concept, sources] of Object.entries(conceptMap)) {
    if (sources.length >= 2) {
      patterns.push({
        type: 'cross_source_concept',
        concept,
        sources,
        count: sources.length,
        description: `Learned "${concept}" from ${sources.join(', ')}`,
        confidence: Math.min(0.95, 0.5 + (sources.length * 0.1))
      });
    }
  }
  
  return patterns;
}

/**
 * Pattern 2: High Activity Sources
 * Sources with unusually high event counts
 */
function detectHighActivitySources(events) {
  const patterns = [];
  const sourceCounts = {};
  
  events.forEach(e => {
    if (e.source) {
      sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
    }
  });
  
  for (const [source, count] of Object.entries(sourceCounts)) {
    // Threshold: more than 5 events in 24h is significant
    if (count > 5) {
      patterns.push({
        type: 'high_activity',
        source,
        count,
        description: `${count} events from ${source} today`,
        confidence: Math.min(0.95, 0.6 + (count * 0.02))
      });
    }
  }
  
  return patterns;
}

/**
 * Pattern 3: CLI Mastery
 * Commands used frequently and successfully
 */
function detectCLIMastery(events) {
  const patterns = [];
  const cliEvents = events.filter(e => 
    e.type === 'cli_usage' || 
    e.metadata?.command || 
    e.content?.includes('command')
  );
  
  const frequentCommands = {};
  
  cliEvents.forEach(e => {
    let cmd = e.metadata?.command;
    
    // Try to extract command from various formats
    if (!cmd && e.content) {
      const match = e.content.match(/command["\s]*[:=]["\s]*["\s]*([^"\s]+)/i);
      if (match) cmd = match[1];
    }
    
    if (cmd) {
      // Normalize command (short version)
      const normalizedCmd = cmd.split(' ')[0].toLowerCase();
      frequentCommands[normalizedCmd] = (frequentCommands[normalizedCmd] || 0) + 1;
    }
  });
  
  for (const [cmd, count] of Object.entries(frequentCommands)) {
    // Threshold: 3+ uses in 24h indicates mastery
    if (count >= 3) {
      patterns.push({
        type: 'cli_mastery',
        command: cmd,
        count,
        description: `CLI "${cmd}" used ${count} times - ready for mastery`,
        confidence: Math.min(0.95, 0.7 + (count * 0.05))
      });
    }
  }
  
  return patterns;
}

/**
 * Pattern 4: Rapid Reinforcement
 * Same concept learned multiple times in short period
 */
function detectRapidReinforcement(learnings) {
  const patterns = [];
  const conceptTimes = {};
  
  learnings.forEach(l => {
    if (!conceptTimes[l.concept]) {
      conceptTimes[l.concept] = [];
    }
    conceptTimes[l.concept].push(new Date(l.created_at));
  });
  
  for (const [concept, timestamps] of Object.entries(conceptTimes)) {
    if (timestamps.length >= 2) {
      // Check if learned multiple times within 12 hours
      const sorted = timestamps.sort((a, b) => a - b);
      const timeDiffHours = (sorted[sorted.length - 1] - sorted[0]) / (1000 * 60 * 60);
      
      if (timeDiffHours <= 12) {
        patterns.push({
          type: 'rapid_reinforcement',
          concept,
          count: timestamps.length,
          timeSpan: `${timeDiffHours.toFixed(1)} hours`,
          description: `Concept "${concept}" reinforced ${timestamps.length} times in ${timeDiffHours.toFixed(1)}h`,
          confidence: Math.min(0.95, 0.8 + (timestamps.length * 0.05))
        });
      }
    }
  }
  
  return patterns;
}

/**
 * Pattern 5: Document-Event Alignment
 * Events occurring around document creation (workflow pattern)
 */
function detectDocumentEventAlignment(events, documents) {
  const patterns = [];
  
  // Group events by hour
  const eventsByHour = {};
  events.forEach(e => {
    const hour = new Date(e.created_at).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
  });
  
  // Check if any hour has unusually high activity (workflow triggered)
  for (const [hour, count] of Object.entries(eventsByHour)) {
    if (count >= 3) {
      patterns.push({
        type: 'workflow_activity',
        hour,
        count,
        description: `High activity cluster (${count} events) in ${hour}`,
        confidence: 0.65
      });
    }
  }
  
  return patterns;
}

/**
 * Pattern 6: Source Correlation
 * One source triggering activity in another
 */
function detectSourceCorrelation(events) {
  const patterns = [];
  const sourceOrder = events
    .filter(e => e.source)
    .map(e => e.source)
    .slice(0, 20); // Last 20 sources
  
  // Detect if CLI -> Telegram or GitHub -> CLI patterns exist
  for (let i = 0; i < sourceOrder.length - 1; i++) {
    const current = sourceOrder[i];
    const next = sourceOrder[i + 1];
    
    if (current !== next) {
      const key = `${current}_to_${next}`;
      patterns.push({
        type: 'source_transition',
        from: current,
        to: next,
        description: `Context shift: ${current} → ${next}`,
        confidence: 0.5
      });
    }
  }
  
  return patterns;
}

module.exports = {
  detectCrossSourcePatterns,
  detectCrossSourceConcepts,
  detectHighActivitySources,
  detectCLIMastery,
  detectRapidReinforcement,
  detectDocumentEventAlignment,
  detectSourceCorrelation
};
