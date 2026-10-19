#!/bin/bash
# Walkathon 2026 — Deploy to Fly.io
# Run from the project root: bash deploy.sh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "=== Walkathon 2026 — Fly.io Deployment ==="
echo ""

# 1. Login
echo "Step 1/5 — Fly.io login (browser will open)"
fly auth login

# 2. Create the app (uses fly.toml config)
echo ""
echo "Step 2/5 — Creating app..."
# --no-deploy so we can create the volume first
fly launch --no-deploy --copy-config --yes 2>/dev/null || {
  echo "App 'walkathon-2026' name may already be taken."
  echo "Edit fly.toml, change 'app = ...' to a unique name, then re-run."
  exit 1
}

# 3. Create persistent volume (data survives restarts)
echo ""
echo "Step 3/5 — Creating persistent data volume (1 GB)..."
fly volumes create walkathon_data --size 1 --yes

# 4. Set secrets
echo ""
echo "Step 4/5 — Setting JWT secret..."
JWT_SECRET=$(node -e "const c=require('crypto');process.stdout.write(c.randomBytes(40).toString('hex'))")
fly secrets set JWT_SECRET="$JWT_SECRET"
echo "JWT_SECRET set (80 hex chars)"

# 5. Build + deploy
echo ""
echo "Step 5/5 — Building Docker image and deploying (takes ~3 min)..."
fly deploy

# Done
echo ""
APP_HOST=$(fly info --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).Hostname)}catch(e){console.log('walkathon-2026.fly.dev')}})" 2>/dev/null || echo "walkathon-2026.fly.dev")
echo "======================================"
echo "  DEPLOYED: https://$APP_HOST"
echo ""
echo "  Admin login: admin@example.com / admin#1234 (change after first login!)"
echo ""
echo "  Share with team for registration:"
echo "  https://$APP_HOST/register"
echo "======================================"
echo ""
echo "Data is stored on a persistent volume."
echo "Safe to restart — data survives."
