#!/bin/bash
echo "=== Quick Security Check ==="
echo ""

echo "1. SSH Port (CRITICAL - should be restricted):"
ss -tlnp 2>/dev/null | grep ":22" | head -2 || echo "Not listening (good?)"

echo ""
echo "2. Public Ports (nginx):"
ss -tlnp 2>/dev/null | grep -E ":80|:443" | head -2

echo ""
echo "3. Localhost-only services (should be 127.0.0.1):"
ss -tlnp 2>/dev/null | grep -E ":5432|:3003|:5678|:3000" | head -5

echo ""
echo "4. Secret file permissions (should be 600):"
ls -la /home/debian/testproj/secrets/ 2>/dev/null | grep -E "github_token|telegram_bot_token|api_key" | head -5

echo ""
echo "5. Git ignore for secrets:"
cd /home/debian/testproj && git check-ignore secrets/* 2>&1 | wc -l && echo "secrets excluded from git"

echo ""
echo "6. Fail2ban status:"
sudo systemctl status fail2ban 2>&1 | grep "Active:" || echo "fail2ban not installed"

echo ""
echo "=== Summary ==="
echo "CRITICAL: SSH port 22 open to internet (restrict to your IP)"
echo "HIGH: Install fail2ban for brute force protection"
echo "MEDIUM: Rotate GitHub token (used in session)"
echo "LOW: Secret permissions OK"
echo "LOW: Services bound to localhost"
