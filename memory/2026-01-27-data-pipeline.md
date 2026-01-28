# 2026-01-27 - Data Pipeline + Learning System Design

## Key Decisions

### Ae_path Evolution (Universal Learning)
- **Before**: Automation-focused learning (n8n workflows, CLI tools)
- **After**: Universal learning across ALL Exocortex sources
- **Rationale**: Only tracking automation misses 80% of learning opportunities
- **Impact**: SSOT becomes true knowledge base, not just workflow repository

### Feedback Loops Strategy
**Three-tier architecture:**
1. **Real-time**: CLI usage → Pattern detection → Instant insights
2. **Daily**: 24h activity → Clawdbot analysis → Learning events
3. **Reinforcement**: Spaced repetition → Telegram prompts → Mastery tracking

### Cross-Concept Linking
**New capability**: Connect learning across domains
- Example: "MCP Protocol" ← Telegram chat → "CLI Router" ← Tool usage → "n8n Webhook" ← Workflow
- Stored in: `core.learnings` with `related_concepts` array
- Visualized in: Ae_path knowledge graph

## Technical Changes

### New Table: core.learnings
```sql
- source: telegram, github, cli, workflow, insight
- concept: "What was learned"
- context: Full context
- confidence: 0.0 to 1.0
- reinforcement_level: 0-10
- next_review: Spaced repetition schedule
- related_concepts: Array of linked concepts
```

### CLI Router Enhancement
- Currently: Execute commands only
- Enhanced: Also logs `core.events` (type: 'cli_usage')
- Pattern detection: Same command 3x in 1 hour → Insight generation

### Heronclient Learning Commands (Planned)
- `/learn <concept>` - Add manual learning
- `/recall <topic>` - Search all sources
- `/insights` - Show clawdbot insights
- `/mastery` - Show concept mastery

## Implementation Phases

**Phase 1**: Universalize ae_path (Week 1)
**Phase 2**: Clawdbot → SSOT bridge (Week 1)
**Phase 3**: Real-time feedback loop (Week 2)
**Phase 4**: Daily summarization (Week 2)
**Phase 5**: Reinforcement scheduler (Week 3)
**Phase 6**: Learning commands (Week 3)
**Phase 7**: Dashboard v2 (Week 4)

## ship.sh Analysis

**Purpose**: Production deployment of entire Exocortex
**Actions**:
1. Commit + push all 7 repos
2. Rebuild unified docker compose
3. Validate nginx config
4. Deploy heronclient web app
5. Health checks

**Security Notes**:
- Uses Docker secrets for credentials
- Nginx handles TLS/SSL
- Services bind to localhost
- Webhook validation enabled

## Next Actions

1. **Review**: Let Christopher review PIPELINE_FEEDBACK_PLAN.md
2. **Approve**: If plan looks good, proceed with Phase 1
3. **Execute**: Start with ae_path universalization
4. **Integrate**: Connect Clawdbot insights to SSOT
5. **Deploy**: Use ship.sh for production rollout

## Memory Store
- Created: /home/debian/clawd/PIPELINE_FEEDBACK_PLAN.md (full spec)
- Created: /home/debian/clawd/SECURITY_AUDIT.md (security findings)
- Created: /home/debian/clawd/SECURITY_FIXES.sh (remediation script)
- Updated: AGENTS.md (with CLI router context)
- Updated: CLAUDE.md (will update with learning system)
- Updated: RULES.md (will update with new constraints)
- Updated: SKILLS.md (will add learning skill)

