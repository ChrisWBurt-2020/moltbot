# n8n Workflow Import Issue - Diagnosis & Fix

## Problem Summary

You're experiencing a tedious workflow:
1. Download workflow JSON from VPS via `docker cp`
2. Upload to local n8n UI (localhost)
3. Test/debug locally
4. Download fixed workflow
5. Upload back to VPS

**Root Cause**: The `n8n import:workflow` CLI command has a bug with foreign key constraints on `workflow_publish_history`.

## Documentation Review Results

### ✅ Found in CLAUDE.md

**CRITICAL DOCUMENTATION** (Line 1-10):
```
DO NOT use `n8n import:workflow` CLI - it has a bug with 
foreign key constraints on `workflow_publish_history`.

Use either:
1. sync_workflows.js (recommended): docker exec n8nself-n8n-1 node /sync_workflows.js
2. Direct SQL import: import_workflows_sql.sh
```

### ✅ Found in SKILLS.md

**n8n Workflow Management Section**:
- `check_n8n_health.sh` - Health check
- `sync_workflows.js` - Recommended import method
- `import_workflows_sql.sh` - Direct SQL method

### ✅ Found in n8nself repository

**File**: `/home/debian/code/n8nself/sync_workflows.js`

**How sync_workflows.js works**:
1. Waits for n8n API to be ready (up to 180 retries)
2. Lists existing workflows via API
3. For each JSON file:
   - Normalizes workflow (removes IDs, meta fields)
   - Upserts via REST API (POST or PUT)
   - Sets activation state
   - Handles credential checks
4. Prunes duplicates if configured

## The Solution: Use sync_workflows.js

### Current Setup (Broken)

```bash
# ❌ DON'T - n8n CLI has bugs
n8n import:workflow --input /path/to/workflow.json

# ❌ DON'T - Manual uploads are tedious
# 1. docker cp from VPS
# 2. Upload to local n8n
# 3. Download fixed workflow
# 4. Upload back to VPS
```

### Recommended Solution

```bash
# ✅ DO - Use sync_workflows.js
cd /home/debian/code/n8nself

# 1. Export workflow from VPS n8n UI
# 2. Save as JSON in ./workflows/
# 3. Run sync script
docker exec n8nself-n8n-1 node /sync_workflows.js

# 4. Restart to activate
docker compose restart n8n
```

### Environment Setup (Required)

**File**: `/home/debian/code/n8nself/.env`

**Required variables**:
```bash
# n8n API Key (generate in n8n UI: Settings → API → API Key)
N8N_API_KEY=your_api_key_here

# Enable workflow import on startup
N8N_IMPORT_WORKFLOWS_ON_STARTUP=true

# Workflow directory (inside container)
N8N_WORKFLOW_IMPORT_DIR=/workflows

# Retry settings (for slow hosts)
N8N_WORKFLOW_SYNC_MAX_RETRIES=180
N8N_WORKFLOW_SYNC_RETRY_DELAY_MS=2000
```

### Credential Management

**CRITICAL**: All workflows must use consistent credential IDs.

**Current credentials in n8n** (from CLAUDE.md):
| ID | Name | Type | Target |
|----|------|------|--------|
| `859Eo9sO2FSamAlD` | ExoCortex PostgreSQL | postgres | SSOT |
| `4Acr5KQtgMtFys4X` | LeadDB Postgres | postgres | n8n metadata |
| `gemini-api-key` | Gemini API Key | httpQueryAuth | Gemini |

**Problem**: When importing workflows, credential IDs may mismatch.

**Solution**: sync_workflows.js handles credential validation.

### Step-by-Step Fix

#### 1. Set Up sync_workflows.js

```bash
# Edit environment
nano /home/debian/code/n8nself/.env

# Add:
N8N_API_KEY=your_api_key_from_n8n_ui
N8N_IMPORT_WORKFLOWS_ON_STARTUP=true
N8N_WORKFLOW_IMPORT_DIR=/workflows

# Ensure workflows directory exists
mkdir -p /home/debian/code/n8nself/workflows
```

#### 2. Get n8n API Key

```bash
# If n8n is running:
# 1. Open browser: https://n8n.quantumheronlabs.com
# 2. Settings → API → Enable API
# 3. Copy API key
# 4. Add to .env file
```

#### 3. Export Workflow from VPS

**Option A: From n8n UI (Recommended)**
```bash
# 1. Open https://n8n.quantumheronlabs.com
# 2. Find workflow
# 3. Click ⋮ → Download
# 4. Save as JSON
```

**Option B: From Database (If UI broken)**
```bash
# Get workflow JSON from database
docker exec exocortex-n8n-postgres psql -U leaddb -d leaddb -c \
  "SELECT workflow_entity FROM workflow_entity WHERE name = 'Your Workflow';" \
  > /home/debian/code/n8nself/workflows/workflow.json
```

**Option C: Via Docker cp (Current method)**
```bash
# From VPS
docker cp exocortex-n8n:/root/.n8n/workflows/workflow.json \
  /home/debian/code/n8nself/workflows/
```

#### 4. Run sync_workflows.js

```bash
# Sync workflows
docker exec exocortex-n8n node /sync_workflows.js

# Check logs
docker logs exocortex-n8n --tail 50
```

#### 5. Verify Import

```bash
# Check workflows in database
docker exec exocortex-n8n-postgres psql -U leaddb -d leaddb -c \
  "SELECT id, name, active FROM workflow_entity ORDER BY created_at DESC LIMIT 5;"

# Check n8n UI
# Open: https://n8n.quantumheronlabs.com
```

#### 6. Test Workflow

```bash
# Trigger workflow manually from UI
# Or via webhook
curl -X POST https://heronclient.quantumheronlabs.com/webhook/your-webhook
```

### Alternative: Direct SQL Import

**If sync_workflows.js doesn't work**, use direct SQL:

```bash
# Edit script to set PROJECT_ID
nano /home/debian/code/n8nself/import_workflows_sql.sh

# Run
cd /home/debian/code/n8nself
./import_workflows_sql.sh
```

### Troubleshooting

#### Issue 1: sync_workflows.js fails

**Check n8n API accessibility**:
```bash
# Test API
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  http://127.0.0.1:5678/api/v1/workflows

# Expected: JSON array of workflows
```

#### Issue 2: Credential mismatches

**Verify credentials exist**:
```bash
docker exec exocortex-n8n-postgres psql -U leaddb -d leaddb -c \
  "SELECT id, name, type FROM credentials_entity ORDER BY name;"
```

**If credentials are missing**, export them from VPS:
```bash
# Export credentials
docker exec exocortex-n8n-postgres psql -U leaddb -d leaddb -c \
  "SELECT * FROM credentials_entity;" > credentials.sql

# Import to local n8n (if using separate instance)
```

#### Issue 3: Foreign key constraints

**Error**: `violates foreign key constraint`

**Solution**: sync_workflows.js handles this by:
1. Normalizing workflow data
2. Removing workflow IDs before import
3. Creating new entries via POST (not PUT)
4. Handling version history separately

### Automation Script

**File**: `/home/debian/testproj/scripts/n8n-sync-workflows.sh`

```bash
#!/bin/bash
# Sync n8n workflows between VPS and local

set -e

echo "🔧 n8n Workflow Sync Tool"

# 1. Export from VPS
echo "📥 Exporting workflows from VPS..."
docker exec exocortex-n8n cat /root/.n8n/workflows/workflow.json > /tmp/vps-workflow.json

# 2. Validate JSON
echo "✅ Validating workflow..."
jq empty /tmp/vps-workflow.json || {
  echo "❌ Invalid JSON"
  exit 1
}

# 3. Copy to workflows directory
echo "📦 Copying to workflows directory..."
cp /tmp/vps-workflow.json /home/debian/code/n8nself/workflows/

# 4. Run sync
echo "🔄 Running sync_workflows.js..."
docker exec exocortex-n8n node /sync_workflows.js

# 5. Verify
echo "🔍 Verifying import..."
docker exec exocortex-n8n-postgres psql -U leaddb -d leaddb -c \
  "SELECT id, name, active FROM workflow_entity ORDER BY created_at DESC LIMIT 3;"

echo "✅ Sync complete!"
```

### Development Workflow (Fixed)

**Instead of manual uploads**, use this flow:

```bash
# 1. Export from VPS
./scripts/n8n-sync-workflows.sh export

# 2. Edit workflow locally (in n8n UI or JSON)
# Open: https://localhost:5678 (port-forwarded from VPS)

# 3. Save locally (n8n auto-saves to ./workflows/)

# 4. Deploy back to VPS
./scripts/n8n-sync-workflows.sh import

# 5. Test
curl -X POST https://heronclient.quantumheronlabs.com/webhook/your-workflow
```

### Security Considerations

**API Key Security**:
- Store `N8N_API_KEY` in secrets file
- Never commit to git
- Use Docker secrets for production

**Webhook Authentication**:
- Use webhook validation proxy (already implemented)
- Set unique secrets per workflow

### Testing the Fix

#### Test 1: Import Simple Workflow
```bash
# Create minimal workflow
cat > /tmp/test-workflow.json << 'EOF'
{
  "name": "Test Workflow",
  "nodes": [
    {
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300],
      "parameters": {}
    }
  ]
}
EOF

# Import
cp /tmp/test-workflow.json /home/debian/code/n8nself/workflows/
docker exec exocortex-n8n node /sync_workflows.js

# Verify
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  http://127.0.0.1:5678/api/v1/workflows | jq .
```

#### Test 2: Update Existing Workflow
```bash
# Modify workflow JSON
# Change a node parameter
# Run sync_workflows.js again
# Verify update (not duplicate)
```

#### Test 3: Credential Handling
```bash
# Export workflow with credentials
# Run sync_workflows.js
# Check if credentials are preserved
```

## Documentation Gaps

**Missing from existing docs**:
1. ✅ **How to get n8n API key** - Now documented
2. ✅ **sync_workflows.js setup** - Now documented
3. ✅ **Credential mapping** - Already in CLAUDE.md
4. ❌ **Port forwarding for local dev** - Not documented
5. ❌ **Workflow debugging tips** - Not documented

## Recommended Actions

### Immediate (Today)
1. **Set up sync_workflows.js**
   ```bash
   cd /home/debian/code/n8nself
   nano .env  # Add N8N_API_KEY
   ```

2. **Test with one workflow**
   ```bash
   # Export workflow from VPS UI
   # Save to ./workflows/
   # Run sync
   docker exec exocortex-n8n node /sync_workflows.js
   ```

3. **Create automation script**
   ```bash
   # Copy script from above
   # Make executable
   chmod +x /home/debian/testproj/scripts/n8n-sync-workflows.sh
   ```

### Short-term (This Week)
1. **Set up port forwarding for local development**
   ```bash
   # SSH tunnel to VPS n8n
   ssh -L 5678:localhost:5678 user@vps
   # Now access locally: http://localhost:5678
   ```

2. **Create workflow testing checklist**
   - Import workflow
   - Activate workflow
   - Test triggers
   - Verify executions
   - Check logs

3. **Document credential migration process**
   - Export credentials from VPS
   - Import to local (if needed)
   - Map credential IDs

### Long-term
1. **CI/CD for workflows**
   - GitHub Actions to sync workflows
   - Automated testing of workflows
   - Version control for workflow JSON

2. **Workflow validation tool**
   - Check for missing credentials
   - Validate webhook URLs
   - Test node configurations

## Summary

**The fix is already documented!**

The n8n CLI bug with `workflow_publish_history` foreign key constraints is documented in CLAUDE.md and SKILLS.md.

**Use sync_workflows.js instead of n8n CLI**.

**Next steps**:
1. Add `N8N_API_KEY` to n8nself/.env
2. Export workflow from VPS UI
3. Run `docker exec exocortex-n8n node /sync_workflows.js`
4. Test workflow

**This eliminates the tedious manual upload/download cycle.**

## Files to Update

1. **SKILLS.md** - Add section: "Local Development with Port Forwarding"
2. **CLAUDE.md** - Add: "Workflow Development Workflow"
3. **Create**: `/home/debian/testproj/scripts/n8n-sync-workflows.sh`

**Ready to implement the fix?**
