---
description: Fixes the 'SERVER: OFFLINE' error by syncing the Cloudflare tunnel URL with the Vercel frontend.
---
# NEXUS RECOVERY PROTOCOL
// turbo-all

This workflow fixes the GameZone application when the backend droplet's Cloudflare tunnel assigns a new URL, causing the Vercel-deployed frontend (Telegram Mini-App) to show 'SERVER: OFFLINE'.

## Step 1: Instruct the User to get the URL
Ask the user to log into their VPS/Droplet and run the following command to get the active Tunnel URL:
`export TUNNEL_URL=$(curl -s http://127.0.0.1:20241/metrics | grep -o 'https://[^"]*trycloudflare.com' | head -n 1) && echo $TUNNEL_URL`
Ask the user to reply to you with the output (the new `https://...trycloudflare.com` URL).

## Step 2: Update Local API_URL
Once the user gives you the new URL, use the `replace_file_content` tool to update the file `C:\Users\PRESTIGE\.gemini\antigravity\scratch\gamezone\mini-app\src\api\index.js`.
You must replace the old `const API_URL = '...';` line with the new one: `const API_URL = 'THE_NEW_URL';`

## Step 3: Push to Github
Run the following local command to commit and push the change to Github so that Vercel auto-deploys the fix:
`git add mini-app/src/api/index.js ; git commit -m "fix(recovery): update API_URL to match active tunnel URL via workflow" ; git push`

## Step 4: Check Database (Optional but recommended)
Ask the user to run `pm2 restart 0 && pm2 restart 2` on their server to ensure the backend process is awake. If they encounter SQLite `Validation Error` logs, guide them to temporarily change `alter: true` to `force: true` in `server/src/database/index.js`, restart PM2, and change it back.

## Step 5: Finalize
Tell the user that the code has been pushed to Github and Vercel is actively deploying it. Instruct them to wait 1 minute, then tap "Reload Page" in the Telegram Mini-App to see the 'SERVER: ONLINE' status.
