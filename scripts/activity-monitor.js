/**
 * Real-time Activity Monitor
 * Monitors SSOT for patterns and generates insights
 */

const { Pool } = require('pg');
const http = require('http');

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heron',
  user: process.env.DB_USER || 'heron',
  password: process.env.DB_PASSWORD || 'heron'
});

class ActivityMonitor {
  constructor() {
    this.lastChecked = new Date();
    this.patterns = {
      high_frequency: new Map(),
      concurrent: new Map(),
      sequential: new Map()
    };
  }

  async monitor() {
    // Check every 5 minutes
    setInterval(async () => {
      await this.checkForPatterns();
    }, 300000);
  }

  async checkForPatterns() {
    console.log('[ActivityMonitor] Checking for patterns...');
    
    try {
      // Query recent events
      const events = await this.queryRecentEvents();
      
      if (events.length === 0) {
        console.log('[ActivityMonitor] No recent events found');
        return;
      }
      
      console.log(`[ActivityMonitor] Analyzing ${events.length} events`);
      
      // Analyze for patterns
      const patterns = await this.analyzePatterns(events);
      
      if (patterns.length === 0) {
        console.log('[ActivityMonitor] No patterns detected');
        return;
      }
      
      console.log(`[ActivityMonitor] Detected ${patterns.length} patterns`);
      
      // Generate insights
      for (const pattern of patterns) {
        await this.generateInsight(pattern);
      }
    } catch (err) {
      console.error('[ActivityMonitor] Error in checkForPatterns:', err.message);
    }
  }

  async queryRecentEvents() {
    try {
      const result = await db.query(`
        SELECT * FROM core.events 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
        LIMIT 1000
      `);
      return result.rows;
    } catch (err) {
      console.error('[ActivityMonitor] Database query error:', err.message);
      return [];
    }
  }

  async analyzePatterns(events) {
    const patterns = [];
    
    // Pattern 1: High frequency commands
    const commandCounts = {};
    for (const event of events) {
      if (event.type === 'cli_frequency') {
        const cmd = event.metadata?.commandName;
        if (cmd) {
          commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
        }
      }
    }
    
    for (const [cmd, count] of Object.entries(commandCounts)) {
      if (count >= 3) {
        const patternId = `hfc_${cmd}_${count}`;
        if (!this.patterns.high_frequency.has(patternId)) {
          this.patterns.high_frequency.set(patternId, true);
          patterns.push({
            type: 'high_frequency_command',
            command: cmd,
            count,
            timeframe: '1 hour',
            confidence: Math.min(0.9, count * 0.2),
            id: patternId
          });
        }
      }
    }
    
    // Pattern 2: Learning topics mentioned multiple times in Telegram
    const topicCounts = {};
    for (const event of events) {
      if (event.type === 'telegram_message') {
        const content = event.content || event.metadata?.content || '';
        // Extract potential topics (capitalized words)
        const topics = content.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
        topics.forEach(topic => {
          if (topic.length > 3 && topic.length < 50) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        });
      }
    }
    
    for (const [topic, count] of Object.entries(topicCounts)) {
      if (count >= 2) {
        const patternId = `topic_${topic}_${count}`;
        if (!this.patterns.sequential.has(patternId)) {
          this.patterns.sequential.set(patternId, true);
          patterns.push({
            type: 'topic_mentioned_multiple_times',
            topic,
            count,
            timeframe: '1 hour',
            confidence: 0.7,
            id: patternId
          });
        }
      }
    }
    
    // Pattern 3: Learning events created
    const learningCounts = {};
    for (const event of events) {
      if (event.type === 'learning_created') {
        const concept = event.metadata?.concept;
        if (concept) {
          learningCounts[concept] = (learningCounts[concept] || 0) + 1;
        }
      }
    }
    
    for (const [concept, count] of Object.entries(learningCounts)) {
      if (count >= 2) {
        const patternId = `learning_${concept}_${count}`;
        if (!this.patterns.concurrent.has(patternId)) {
          this.patterns.concurrent.set(patternId, true);
          patterns.push({
            type: 'reinforced_learning',
            concept,
            count,
            timeframe: '1 hour',
            confidence: 0.8,
            id: patternId
          });
        }
      }
    }
    
    return patterns;
  }

  async generateInsight(pattern) {
    const insight = {
      source: 'pattern',
      concept: this.generateConcept(pattern),
      context: this.generateContext(pattern),
      confidence: pattern.confidence,
      metadata: pattern
    };

    console.log(`[ActivityMonitor] Generating insight: ${insight.concept}`);
    
    // Send to ae_path
    try {
      await this.sendToHeronClient(insight);
    } catch (err) {
      console.error('[ActivityMonitor] Failed to send insight:', err.message);
    }
    
    // Send Telegram alert if confidence is high
    if (pattern.confidence > 0.7) {
      await this.sendTelegramAlert(insight);
    }
  }

  generateConcept(pattern) {
    switch (pattern.type) {
      case 'high_frequency_command':
        return `CLI Mastery: ${pattern.command} (used ${pattern.count}x)`;
      case 'topic_mentioned_multiple_times':
        return `Learning Opportunity: ${pattern.topic}`;
      case 'reinforced_learning':
        return `Reinforcement: ${pattern.concept} (repeated ${pattern.count}x)`;
      default:
        return `Pattern Detected: ${pattern.type}`;
    }
  }

  generateContext(pattern) {
    switch (pattern.type) {
      case 'high_frequency_command':
        return `You've used ${pattern.command} ${pattern.count} times in the last hour. Consider creating a learning event for this command.`;
      case 'topic_mentioned_multiple_times':
        return `You've mentioned "${pattern.topic}" ${pattern.count} times recently. This might be worth learning more about.`;
      case 'reinforced_learning':
        return `You've created learning events for "${pattern.concept}" ${pattern.count} times. This concept is being reinforced.`;
      default:
        return `Pattern detected: ${JSON.stringify(pattern)}`;
    }
  }

  async sendTelegramAlert(insight) {
    const message = `
🔍 **Pattern Detected**

**Learning Opportunity**: ${insight.concept}

**Context**: ${insight.context}

**Confidence**: ${(insight.confidence * 100).toFixed(0)}%

/learn "${insight.concept}" - Add to your learnings
    `;

    try {
      await this.sendToTelegram(message);
    } catch (err) {
      console.error('[ActivityMonitor] Failed to send Telegram alert:', err.message);
    }
  }

  async sendToHeronClient(data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'localhost',
        port: 3005,
        path: '/api/learnings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const result = JSON.parse(responseData);
              console.log(`[ActivityMonitor] Insight sent: ${data.concept}`);
              resolve(result);
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', (err) => {
        console.warn('[ActivityMonitor] Connection error:', err.message);
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  async sendToTelegram(message) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID || 'default',
        text: message
      });
      
      const options = {
        hostname: 'localhost',
        port: 3003,
        path: '/telegram/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('[ActivityMonitor] Telegram alert sent');
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = { ActivityMonitor };

// CLI mode for cron job
if (require.main === module) {
  const monitor = new ActivityMonitor();
  monitor.checkForPatterns().then(() => {
    console.log('[ActivityMonitor] Pattern check complete');
    process.exit(0);
  }).catch(err => {
    console.error('[ActivityMonitor] Error:', err.message);
    process.exit(1);
  });
}
