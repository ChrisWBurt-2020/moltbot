# Quick Start: Knowledge Graph

## Prerequisites

1. **Database running** (exocortex-postgres)
2. **Heronclient daemon running** (for API)
3. **At least 2 learnings in database**

## Step 1: Add Sample Learnings

```bash
# Create 3 related learnings
curl -X POST http://localhost:3003/api/learnings \
  -H "Content-Type: application/json" \
  -d '{
    "source": "telegram",
    "concept": "MCP Protocol",
    "context": "Discussed with Christopher about scaling MCP for distributed systems",
    "confidence": 0.9
  }'

curl -X POST http://localhost:3003/api/learnings \
  -H "Content-Type: application/json" \
  -d '{
    "source": "cli",
    "concept": "CLI Router",
    "context": "Related to MCP protocol and request routing patterns",
    "confidence": 0.85
  }'

curl -X POST http://localhost:3003/api/learnings \
  -H "Content-Type: application/json" \
  -d '{
    "source": "github",
    "concept": "Distributed Systems",
    "context": "MCP protocol patterns in distributed architecture",
    "confidence": 0.8
  }'
```

## Step 2: Run Concept Linker

```bash
cd /home/debian/clawd

# Set your database password
export DB_PASSWORD='your_password'

# Run the linker
node scripts/run-concept-linker.js
```

**Expected output**:
```
🔄 Starting Concept Linker...

📊 Analyzing learnings and creating relationships...

✅ Concept Linking Complete!
   • Learnings processed: 3
   • Relationships created: 3
   • Message: Successfully linked 3 concept relationships

📈 Current Statistics:
   • Total learnings: 3
   • Total relationships: 3
   • Total clusters: 1

🔗 Top Relationships:
   1. "MCP Protocol" ↔ "Distributed Systems" (0.85)
   2. "MCP Protocol" ↔ "CLI Router" (0.72)
   3. "CLI Router" ↔ "Distributed Systems" (0.65)

🌐 Top Clusters:
   1. MCP Protocol, CLI Router, Distributed Systems (3 concepts)

✨ Done!
```

## Step 3: Query the Knowledge Graph

### Via API

```bash
# Get full graph
curl http://localhost:3003/api/graph/full | jq .

# Get clusters
curl http://localhost:3003/api/graph/clusters | jq .

# Get specific concept graph
LEARNING_ID=$(curl -s http://localhost:3003/api/graph/full | jq -r '.nodes[0].id')
curl "http://localhost:3003/api/graph/concept?id=$LEARNING_ID" | jq .
```

### Via Telegram

```
/graph "MCP Protocol"
/clusters
```

### Via Database

```bash
# View relationships
PGPASSWORD='Exo@3Pass@3' psql -h 127.0.0.1 -U exocortex_app -d exocortex \
  -c "SELECT l1.concept, l2.concept, similarity_score \
      FROM core.concept_relationships lr \
      JOIN core.learnings l1 ON lr.learning_id = l1.id \
      JOIN core.learnings l2 ON lr.related_learning_id = l2.id \
      ORDER BY similarity_score DESC;"

# View clusters
PGPASSWORD='Exo@3Pass@3' psql -h 127.0.0.1 -U exocortex_app -d exocortex \
  -c "SELECT concepts, size FROM core.concept_clusters ORDER BY size DESC;"
```

## Step 4: Test Everything

```bash
# Run comprehensive test
cd /home/debian/clawd
node scripts/test-graph-api.js
```

## Schedule Daily Updates

Add to crontab for automatic daily linking:

```bash
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * cd /home/debian/clawd && node scripts/cron/daily-concept-linking.js >> /var/log/concept-linker.log 2>&1
```

## Verify Installation

```bash
# Check if tables exist
PGPASSWORD='Exo@3Pass@3' psql -h 127.0.0.1 -U exocortex_app -d exocortex \
  -c "\d core.concept_relationships"

# Check if data exists
PGPASSWORD='Exo@3Pass@3' psql -h 127.0.0.1 -U exocortex_app -d exocortex \
  -c "SELECT COUNT(*) FROM core.concept_relationships;"

# Test API
curl -s http://localhost:3003/api/health | jq '.ok'
# Should return: true
```

## Troubleshooting

### Problem: No relationships created

**Solution**:
1. Check you have at least 2 learnings: `SELECT COUNT(*) FROM core.learnings`
2. Run concept linker: `node scripts/run-concept-linker.js`
3. Check logs for errors

### Problem: API returns 404

**Solution**:
1. Ensure heronclient is running: `docker ps | grep heronclient`
2. Check daemon logs: `docker logs exocortex-heronclient`
3. Verify port 3003: `curl http://localhost:3003/api/health`

### Problem: Database connection error

**Solution**:
1. Set DB_PASSWORD environment variable
2. Check database is running: `docker ps | grep postgres`
3. Verify credentials in .env file

## Next Steps

1. **Add more learnings** from different sources
2. **Run linker daily** via cron job
3. **Integrate with AE Path** dashboard for visualization
4. **Use in recommendations** for learning suggestions

## Useful Commands

```bash
# View all learnings
PGPASSWORD='Exo@3Pass@3' psql -h 127.0.0.1 -U exocortex_app -d exocortex \
  -c "SELECT source, concept, created_at FROM core.learnings ORDER BY created_at;"

# Find cross-source concepts
PGPASSWORD='Exo@3Pass@3' psql -h 127.0.0.1 -U exocortex_app -d exocortex \
  -c "SELECT l.concept, ARRAY_AGG(DISTINCT l.source) as sources \
      FROM core.learnings l \
      GROUP BY l.concept \
      HAVING COUNT(DISTINCT l.source) >= 2;"

# Find concepts with most connections
PGPASSWORD='Exo@3Pass@3' psql -h 127.0.0.1 -U exocortex_app -d exocortex \
  -c "SELECT l.concept, COUNT(lr.id) as connections \
      FROM core.learnings l \
      LEFT JOIN core.concept_relationships lr ON l.id = lr.learning_id \
      GROUP BY l.id \
      ORDER BY connections DESC;"
```

## Success Indicators

✅ Database has `core.concept_relationships` table  
✅ Database has `core.concept_clusters` table  
✅ `SELECT COUNT(*) FROM core.concept_relationships` returns > 0  
✅ `curl http://localhost:3003/api/graph/full` returns data  
✅ Telegram `/graph` command works  
✅ Daily cron job runs without errors  

## Documentation

- Full documentation: `/home/debian/code/ae_path/src/services/KNOWLEDGE_GRAPH_README.md`
- Implementation summary: `/home/debian/clawd/PHASE5_IMPLEMENTATION_SUMMARY.md`
- API reference: See heronclient/daemon/http/api-server.js
