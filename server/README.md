# 🖥️ GameZone Server (Backend API)

Bu papka — butun tizimning "miyasi". 
Barcha ma'lumotlar shu yerda saqlanadi va boshqariladi.

## Papkalar:

```
server/
├── src/
│   ├── config/         → Sozlamalar (database, server)
│   ├── database/       → Database modellari va migratsiyalar
│   │   ├── models/     → Jadvallar (users, clubs, computers, sessions)
│   │   └── migrations/ → Database yangilanishlari
│   ├── routes/         → API yo'llari (endpoints)
│   │   ├── auth.js     → Ro'yxatdan o'tish, login
│   │   ├── clubs.js    → Klublar boshqaruvi
│   │   ├── computers.js→ Kompyuterlar boshqaruvi
│   │   ├── sessions.js → Seanslar (boshlash, pauza, tugatish)
│   │   ├── payments.js → To'lovlar
│   │   └── admin.js    → Admin API
│   ├── services/       → Biznes logika
│   ├── middleware/      → Vositachi funksiyalar (auth, validation)
│   ├── utils/          → Yordamchi funksiyalar
│   └── websocket/      → Real-time aloqa (Socket.IO)
├── data/               → Database fayllari
├── package.json
└── index.js            → Asosiy fayl
```
