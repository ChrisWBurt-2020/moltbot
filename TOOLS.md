# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

---

## Tailscale Configuration

### Installation
- **Status**: ✅ Installed (v1.94.1)
- **Service**: Running as `tailscaled` daemon
- **Port**: 41641 (WireGuard UDP)
- **State**: `/var/lib/tailscale/tailscaled.state`

### Gateway Configuration
**File**: `~/.clawdbot/clawdbot.json`

```json
{
  "gateway": {
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "[auth-token]"
    },
    "tailscale": {
      "enabled": true,
      "hostname": "exocortex-gateway",
      "advertiseExitNode": false,
      "serveMode": true
    }
  }
}
```

### Tailnet Access
**URL**: `http://exocortex-gateway.<tailnet-ip>:<port>`

**Example**:
```bash
# From another device on the same tailnet
curl http://exocortex-gateway.100.64.0.1:18789
ssh exocortex-gateway
```

### Tailscale Commands

#### Check Status
```bash
tailscale status --json
tailscale ip -4
```

#### Authentication (requires auth key)
```bash
sudo tailscale up --authkey=tskey-auth-XXXXX --hostname=exocortex-gateway
```

#### Serve Mode (Expose local port)
```bash
# Expose clawdbot gateway on tailnet
tailscale serve --bg \
  --hostname exocortex-gateway \
  --tcp 18789 \
  http://127.0.0.1:18789
```

#### View Serve Status
```bash
tailscale serve status
```

#### Disable
```bash
sudo tailscale down
```

### Current Ports Exposed (Loopback Only)
- **127.0.0.1:18789** - Clawdbot Gateway (HTTP)
- **127.0.0.1:18790** - Clawdbot Gateway (WebSocket)
- **127.0.0.1:18791** - Clawdbot Gateway (API)
- **127.0.0.1:18792** - Clawdbot Gateway (Admin)

### Public Ports (Currently Open)
- **0.0.0.0:22** - SSH (will be restricted)
- **0.0.0.0:80** - HTTP (will be restricted)
- **0.0.0.0:443** - HTTPS (will be restricted)

### Security Notes
- **Before Tailscale**: All services exposed to public internet
- **After Tailscale**: Services accessible only via Tailnet (VPN)
- **Firewall**: Will close public ports 80, 443, keep 22 restricted
- **Tailscale Port**: 41641 (WireGuard) - only port open to public

### Rollback Plan
```bash
# Disable Tailscale
sudo tailscale down

# Reopen firewall if needed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

### Testing
```bash
# Check if accessible via tailnet
curl http://exocortex-gateway.<ip>:18789

# Check from another device
ssh exocortex-gateway

# Verify firewall (should show only 41641 open)
sudo iptables -L -n -v
```

### Success Criteria
- ✅ Tailscale installed and authenticated
- ✅ Gateway running on loopback only
- ✅ Accessible via Tailnet
- ✅ Public ports closed
- ✅ Other devices can connect via tailnet
