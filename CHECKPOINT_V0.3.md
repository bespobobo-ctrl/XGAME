# 📂 GAMEZONE V0.3 - CHECKPOINT & RECOVERY GUIDE

Ushbu hujjat loyihaning **v0.3 (Ultra-Premium Dashboard)** versiyasini saqlab qolish va kelajakda xatolar bo'lsa orqaga qaytish uchun qo'llanma bo'lib xizmat qiladi.

## ✅ Hozirgi holat (v0.3):
- **Real-time Stats:** Har soniyada yangilanadigan jonli daromad va soat hisoblagichlari.
- **Urgent Alerts:** Bron vaqtiga 10 daqiqa qolganda Telegram va Dashboard-ga ogohlantirish.
- **Smart No-Show:** Mijoz kelmaganda PC-ni bir tugma bilan bo'shatish.
- **Robust Database:** SQLite bazasidagi Foreign Key muammolari bartaraf etilgan.

## ⏪ Orqaga qaytish (Rollback):
Agar kelajakda biror narsa buzilsa, Git orqali ushbu barqaror versiyaga quyidagi komandalar bilan qaytishingiz mumkin:

1. **Oxirgi saqlangan versiyaga (v0.3) qaytish:**
   ```bash
   git checkout v0.3
   ```

2. **Barcha o'zgarishlarni bekor qilib, toza v0.3 ga qaytish:**
   ```bash
   git reset --hard v0.3
   ```

## 💾 Backup (Zaxira):
- **Database:** `server/data/gamezone.db` faylini vaqti-vaqti bilan nusxalab oling.
- **Git Tags:** Har safar muhim o'zgarishlar tugaganda `git tag v0.X` komandasini ishlating.

---
*Ushbu versiya eng maqul va barqaror deb topildi (2026-03-29).*
