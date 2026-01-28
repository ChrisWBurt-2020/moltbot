# Phase 1 Started: Universalize Ae_path

**Task**: Transform ae_path from automation-only to universal learning system

**Status**: Sub-agent spawned and working

## What's Being Done

### 1. Database Schema (heronclient)
```sql
-- Create core.learnings table
CREATE TABLE core.learnings (
    id UUID PRIMARY KEY,
    source VARCHAR(50),           -- telegram, github, cli, workflow, insight, audio
    concept VARCHAR(200),
    context TEXT,
    confidence FLOAT,
    reinforcement_level INTEGER,
    next_review TIMESTAMPTZ,
    last_reviewed TIMESTAMPTZ,
    metadata JSONB,
    related_concepts TEXT[]
);

-- Add learning_id to core.items
ALTER TABLE core.items ADD COLUMN learning_id UUID REFERENCES core.learnings(id);
```

### 2. Ae_path Webhook Handler
**Location**: `/home/debian/code/ae_path/src/webhookHandler.js`

**Changes**:
- Accept all source types (not just automation)
- Insert into core.learnings table
- Emit real-time updates to dashboard

### 3. CLI Router Enhancement
**Location**: `/home/debian/testproj/mcp-servers/cli-router/index.js`

**Changes**:
- Log learning events after CLI execution
- Track frequency and patterns
- Send to ae_path webhook

### 4. Clawdbot → SSOT Bridge
**Location**: `/home/debian/clawd/scripts/daily-insights.js`

**Changes**:
- Daily 2 AM job
- Query 24h activity from SSOT
- Generate insights
- Store in core.learnings

### 5. Ae_path Frontend Updates
**Location**: `/home/debian/code/ae_path/frontend/`

**Changes**:
- Multi-source dashboard
- Concept linking visualization
- Spaced repetition queue
- Mastery tracking

### 6. Documentation Updates
**Files**:
- `/home/debian/testproj/CLAUDE.md`
- `/home/debian/testproj/AGENTS.md`
- `/home/debian/testproj/SKILLS.md`
- `/home/debian/testproj/RULES.md`

## Success Criteria

✅ Core.learnings table created
✅ Ae_path accepts all sources
✅ CLI logs learning events
✅ Daily insight job runs
✅ Frontend shows cross-source learning
✅ Docs updated

## Time Estimate
~4.5 hours of work

## Deployment
After Phase 1 completion:
```bash
cd /home/debian/testproj
./ship.sh
```

## Follow-up

**Phase 2** (Week 2): Real-time pattern detection
**Phase 3** (Week 2): Daily summarization
**Phase 4** (Week 3): Reinforcement scheduler
**Phase 5** (Week 3): Learning commands
**Phase 6** (Week 4): Dashboard v2

---

**Status**: Implementation in progress
**Sub-agent**: Working on database schema and webhook handlers
