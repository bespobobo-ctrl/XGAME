---
description: Cloudflare Tunnel linki o'zgarganda tizimni avtomatik qayta tiklash (NEXUS-FIX)
---

Agar foydalanuvchi "NEXUS-FIX" deb yozsa yoki manzil o'zgargani haqida xabar bersa, quyidagi amallarni bajaring:

1.  **Linkni aniqlash**: `pm2 logs x-tunnel --lines 100` buyrug'i orqali joriy `trycloudflare.com` manzilini toping.
2.  **Kodlarni yangilash**: Quyidagi fayllarda eski tunnel ID-sini yangisiga daxshatli aniqlik bilan almashtiring:
    - `mini-app/src/api/index.js`
    - `mini-app/src/views/SuperAdminDashboard.jsx` (2 ta joyda)
    - `mini-app/src/views/SuperAdminLogin.jsx` (Ping qismida)
    - `mini-app/src/views/Home.jsx`
3.  **Saqlash**: `git add .`, `git commit -m "fix: Nexus Auto-recovery"`, `git push origin main` qiling.
4.  **Yakunlash**: Foydalanuvchiga `git pull && pm2 restart 0 1` buyrug'ini bering.

// turbo-all
