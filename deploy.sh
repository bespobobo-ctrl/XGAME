#!/bin/bash

# --- GameZone One-Click Update Script ---
echo "🚀 Updating GameZone Server..."

# 1. Pull latest code from GitHub
echo "⏬ Pulling latest changes..."
git pull origin main

# 2. Re-build the Frontend (Mini-App)
echo "📦 Building Mini-App..."
cd mini-app
npm install --silent
npm run build

# 3. Restart Services (using PM2 if available)
echo "🔄 Restarting services..."
cd ..
if command -v pm2 &> /dev/null
then
    pm2 restart all
    echo "✅ PM2 services restarted."
else
    echo "⚠️ PM2 not found, please restart your server manually."
fi

echo "✨ Update Complete! All systems online."
