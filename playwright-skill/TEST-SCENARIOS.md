# Exocortex Test Scenarios

## Overview
These scenarios cover the critical paths through the Exocortex distributed system.

## Scenario 1: Learning System End-to-End

### Steps
1. **Trigger Telegram Bot**
   - Send `/learn "Test Concept" "Test Details"` to Telegram bot
   - Verify bot acknowledges command (response within 2s)

2. **Verify Core Learnings Table**
   ```sql
   SELECT * FROM core.learnings WHERE concept = 'Test Concept';
   ```
   - Should contain: id, concept, details, created_at, user_id
   - Audit trail should show: learning_created event

3. **Check Ae_path Dashboard**
   - Navigate to https://ae-path.exocortex.ai/learnings
   - Wait for "Test Concept" to appear in list (max 5s)
   - Verify entry shows full details

4. **Trigger Review Prompt**
   - Wait for natural review interval (or trigger manually)
   - Verify notification sent to all surfaces

5. **Verify Review Tracking**
   - Check `core.reviews` table
   - Should show review_event with correct timestamp
   - Audit trail should show: review_created event

### Success Criteria
- ✅ Telegram acknowledges command in < 2s
- ✅ Learning appears in database within 3s
- ✅ Ae_path shows learning within 5s
- ✅ Review prompt triggers correctly
- ✅ Review tracked in database

### Failure Modes
- Network delay between surfaces
- Database transaction timeout
- WebSocket reconnection during operation
- Partial data loss on retry

## Scenario 2: WebSocket Reconnect with State Sync

### Steps
1. **Establish Connection**
   - Open web cockpit
   - Wait for WebSocket connection
   - Verify `[data-testid="ws-connected"]`

2. **Simulate Connection Drop**
   - Block WebSocket traffic
   - Verify graceful degradation
   - Check `[data-testid="offline-mode"]` appears

3. **Send Messages During Offline**
   - Create learning via UI
   - Queue actions locally
   - Verify `[data-testid="action-queued"]` indicators

4. **Reconnect**
   - Restore network
   - Verify WebSocket reconnect
   - Check `[data-testid="ws-connected"]` within 5s

5. **Verify Sync**
   - Check state consistency
   - Verify `[data-testid="ssot-synced"]`
   - Validate no data loss

### Success Criteria
- ✅ Connection established in < 2s
- ✅ Graceful degradation on disconnect
- ✅ Queued actions preserved
- ✅ Reconnect in < 5s
- ✅ Full state sync after reconnect
- ✅ No data loss

### Failure Modes
- Race condition during reconnect
- State drift between client and SSOT
- Duplicate events after retry
- Lost messages during downtime

## Scenario 3: Cross-Surface Consistency

### Steps
1. **Create Learning via CLI**
   ```bash
   exocortex learn create "CLI Concept" "Created via CLI"
   ```
   - Verify command execution
   - Check exit code is 0

2. **Verify Telegram Bot**
   - Should receive notification within 3s
   - Message should show concept and details
   - Audit trail entry created

3. **Check Ae_path Dashboard**
   - Navigate to web interface
   - Wait for learning to appear (max 5s)
   - Verify content matches CLI input

4. **Verify SSOT Database**
   ```sql
   SELECT * FROM core.learnings WHERE concept = 'CLI Concept';
   ```
   - Should exist with correct data
   - Audit trail should show complete

5. **Check Audit Trail**
   ```sql
   SELECT * FROM audit.events WHERE entity_id = <learning_id>;
   ```
   - Should have: created, synced_to_telegram, synced_to_web

### Success Criteria
- ✅ CLI command succeeds
- ✅ Telegram notification within 3s
- ✅ Ae_path shows learning within 5s
- ✅ Database entry complete
- ✅ Audit trail fully populated
- ✅ No duplicate records

### Failure Modes
- Event ordering issues
- Missing sync events
- Stale data in read model
- Write failure after partial success

## Scenario 4: Pattern Detection Flow

### Steps
1. **Execute CLI Command 3 Times**
   ```bash
   exocortex learn create "Pattern Test 1" "First instance"
   exocortex learn create "Pattern Test 2" "Second instance"
   exocortex learn create "Pattern Test 3" "Third instance"
   ```
   - Verify each succeeds
   - Track timestamps

2. **Wait for Pattern Detection (5 min)**
   - Monitor background job
   - Check pattern detection service logs

3. **Verify Pattern Created**
   ```sql
   SELECT * FROM patterns WHERE entity_type = 'learning' AND pattern_type = 'frequency';
   ```
   - Should detect pattern based on timing
   - Pattern confidence should be high (> 0.8)

4. **Check Insight Generation**
   ```sql
   SELECT * FROM insights WHERE pattern_id = <pattern_id>;
   ```
   - Should generate insight from pattern
   - Insight should contain recommendations

5. **Verify Telegram Alert**
   - Check for alert message
   - Should contain pattern summary
   - Should link to insights

### Success Criteria
- ✅ All 3 creations succeed
- ✅ Pattern detected within 5 min
- ✅ Pattern confidence > 0.8
- ✅ Insight generated with recommendations
- ✅ Telegram alert sent
- ✅ No false positives

### Failure Modes
- Pattern detection delay
- Low confidence score
- Missing insight generation
- Alert not sent
- False pattern detection

## Scenario 5: Performance Under Load

### Steps
1. **Concurrent Operations**
   - 10 users creating learnings simultaneously
   - Measure creation time for each
   - Track success rate

2. **High-Frequency WebSocket Events**
   - Generate 100 WebSocket events/sec for 30s
   - Monitor UI responsiveness
   - Check for frame drops

3. **Search Under Load**
   - While events are streaming
   - Execute complex searches
   - Measure response time

4. **Memory Usage**
   - Monitor heap usage over time
   - Check for memory leaks
   - Verify garbage collection

### Success Criteria
- ✅ All concurrent operations succeed
- ✅ Creation time < 1s per learning
- ✅ WebSocket events processed without queue build-up
- ✅ Search response time < 500ms
- ✅ Memory usage stable
- ✅ No UI freezes

### Failure Modes
- Rate limiting triggered
- Memory exhaustion
- UI unresponsiveness
- Event queue overflow

## Scenario 6: Visual Regression

### Steps
1. **Capture Baseline Screenshots**
   - Web cockpit dashboard
   - Learning list view
   - Detail view
   - Settings page

2. **Apply Changes**
   - Deploy new UI version
   - Run visual comparison

3. **Compare Screenshots**
   - Pixel difference < 1%
   - Layout shift detected
   - Color changes identified

4. **Report Differences**
   - Generate visual diff report
   - Mark acceptable vs unacceptable changes
   - Manual review for critical areas

### Success Criteria
- ✅ Baseline established
- ✅ Visual diffs < 1% (non-critical)
- ✅ No layout breaking changes
- ✅ Changes documented

### Failure Modes
- CSS regression
- Font rendering changes
- Layout shift
- Color palette changes

## Scenario 7: Data Recovery

### Steps
1. **Simulate Data Corruption**
   - Corrupt local app state
   - Trigger state validation

2. **Initiate Recovery**
   - Request SSOT reconciliation
   - Verify recovery process starts

3. **Verify Data Integrity**
   - Compare recovered data with SSOT
   - Check for missing records
   - Validate relationships

4. **Confirm Recovery**
   - All surfaces show consistent data
   - Audit trail shows recovery event
   - No data loss

### Success Criteria
- ✅ Corruption detected
- ✅ Recovery completes
- ✅ Data integrity verified
- ✅ No data loss
- ✅ Recovery event logged

### Failure Modes
- Recovery timeout
- Partial recovery
- Data loss
- Inconsistent state

## Scenario 8: Audit Trail Completeness

### Steps
1. **Trigger Complex Workflow**
   - Create learning (multi-surface)
   - Update learning (CLI + Web)
   - Delete learning (API)

2. **Query Audit Trail**
   ```sql
   SELECT * FROM audit.events 
   WHERE entity_id = <learning_id>
   ORDER BY created_at;
   ```
   - Should show full lifecycle
   - All events should be traceable

3. **Verify Event Integrity**
   - Each event has: timestamp, source, action, data
   - No missing events
   - Event order preserved

4. **Check Cross-Surface Consistency**
   - Events should appear on all surfaces
   - No orphaned events

### Success Criteria
- ✅ Complete lifecycle tracked
- ✅ All events have required fields
- ✅ Event order preserved
- ✅ Cross-surface consistency

### Failure Modes
- Missing events
- Incomplete data
- Event ordering issues
- Orphaned events

## Quick Test Commands

```bash
# Run all scenarios
cd /home/debian/code/heronclient
npx playwright test

# Run specific scenario
npx playwright test heronclient.spec.js
npx playwright test cross-surface.spec.js
npx playwright test websocket.spec.js
npx playwright test fault-injection.spec.js
npx playwright test performance.spec.js

# Run with specific tags
npx playwright test --grep @critical
npx playwright test --grep @smoke
npx playwright test --grep @regression

# Generate report
npx playwright show-report
```

## Monitoring & Debugging

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

### Video Playback
```bash
# Videos are saved on failure
open test-results/video.webm
```

### Network Logs
```bash
# HAR files saved in test-results
cat test-results/network.har | jq .
```

### Database Queries
```sql
-- Check recent learning creations
SELECT created_at, concept, user_id 
FROM core.learnings 
ORDER BY created_at DESC 
LIMIT 10;

-- Check audit trail completeness
SELECT entity_type, action, COUNT(*) as count
FROM audit.events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY entity_type, action;

-- Check for orphaned events
SELECT * FROM audit.events ae
LEFT JOIN core.learnings cl ON ae.entity_id = cl.id
WHERE ae.entity_type = 'learning' AND cl.id IS NULL;
```

## Success Metrics

- **Test Pass Rate**: > 95%
- **Mean Time to Detect (MTTD)**: < 5 minutes
- **Mean Time to Recovery (MTTR)**: < 10 minutes
- **Cross-Surface Consistency**: 100%
- **Data Loss Events**: 0
- **False Positive Rate**: < 5%
- **Test Execution Time**: < 10 minutes (full suite)
