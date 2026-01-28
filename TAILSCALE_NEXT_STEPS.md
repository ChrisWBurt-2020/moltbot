# Tailscale Integration - Next Steps

## Current Status: AWAITING AUTH KEY

Tailscale is installed and running, but needs authentication.

## Immediate Action Required

### Get Tailscale Auth Key

1. **Log in to Tailscale admin console:**
   ```
   https://login.tailscale.com/admin/settings
   ```

2. **Create a new auth key:**
   - Click "Generate auth key"
   - Select type: **Reusable** (for persistent gateway)
   - Set expiration: **90 days** (or as preferred)
   - Optional: Add tag `tag:gateway`
   - Click "Generate key"

3. **Copy the auth key:**
   - It will look like: `tskey-auth-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - Copy this entire string

### Run Authentication Command

Once you have the auth key, run:

```bash
sudo tailscale up --authkey=tskey-auth-YOUR_KEY_HERE --hostname=exocortex-gateway
```

**Expected output:**
```
Success.
```

**Verify connection:**
```bash
tailscale status
tailscale ip -4
```

## Next Steps (After Authentication)

### 1. Configure Tailscale Serve

Expose the clawdbot gateway on your tailnet:

```bash
tailscale serve --bg \
  --hostname exocortex-gateway \
  --tcp 18789 \
  http://127.0.0.1:18789
```

**Verify serve status:**
```bash
tailscale serve status
```

### 2. Test Tailnet Access

From another device on the same tailnet:

```bash
# Get your Tailnet IP
tailscale ip -4

# Test HTTP access (replace with your tailnet IP)
curl http://exocortex-gateway.100.64.0.1:18789

# Test SSH (if configured)
ssh exocortex-gateway
```

### 3. Update Firewall (Optional - After Verification)

**Option A: Close all public ports (Recommended)**
```bash
sudo ufw delete allow 80/tcp
sudo ufw delete allow 443/tcp
sudo ufw delete allow 22/tcp
```

**Option B: Keep SSH public for emergency access**
```bash
sudo ufw delete allow 80/tcp
sudo ufw delete allow 443/tcp
# Keep port 22 open
```

**Verify firewall:**
```bash
sudo ufw status verbose
```

### 4. Document Tailnet IPs

Add your device Tailnet IPs to `TOOLS.md`:

```markdown
### Tailnet Devices
- exocortex-gateway: 100.64.0.1 (VPS)
- laptop: 100.64.0.2 (personal)
- phone: 100.64.0.3 (mobile)
```

## Access URLs After Setup

### Local (Gateway)
- http://127.0.0.1:18789 (internal only)

### Via Tailnet
- http://exocortex-gateway.<tailnet-ip>:18789
- Example: http://exocortex-gateway.100.64.0.1:18789

### From Other Devices
```bash
# Replace with your actual tailnet IPs
curl http://exocortex-gateway.100.64.0.1:18789
ssh exocortex-gateway
```

## Verification Checklist

- [ ] Tailscale auth key obtained
- [ ] `sudo tailscale up` command executed
- [ ] `tailscale status` shows connected
- [ ] `tailscale ip -4` returns a 100.x.x.x IP
- [ ] `tailscale serve --bg` command executed
- [ ] `tailscale serve status` shows active
- [ ] Tested access from another device
- [ ] Firewall updated (if desired)
- [ ] Documentation updated with tailnet IPs

## Troubleshooting

### Issue: "NeedsLogin" state persists
```bash
# Check auth key validity
# Try again with new auth key
sudo tailscale up --authkey=tskey-auth-NEW_KEY --hostname=exocortex-gateway
```

### Issue: Can't access via tailnet
```bash
# Check serve status
tailscale serve status

# Restart serve
tailscale serve reset
tailscale serve --bg --hostname exocortex-gateway --tcp 18789 http://127.0.0.1:18789
```

### Issue: Gateway not accessible locally
```bash
# Check gateway is running
ps aux | grep clawdbot-gateway

# Check port
netstat -tulpn | grep 18789

# Restart gateway if needed
sudo systemctl restart clawdbot-gateway
```

## Files Updated

1. `~/.clawdbot/clawdbot.json` - Tailscale configuration
2. `/home/debian/clawd/TOOLS.md` - Commands and config
3. `/home/debian/testproj/AGENTS.md` - Integration guide
4. `/home/debian/testproj/SECURITY.md` - Security posture
5. `/home/debian/clawd/INSTALLATION_SUMMARY.md` - Progress log
6. `/home/debian/clawd/TAILSCALE_NEXT_STEPS.md` - This file

## Security Benefits After Setup

✅ **No public HTTP/HTTPS ports** - Services only on Tailnet  
✅ **Encrypted WireGuard** - All traffic encrypted  
✅ **Device authentication** - Only your devices can connect  
✅ **No port forwarding** - Works behind any firewall  
✅ **Mesh networking** - No single point of failure  
✅ **Instant revocation** - Remove devices instantly  

## Questions?

If you encounter issues:
1. Check `tailscale status --json` for details
2. Review `/home/debian/clawd/TOOLS.md` for commands
3. Check `/home/debian/testproj/AGENTS.md` for integration guide
4. Check `/home/debian/clawd/INSTALLATION_SUMMARY.md` for progress log

## Rollback (If Needed)

```bash
# Disable Tailscale
sudo tailscale down
sudo systemctl stop tailscaled

# Reopen firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Remove from clawdbot.json (delete tailscale section)
```

---

**Ready for auth key → Authentication → Serve configuration → Testing**
