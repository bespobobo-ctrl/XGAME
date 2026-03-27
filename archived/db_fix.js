const sequelize = require('./server/src/config/database');

async function fix() {
    try {
        console.log("🛠 Database migratsiyasini boshlayapmiz...");

        // Users jadvaliga yetishmayotgan ustunlarni qo'shamiz
        // (SQLite da bitta query da bir nechta ADD COLUMN qilib bo'lmaydi)
        const columns = [
            { name: "password", type: "VARCHAR(255)" },
            { name: "ClubId", type: "INTEGER DEFAULT 1" },
            { name: "lastLoginAt", type: "DATETIME" },
            { name: "lastLoginIp", type: "VARCHAR(255)" },
            { name: "lastTelegramId", type: "VARCHAR(255)" }
        ];

        for (const col of columns) {
            try {
                await sequelize.query(`ALTER TABLE Users ADD COLUMN ${col.name} ${col.type};`);
                console.log(`✅ Ustun qo'shildi: ${col.name}`);
            } catch (err) {
                if (err.message.includes("duplicate column name")) {
                    console.log(`ℹ️ Ustun allaqachon mavjud: ${col.name}`);
                } else {
                    console.error(`❌ Xatolik [${col.name}]:`, err.message);
                }
            }
        }

        // Super Admin foydalanuvchisini bazaga qo'shish (agar bo'lmasa)
        const [users] = await sequelize.query(`SELECT * FROM Users WHERE role = 'super_admin';`);
        if (users.length === 0) {
            // Hash qilingan 123
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('123', 10);

            await sequelize.query(`
                INSERT INTO Users (telegramId, firstName, username, role, password, createdAt, updatedAt) 
                VALUES ('sys_admin', 'Master', 'admin', 'super_admin', '${hashedPassword}', datetime('now'), datetime('now'));
            `);
            console.log("👑 Super Admin bazaga qo'shildi!");
        }

        console.log("✨ Hammasi tayyor!");

    } catch (e) {
        console.error("❌ MIGRATION FAILED:", e);
    } finally {
        process.exit();
    }
}

fix();
