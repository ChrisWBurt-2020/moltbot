# Exocortex Data Pipeline + Feedback Loop Enhancement

## Vision: Unified Learning & Intelligence Layer

Transform the Exocortex from a **passive knowledge repository** into an **active learning system** where:
- Every interaction becomes a learning opportunity
- Clawdbot insights feed back into the system
- Ae_path evolves from automation-learning to universal-learning
- Feedback loops reinforce understanding across all domains

---

## 1. CURRENT PIPELINE MAPPING

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA INGESTION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Telegram (Voice/Text) → heronclient → SSOT                 │
│  ────────────────────────────────────────────────────────   │
│    • Voice → Whisper → Transcript                            │
│    • Text → Commands → MCP tools                             │
│    • Events → core.events                                   │
│    • Documents → core.documents                             │
│    • Items → core.items                                     │
│                                                              │
│  GitHub → Webhook → n8n → SSOT                              │
│  ────────────────────────────────────────────────────────   │
│    • Commits, PRs, stars → core.events                      │
│    • Daily digest (planned)                                 │
│                                                              │
│  RSS → heronfeed → n8n → SSOT                               │
│  ────────────────────────────────────────────────────────   │
│    • Feed items → AI enrichment → core.documents            │
│                                                              │
│  ae_path → n8n → SSOT                                       │
│  ────────────────────────────────────────────────────────   │
│    • Learning progress → core.items (learning_snapshot)     │
│                                                              │
│  CLI → ❌ Not tracked                                       │
│  ────────────────────────────────────────────────────────   │
│    • Commands executed → No data                            │
│                                                              │
│  Clawdbot → ❌ Not integrated                               │
│  ────────────────────────────────────────────────────────   │
│    • Daily insights → Nowhere                               │
│    • Analysis → Lost                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PROCESSING & STORAGE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PostgreSQL SSOT (pgvector)                                 │
│  ────────────────────────────────────────────────────────   │
│    core.items       → Tasks, notes, learning snapshots      │
│    core.documents   → Content with embeddings               │
│    core.events      → Activity log                          │
│    core.embeddings  → Vector search                         │
│    core.capsules    → Context                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    OUTPUT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Telegram → Replies, alerts                                 │
│  ae_path → Learning dashboard PWA                           │
│  Daily Digest → Summary reports (planned)                   │
│  Monitoring → Health checks                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. IDENTIFIED GAPS & PROBLEMS

### Gap 1: **Clawdbot Isolation**
- **Problem**: Daily AI insights go nowhere
- **Impact**: Intelligence not fed back into Exocortex
- **Example**: "Pattern detected: You use CLI X 3x daily" → Lost

### Gap 2: **Ae_path Scope Limitation**
- **Problem**: Only tracks automation concepts
- **Impact**: Misses learning from Telegram, GitHub, CLI
- **Example**: "Learned about MCP from conversation" → Not tracked

### Gap 3: **No Cross-Source Learning**
- **Problem**: Each source is siloed
- **Impact**: Can't link related concepts
- **Example**: CLI command → GitHub commit → ae_path concept

### Gap 4: **Weak Feedback Loops**
- **Problem**: One-way data flow
- **Impact**: System doesn't learn from patterns
- **Example**: Repeated questions → No adaptation

### Gap 5: **CLI Commands Invisible**
- **Problem**: No tracking of tool usage
- **Impact**: Missing learning opportunities
- **Example**: "ffmpeg used 5x today" → Not a learning event

---

## 3. PROPOSED SOLUTIONS

### Solution 1: **Universal Learning Layer (ae_path 2.0)**

**Change ae_path from automation-only to universal learning:**

```typescript
interface LearningEvent {
  source: 'telegram' | 'github' | 'cli' | 'workflow' | 'insight';
  concept: string;
  context: string;
  timestamp: string;
  confidence: number;
  reinforcement_level: number;  // 0-10
  related_concepts: string[];    // Links to other learnings
}

// Example events:
{
  source: 'telegram',
  concept: 'MCP Protocol',
  context: 'Discussed with Christopher about scaling',
  timestamp: '2026-01-27T22:00:00Z',
  confidence: 0.9,
  reinforcement_level: 2,
  related_concepts: ['Exocortex', 'CLI Router']
}
```

**Ae_path 2.0 Features:**
- **Source agnostic**: Tracks learning from ANY interaction
- **Spaced repetition**: Reinforces concepts over time
- **Concept linking**: Connects CLI ↔ GitHub ↔ Telegram
- **Exocortex mastery**: Tracks understanding of the system itself

### Solution 2: **Clawdbot Integration**

**New flow: Clawdbot → SSOT → Feedback**

```
Daily Clawdbot Insights
    ↓
core.items (type: 'insight', source: 'clawdbot')
    ↓
Heronclient queries insights for context
    ↓
Cross-reference with recent activity
    ↓
Generate reinforcement reminders
    ↓
ae_path for spaced repetition
```

**Commands:**
- `/insights` - Show recent clawdbot insights
- `/learn <concept>` - Manually add learning
- `/recall <topic>` - Search across all sources

### Solution 3: **Feedback Loop Architecture**

#### Loop 1: **Real-time Pattern Detection**
```
Activity → Pattern detection → Insight → SSOT → ae_path
```

**Example:**
1. You use `ffmpeg` 5x in 1 hour (CLI router detects)
2. Create insight: "High ffmpeg usage - learning opportunity"
3. Store in core.items
4. Add to ae_path spaced repetition
5. Next day: "Ready to learn more about ffmpeg?" (Telegram)

#### Loop 2: **Daily Summarization**
```
24h Events → Clawdbot analysis → Insights → SSOT
```

**Example:**
1. Collect: Telegram messages, GitHub commits, CLI usage
2. Clawdbot analyzes: "You're focusing on audio processing"
3. Create insight: "Pattern: Audio pipeline work"
4. Link related concepts: ffmpeg, Whisper, sox
5. Store in ae_path with reinforcement schedule

#### Loop 3: **Learning Reinforcement**
```
Concept (ae_path) → Spaced repetition → Telegram reminder → SSOT update
```

**Example:**
1. Concept: "MCP Protocol" learned 3 days ago
2. Due for reinforcement (spaced repetition)
3. Telegram bot asks: "Recall: What is MCP?"
4. Your answer → update reinforcement level
5. Next review scheduled

### Solution 4: **CLI Command Integration**

**Track CLI usage as learning events:**

```json
{
  "source": "cli",
  "concept": "ffmpeg audio conversion",
  "context": "convert mp3 to wav",
  "command": "ffmpeg -i input.mp3 output.wav",
  "frequency": 3,
  "timestamp": "2026-01-27T22:00:00Z"
}
```

**Flow:**
1. CLI router executes command
2. Logs to core.events (type: 'cli_usage')
3. Detects patterns (same command, frequency)
4. Creates learning event in ae_path
5. Reinforces tool mastery

### Solution 5: **Cross-Concept Linking**

**The "Exocortex Knowledge Graph":**

```
Concept: "Audio Processing"
├─ Source 1: Telegram chat about Whisper
├─ Source 2: GitHub commit using ffmpeg
├─ Source 3: CLI command: sox effects
└─ Source 4: Workflow: n8n audio pipeline

Link: All reference "audio" domain
Spaced repetition: Review all weekly
Reinforcement: Track mastery across sources
```

---

## 4. IMPLEMENTATION ROADMAP

### Phase 1: **Ae_path Universalization** (Week 1)
- [ ] Update ae_path schema to accept all sources
- [ ] Create learning event ingestion endpoint
- [ ] Add concept linking capability
- [ ] Implement spaced repetition algorithm
- [ ] Migrate existing automation data

### Phase 2: **Clawdbot → SSOT Bridge** (Week 1)
- [ ] Create daily insight job
- [ ] Store insights in core.items
- [ ] Build `/insights` command in heronclient
- [ ] Add insight queries to CLI router

### Phase 3: **Feedback Loop 1: Real-time** (Week 2)
- [ ] CLI router logging to core.events
- [ ] Pattern detection for high-frequency commands
- [ ] Telegram alerts for learning opportunities
- [ ] Auto-insight generation

### Phase 4: **Feedback Loop 2: Daily** (Week 2)
- [ ] Daily summarization job (2 AM)
- [ ] Clawdbot analysis of 24h activity
- [ ] Cross-source pattern detection
- [ ] Generate ae_path concepts

### Phase 5: **Feedback Loop 3: Reinforcement** (Week 3)
- [ ] Spaced repetition scheduler
- [ ] Telegram learning prompts
- [ ] Progress tracking
- [ ] Concept mastery scoring

### Phase 6: **Heronclient Learning Commands** (Week 3)
- `/learn <concept>` - Add manual learning
- `/recall <topic>` - Search all sources
- `/insights` - Show clawdbot insights
- `/mastery` - Show concept mastery levels

### Phase 7: **Dashboard v2** (Week 4)
- [ ] Ae_path 2.0 UI with all sources
- [ ] Concept timeline
- [ ] Mastery heat map
- [ ] Learning recommendations

---

## 5. DATA MODEL CHANGES

### New Table: `core.learnings`
```sql
CREATE TABLE core.learnings (
    id UUID PRIMARY KEY,
    source VARCHAR(50),           -- telegram, github, cli, workflow, insight
    concept VARCHAR(200),         -- What was learned
    context TEXT,                 -- Full context
    confidence FLOAT,             -- 0.0 to 1.0
    reinforcement_level INT,      -- 0-10
    next_review TIMESTAMPTZ,      -- Spaced repetition
    last_reviewed TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    metadata JSONB                -- Source-specific data
);

CREATE INDEX idx_learnings_source ON core.learnings(source);
CREATE INDEX idx_learnings_next_review ON core.learnings(next_review);
CREATE INDEX idx_learnings_concept ON core.learnings(concept);
```

### Modified: `core.items`
Add learning relationship:
```sql
ALTER TABLE core.items ADD COLUMN learning_id UUID REFERENCES core.learnings(id);
```

### Modified: `core.events`
Add learning events:
```sql
-- Add learning event types:
-- 'cli_usage', 'insight_generated', 'learning_reinforcement', 'concept_link'
```

---

## 6. NEW WORKFLOWS

### Workflow 1: **Daily Intelligence Report**
```
Time: 2:00 AM
Trigger: Cron

Steps:
1. Aggregate: Telegram messages, GitHub activity, CLI usage
2. Analyze: Clawdbot identifies patterns
3. Generate: 3-5 insights
4. Store: core.items (type: 'insight')
5. Update: ae_path concepts
6. Alert: Summary to Telegram (optional)
```

### Workflow 2: **Real-time Pattern Detection**
```
Trigger: Any activity in core.events

Steps:
1. Check last hour activity
2. Detect patterns (same command 3x, same topic discussed)
3. Create insight event
4. Store in core.learnings
5. Queue for ae_path reinforcement
```

### Workflow 3: **Spaced Repetition**
```
Time: 9:00 AM daily
Trigger: Items due for review

Steps:
1. Query: WHERE next_review < NOW()
2. For each concept:
   - Send Telegram prompt
   - Wait for answer
   - Update reinforcement level
   - Schedule next review
```

---

## 7. CLI ROUTER INTEGRATION

### Extend CLI Router to Track Learning

**Current:** CLI Router executes commands
**Enhanced:** CLI Router also logs learning events

```javascript
// After execution
if (successful && isFrequent) {
  await createLearningEvent({
    source: 'cli',
    concept: `${command} usage`,
    context: `${command} ${args.join(' ')} executed ${frequency}x`,
    confidence: 0.8,
    metadata: { command, frequency }
  });
}
```

### Examples:
- `ffmpeg` used 5x → "ffmpeg mastery" concept
- `git` commands → "Git workflow patterns"
- `docker` → "Container orchestration"

---

## 8. AE_PATH 2.0: UNIVERSAL LEARNING APP

### Current Scope (Too Narrow)
- Automation concepts only
- n8n workflows
- CLI tools for automation

### New Scope (Universal)
- **All domains**: Telegram chats, GitHub, CLI, workflows, insights
- **Concept linking**: "MCP from chat" → "CLI router" → "n8n webhook"
- **Exocortex mastery**: Track understanding of your own system
- **Cross-pollination**: Learn from one domain, apply to others

### Features:
1. **Source Timeline**: See learning sources over time
2. **Concept Graph**: Visual links between concepts
3. **Mastery Score**: Track proficiency by source
4. **Reinforcement**: Spaced repetition with context
5. **Recommendations**: "Learn more about X based on Y"

---

## 9. CLAWDBOT INTEGRATION STRATEGY

### Daily Integration
```bash
# Morning (6 AM)
# 1. Clawdbot reads SSOT
# 2. Analyzes: "What happened yesterday?"
# 3. Generates insights
# 4. Stores in core.items

# Evening (8 PM)
# 1. Review today's activity
# 2. Predict tomorrow's needs
# 3. Prepare learning prompts
```

### Insight Types:
1. **Pattern**: "You use CLI X frequently"
2. **Recommendation**: "Try CLI Y for Z task"
3. **Learning**: "Concept X relates to Y"
4. **Alert**: "System event detected"

---

## 10. IMPLEMENTATION CHECKLIST

### Infrastructure
- [ ] Extend `core.learnings` table
- [ ] Update ae_path webhook handlers
- [ ] Modify CLI router for logging
- [ ] Add pattern detection service

### Integration
- [ ] Clawdbot → SSOT pipeline
- [ ] Telegram commands: `/learn`, `/recall`, `/insights`
- [ ] Daily summarization cron job
- [ ] Spaced repetition scheduler

### Ae_path v2
- [ ] UI updates for multi-source
- [ ] Concept linking visualization
- [ ] Mastery tracking
- [ ] Reinforcement prompts

### Testing
- [ ] End-to-end pipeline test
- [ ] Learning event creation
- [ ] Concept linking accuracy
- [ ] Feedback loop validation

---

## 11. EXPECTED OUTCOMES

### Before
- Siloed data sources
- No learning reinforcement
- Passive knowledge storage
- Weak feedback loops

### After
- Active learning system
- Cross-domain insights
- Reinforced understanding
- Intelligent feedback loops
- Unified learning experience

---

## 12. SUMMARY

**The Goal:** Transform Exocortex from a **knowledge repository** into a **learning system** where:
- Every interaction teaches the system about you
- You learn from the system's insights
- Concepts reinforce across domains
- Clawdbot becomes a learning companion
- Ae_path tracks universal mastery

**Key Changes:**
1. Ae_path: Automation → Universal learning
2. CLI Router: Execution → Execution + Learning
3. Clawdbot: Isolated → Integrated feedback loop
4. Data Flow: One-way → Circular (feedback)

**Next Steps:**
1. Approve this plan
2. Start with Ae_path universalization
3. Add Clawdbot bridge
4. Implement feedback loops
5. Monitor and refine

Ready to proceed with Phase 1?
