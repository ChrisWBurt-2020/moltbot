# Phase 2: Real-time Pattern Detection

## Quick Start

### 1. Verify Installation

```bash
# Run the test suite
node /home/debian/clawd/scripts/test-phase2.js
```

### 2. Manual Testing

#### Test CLI Frequency Detection
```bash
# Execute same command 3 times within 1 hour
curl --version
curl --version
curl --version

# Check if pattern was detected
curl http://127.0.0.1:3005/api/patterns/realtime | jq
```

#### Test Activity Monitor
```bash
# Run pattern detection manually
node /home/debian/clawd/scripts/cron/activity-pattern-detector.js
```

#### Check Database
```bash
# View detected patterns
psql -h 127.0.0.1 -U exocortex_app -d exocortex -c "SELECT * FROM core.patterns ORDER BY detected_at DESC LIMIT 10;"

# View CLI frequency
psql -h 127.0.0.1 -U exocortex_app -d exocortex -c "SELECT * FROM core.cli_frequency ORDER BY frequency DESC LIMIT 10;"

# View real-time patterns
psql -h 127.0.0.1 -U exocortex_app -d exocortex -c "SELECT * FROM core.real_time_patterns;"
```

### 3. View Real-time Data

#### Via API
```bash
# Real-time patterns (last hour)
curl http://127.0.0.1:3005/api/patterns/realtime

# Learning opportunities
curl http://127.0.0.1:3005/api/patterns/opportunities

# Learning velocity
curl http://127.0.0.1:3005/api/patterns/velocity
```

#### Via Telegram
- Execute CLI commands with high frequency
- Check for pattern detection alerts
- Use inline buttons to add learnings

## Architecture

### Components

1. **Command Frequency Tracker** (`commandTracker.js`)
   - Tracks CLI command usage in real-time
   - Detects patterns (3+ uses in 1 hour)
   - Stores to disk for persistence

2. **Activity Monitor** (`activity-monitor.js`)
   - Analyzes SSOT database every 5 minutes
   - Detects multiple pattern types
   - Generates insights and alerts

3. **Telegram Alerts** (`patternAlerts.js`)
   - Sends learning notifications
   - Provides inline action buttons
   - Daily summary reports

4. **API Endpoints** (`api-server.js`)
   - Real-time pattern queries
   - Learning opportunities
   - Velocity metrics

### Data Flow

```
CLI Execution → Command Tracker → Pattern Detection → Insight → Telegram Alert
                    ↓                    ↓
              SSOT Database ← Activity Monitor (5 min)
```

## Configuration

### Environment Variables
```bash
# Database (already set in heronclient/.env)
EXOCORTEX_DB_HOST=127.0.0.1
EXOCORTEX_DB_PORT=5432
EXOCORTEX_DB_NAME=exocortex
EXOCORTEX_DB_USER=exocortex_app
EXOCORTEX_DB_PASSWORD=Exo@3Pass@3

# Telegram (already set)
TELEGRAM_CHAT_ID=7831636882
```

### Cron Schedule
Pattern detection runs every 5 minutes:
```bash
*/5 * * * * root /usr/bin/node /home/debian/clawd/scripts/cron/activity-pattern-detector.js
```

## Pattern Types

### 1. High-Frequency CLI
- **Trigger**: Command used 3+ times in 1 hour
- **Confidence**: min(0.95, count * 0.3)
- **Example**: `curl --version` used 5 times
- **Action**: Create learning event for CLI mastery

### 2. Topic Mentions
- **Trigger**: Topic mentioned 2+ times in Telegram
- **Confidence**: 0.7
- **Example**: "JavaScript" mentioned 3 times
- **Action**: Suggest learning about the topic

### 3. Reinforced Learning
- **Trigger**: Learning event created 2+ times
- **Confidence**: 0.8
- **Example**: Same concept reinforced
- **Action**: Mark as reinforced

## API Reference

### POST /api/events
Store events in SSOT
```json
{
  "type": "cli_frequency",
  "timestamp": "2024-01-28T12:00:00Z",
  "metadata": {
    "command": "curl",
    "frequency": 5
  }
}
```

### GET /api/patterns/realtime
Get patterns from last hour
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "concept": "CLI Mastery: curl (used 5x)",
      "context": "...",
      "confidence": 0.9,
      "source": "cli",
      "created_at": "2024-01-28T12:00:00Z"
    }
  ]
}
```

### GET /api/patterns/opportunities
Get learning opportunities (reinforcement_level = 1)
```json
{
  "ok": true,
  "data": [...]
}
```

### GET /api/patterns/velocity
Get learning velocity (last 7 days)
```json
{
  "ok": true,
  "data": [
    {
      "date": "2024-01-28",
      "learnings": 5,
      "avg_confidence": 0.82,
      "source": "cli"
    }
  ]
}
```

## Troubleshooting

### Patterns Not Detected

1. **Check CLI Router Integration**
   ```bash
   node -c /home/debian/testproj/mcp-servers/cli-router/commandTracker.js
   ```

2. **Check Database**
   ```bash
   psql -h 127.0.0.1 -U exocortex_app -d exocortex -c "SELECT COUNT(*) FROM core.events;"
   ```

3. **Check Logs**
   ```bash
   # Look for pattern detection logs
   journalctl -u heronclient-daemon -f | grep Pattern
   ```

### Telegram Alerts Not Sending

1. **Check HeronClient is Running**
   ```bash
   ps aux | grep heronclient
   ```

2. **Test Telegram API**
   ```bash
   curl -X POST http://localhost:3003/telegram/send \
     -H "Content-Type: application/json" \
     -d '{"chat_id": "7831636882", "text": "Test message"}'
   ```

### API Endpoints Not Responding

1. **Check HeronClient HTTP API**
   ```bash
   curl http://localhost:3005/api/health
   ```

2. **Check Port Availability**
   ```bash
   netstat -tlnp | grep 3005
   ```

## Monitoring

### Logs to Watch
```
[CommandTracker] Pattern detected: curl --version (5x)
[ActivityMonitor] Detected 3 patterns
[http-api] Learning created: cli - CLI Mastery: curl (5x)
[Telegram] Alert sent successfully
```

### Metrics
- Total commands tracked: Query `tracker.getStats()`
- Patterns detected: `SELECT COUNT(*) FROM core.patterns WHERE detected_at >= NOW() - INTERVAL '1 hour'`
- Learning events: `SELECT COUNT(*) FROM core.learnings WHERE source IN ('cli', 'pattern')`

## Performance

### Storage Usage
- Commands: ~1KB per command (in memory)
- Patterns: ~500 bytes per pattern
- Database: Optimized with indexes

### Response Times
- CLI tracking: <10ms (async)
- Pattern detection: <100ms
- API queries: <100ms
- Telegram alerts: <1s

## Maintenance

### Clear Old Data
```sql
-- Clear patterns older than 30 days
DELETE FROM core.patterns WHERE detected_at < NOW() - INTERVAL '30 days';

-- Clear CLI frequency older than 30 days
DELETE FROM core.cli_frequency WHERE created_at < NOW() - INTERVAL '30 days';
```

### Disable Pattern Detection
```bash
# Stop cron job
sudo rm /etc/cron.d/exocortex-patterns

# Or disable in CLI router (edit index.js)
```

### Reset Tracking
```bash
# Clear command tracker files
rm ~/.clawdbot/tracking/commands.json
rm ~/.clawdbot/tracking/patterns.json
```

## Integration Points

### CLI Router
- File: `/home/debian/testproj/mcp-servers/cli-router/index.js`
- Line: After CLI execution, calls `tracker.track()`

### HeronClient Daemon
- File: `/home/debian/code/heronclient/daemon/http/api-server.js`
- Port: 3005
- Endpoints: `/api/patterns/*`, `/api/events`

### Telegram Bot
- File: `/home/debian/code/heronclient/daemon/telegram/commands/patternAlerts.js`
- Triggers: High-confidence patterns only

### Activity Monitor
- File: `/home/debian/clawd/scripts/activity-monitor.js`
- Cron: Every 5 minutes

## Success Indicators

✅ CLI commands are tracked in real-time  
✅ Patterns are detected and logged  
✅ Telegram alerts are sent for high-confidence patterns  
✅ API endpoints return pattern data  
✅ Database tables are populated  
✅ Cron job runs successfully  
✅ Learning events are created automatically  

## Next Steps

1. **Test the system** with real CLI usage
2. **Monitor logs** for pattern detection
3. **Adjust confidence thresholds** if needed
4. **Add more pattern types** for richer insights
5. **Integrate with Phase 3** (Consolidated Learning Pipeline)

## Support

For issues or questions:
- Check logs: `journalctl -u heronclient-daemon -f`
- Review database: `psql -h 127.0.0.1 -U exocortex_app -d exocortex`
- Test endpoints: `curl http://localhost:3005/api/health`
- Review Phase 2 documentation: `/home/debian/clawd/PHASE2_IMPLEMENTATION_SUMMARY.md
