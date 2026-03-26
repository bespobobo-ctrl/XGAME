const sequelize = require('./server/src/config/database');

async function fixDatabase() {
    try {
        console.log("🛠️ Bazani tuzatyapman...");

        // isBlocked ustunini qo'shish testi
        try {
            await sequelize.query("ALTER TABLE Users ADD COLUMN isBlocked BOOLEAN DEFAULT 0;");
            console.log("✅ 'isBlocked' ustuni Users jadvaliga qo'shildi.");
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log("ℹ️ 'isBlocked' allaqachon mavjud.");
            } else {
                console.error("❌ isBlocked xatosi:", e.message);
            }
        }

        // Har ehtimolga qarshi ClubId ni ham tekshirish
        try {
            await sequelize.query("ALTER TABLE Users ADD COLUMN ClubId INTEGER DEFAULT 1;");
            console.log("✅ 'ClubId' ustuni Users jadvaliga qo'shildi.");
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log("ℹ️ 'ClubId' allaqachon mavjud.");
            } else {
                console.error("❌ ClubId xatosi:", e.message);
            }
        }

        console.log("✅ Baza to'liq yangilandi.");
    } catch (error) {
        console.error("❌ Jiddiy xato:", error);
    } finally {
        process.exit();
    }
}

fixDatabase();
