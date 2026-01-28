# Phase 3 Started: Reinforcement Scheduler

**Status**: Sub-agent spawned and working

## What's Being Implemented

### 1. Spaced Repetition Algorithm
**File**: `/home/debian/code/ae_path/src/services/repetitionScheduler.js`

**Algorithm**: Intervals based on reinforcement level (0-10)
- Level 1: 1 day
- Level 2: 3 days
- Level 3: 7 days
- Level 4: 14 days
- Level 5: 30 days
- Level 6: 60 days
- Level 7: 90 days
- Level 8-10: 180 days

**Adjustment**: Confident responses → shorter intervals (faster mastery)

### 2. Telegram Learning Commands
**File**: `/home/debian/code/heronclient/daemon/telegram/commands/learning.js`

**New Commands:**
- `/learn <concept>` - Add manual learning
- `/recall <topic>` - Test knowledge
- `/review` - Show due items
- `/mastery` - Show dashboard

### 3. Review Tracking API
**File**: `/home/debian/code/heronclient/daemon/http/api-server.js`

**Endpoints:**
- `POST /api/reviews` - Submit review response
- `GET /api/reviews/progress` - Get learning timeline
- `GET /api/reviews/due` - Get due items

### 4. Mastery Scoring System
**File**: `/home/debian/code/ae_path/src/services/masteryCalculator.js`

**Metrics:**
- Overall mastery score (0-10)
- Source-specific scores
- Concept-specific scores
- Review statistics

### 5. Ae_path Dashboard Updates
**File**: `/home/debian/code/ae_path/app.js`

**Features:**
- Due reviews section
- Progress charts
- Spaced repetition calendar
- Mastery heatmaps

### 6. Daily Review Job
**File**: `/home/debian/clawd/scripts/daily-review-prompt.js`

**Schedule**: 9 AM daily
**Action**: Send top 5 due items to Telegram

### 7. Database Migrations
**File**: `/home/debian/code/heronclient/migrations/20260128_add_reviews_table.sql`

**Tables:**
- `core.reviews` - Track review attempts
- `core.daily_stats` - Daily review statistics

### 8. Documentation Updates
**Files to update:**
- `/home/debian/testproj/CLAUDE.md` - Add review commands
- `/home/debian/testproj/AGENTS.md` - Update with Phase 3
- `/home/debian/testproj/SKILLS.md` - Learning skill updates
- `/home/debian/testproj/RULES.md` - New constraints

## Implementation Progress

**Phase 3 Goals:**
- [ ] Spaced repetition algorithm
- [ ] Telegram learning commands
- [ ] Review tracking API
- [ ] Mastery scoring
- [ ] Ae_path UI updates
- [ ] Daily review job
- [ ] Database migrations
- [ ] Documentation

## Next Steps After Phase 3

**Phase 4** (Week 2): Real-time pattern detection
- Detect high-frequency CLI commands
- Auto-generate insights
- Telegram alerts

**Phase 5** (Week 2): Daily summarization
- 24h activity analysis
- Clawdbot insights
- Cross-source patterns

**Phase 6** (Week 3): Cross-concept linking
- Knowledge graph visualization
- Related concept discovery
- Learning recommendations

**Phase 7** (Week 3): Advanced analytics
- Learning velocity
- Mastery acceleration
- Concept clusters

**Phase 8** (Week 4): Dashboard v2 with AI recommendations
- Personalized learning paths
- Smart review scheduling
- Predictive mastery

## Deployment Plan

After Phase 3 completion:
1. Run migrations
2. Update Ae_path frontend
3. Test all new commands
4. Deploy via ship.sh
5. Monitor daily review job

## Time Estimate
~6 hours for full implementation

---

**Status**: Implementation in progress
**Sub-agent**: Working on spaced repetition algorithm and review system
