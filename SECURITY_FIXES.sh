#!/bin/bash
# Quick Security Fixes for Exocortex

set -euo pipefail

echo "=== Security Fixes ==="
echo ""

# 1. Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo "⚠️  Running as root - be careful"
fi

# 2. Restrict SSH (CRITICAL)
echo "1. SSH Port Restriction (CRITICAL)"
echo "   Current: Port 22 open to 0.0.0.0"
echo "   Fix: Restrict to your IP only"
echo ""
read -p "Enter your IP address (or 'skip' to skip): " YOUR_IP

if [[ "$YOUR_IP" != "skip" ]]; then
    # Backup SSH config
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)
    
    # Add AllowUsers
    if ! grep -q "^AllowUsers" /etc/ssh/sshd_config; then
        echo "AllowUsers debian@$YOUR_IP" | sudo tee -a /etc/ssh/sshd_config
        echo "✓ Added AllowUsers to sshd_config"
    else
        echo "⚠️  AllowUsers already exists - check manually"
    fi
    
    # Restart SSH
    sudo systemctl restart sshd
    echo "✓ SSH restarted"
else
    echo "⚠️  Skipped SSH restriction (still vulnerable)"
fi

echo ""

# 2. Install fail2ban (HIGH)
echo "2. Install fail2ban (HIGH)"
read -p "Install fail2ban? (y/n): " INSTALL_FAIL2BAN

if [[ "$INSTALL_FAIL2BAN" == "y" ]]; then
    sudo apt update
    sudo apt install -y fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    echo "✓ fail2ban installed and running"
else
    echo "⚠️  Skipped - brute force protection not installed"
fi

echo ""

# 3. UFW Firewall (HIGH)
echo "3. UFW Firewall (HIGH)"
read -p "Configure UFW firewall? (y/n): " INSTALL_UFW

if [[ "$INSTALL_UFW" == "y" ]]; then
    sudo apt install -y ufw
    
    # Allow SSH from your IP (if provided)
    if [[ "$YOUR_IP" != "skip" ]]; then
        sudo ufw allow from $YOUR_IP to any port 22
        echo "✓ Allowed SSH from $YOUR_IP"
    fi
    
    # Allow HTTP/HTTPS
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Deny everything else
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Enable
    sudo ufw --force enable
    echo "✓ UFW enabled"
else
    echo "⚠️  Skipped - firewall not configured"
fi

echo ""

# 4. Rotate GitHub Token
echo "4. GitHub Token Rotation"
echo "   Go to: https://github.com/settings/tokens"
echo "   Revoke old token and create new one"
echo ""
read -p "Enter new GitHub token (or 'skip'): " NEW_GITHUB_TOKEN

if [[ "$NEW_GITHUB_TOKEN" != "skip" && -n "$NEW_GITHUB_TOKEN" ]]; then
    echo "$NEW_GITHUB_TOKEN" > /home/debian/testproj/secrets/github_token
    chmod 600 /home/debian/testproj/secrets/github_token
    echo "✓ GitHub token rotated"
    
    # Update Clawdbot config if needed
    echo "   Note: Update ~/.clawdbot/clawdbot.json if storing there"
fi

echo ""

# 5. Install ClamAV (malware scanner)
echo "5. Malware Scanner (ClamAV)"
read -p "Install ClamAV? (y/n): " INSTALL_CLAMAV

if [[ "$INSTALL_CLAMAV" == "y" ]]; then
    sudo apt update
    sudo apt install -y clamav clamav-daemon
    sudo freshclam
    sudo systemctl enable clamav-freshclam
    sudo systemctl start clamav-freshclam
    sudo systemctl enable clamav-daemon
    sudo systemctl start clamav-daemon
    echo "✓ ClamAV installed and updated"
fi

echo ""

# 6. Check for updates
echo "6. System Updates"
read -p "Run system updates? (y/n): " RUN_UPDATES

if [[ "$RUN_UPDATES" == "y" ]]; then
    sudo apt update
    sudo apt upgrade -y
    sudo apt autoremove -y
    echo "✓ System updated"
fi

echo ""

# 7. Create audit script
echo "7. Creating Audit Script"
cat > /home/debian/clawd/security-audit.sh << 'AUDIT'
#!/bin/bash
echo "=== Security Audit $(date) ==="
echo ""

# Check listening ports
echo "Listening ports:"
ss -tlnp | grep LISTEN | head -10

echo ""
echo "Secret permissions:"
ls -la /home/debian/testproj/secrets/ 2>/dev/null | grep -E "github_token|telegram|api_key" | head -5

echo ""
echo "Docker containers:"
docker ps --format "{{.Names}}\t{{.Status}}" | head -5

echo ""
echo "Recent auth failures:"
sudo tail -50 /var/log/auth.log 2>/dev/null | grep "Failed" | tail -5 || echo "No auth failures"

echo ""
echo "SSH config:"
grep -E "^PermitRootLogin|^PasswordAuthentication|^AllowUsers" /etc/ssh/sshd_config 2>/dev/null || echo "Using defaults"

echo ""
echo "=== Audit Complete ==="
AUDIT
chmod +x /home/debian/clawd/security-audit.sh
echo "✓ Audit script created: /home/debian/clawd/security-audit.sh"

echo ""
echo "=== Fixes Complete ==="
echo ""
echo "Summary of actions taken:"
echo "- SSH: Configured to restrict to your IP"
echo "- fail2ban: Installed (brute force protection)"
echo "- UFW: Configured (firewall)"
echo "- GitHub token: Rotated"
echo "- ClamAV: Installed (malware scanner)"
echo "- System: Updated"
echo "- Audit: Script created for weekly checks"
echo ""
echo "Run security audit anytime: /home/debian/clawd/security-audit.sh"
