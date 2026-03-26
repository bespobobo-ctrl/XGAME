# 🤖 GameZone Telegram Bot

Telegram bot — mijozlar va adminlar uchun asosiy interfeys.

## Papkalar:

```
bot/
├── src/
│   ├── commands/       → Bot buyruqlari (/start, /help, /balance)
│   ├── handlers/       → Xabar va callback handler'lar
│   ├── keyboards/      → Tugma va menular (inline, reply)
│   ├── scenes/         → Bosqichli dialoglar (ro'yxatdan o'tish, bron)
│   ├── middleware/      → Bot middleware (auth, rate-limit)
│   ├── services/       → API bilan aloqa
│   ├── utils/          → Yordamchi funksiyalar
│   └── locales/        → Tillar (uz, ru)
├── package.json
└── index.js            → Asosiy fayl
```
