# 🎮 GameZone — Game Club Boshqaruv Tizimi

## Professional Game Club Management System

Telegram Bot + Mini App + PC Agent yordamida game clublarni to'liq boshqarish tizimi.

---

## 📁 Loyiha Tuzilmasi

```
gamezone/
├── server/          → Backend API (Node.js + Express + SQLite)
├── bot/             → Telegram Bot (buyruqlar, bildirishnomalar)
├── mini-app/        → Telegram Mini App (React — chiroyli UI)
├── pc-agent/        → Windows Agent (kompyuterni qulflash/ochish)
├── shared/          → Umumiy kodlar (constants, utils)
├── docs/            → Hujjatlar
├── scripts/         → Yordam skriptlari (o'rnatish, deploy)
└── .env.example     → Muhit o'zgaruvchilari namunasi
```

## 🚀 Ishga tushirish

```bash
# 1. Serverimizni ishga tushiramiz
cd server && npm install && npm run dev

# 2. Botni ishga tushiramiz
cd bot && npm install && npm start

# 3. Mini App ni ishga tushiramiz
cd mini-app && npm install && npm run dev

# 4. PC Agent (test rejimida)
cd pc-agent && npm install && npm start
```

## 📊 Texnologiyalar

| Qism | Texnologiya |
|------|------------|
| Server | Node.js, Express, SQLite (keyinroq PostgreSQL) |
| Bot | node-telegram-bot-api |
| Mini App | React + Vite |
| PC Agent | Node.js + Windows API |
| Real-time | WebSocket (Socket.IO) |

## 👥 Tizim foydalanuvchilari

- **Mijoz** — o'yinchi (Telegram orqali)
- **Kassir** — har bir klubda (Telegram orqali)
- **Admin/Boss** — barcha klublarni boshqaradi

---

© 2026 GameZone Management System
