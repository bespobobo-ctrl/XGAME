const { User, sequelize } = require('./server/src/database/index');

async function testBotLogic() {
    try {
        console.log("🔍 Database ulanishini tekshirish...");
        await sequelize.authenticate();
        console.log("✅ Ulanish muvaffaqiyatli.");

        console.log("🔍 Foydalanuvchini topish testi...");
        // 7201729792 - userning telegram IDsi skrinshotdan olindi (ADMIN_ID .env da shu)
        const user = await User.findOne({ where: { telegramId: "7201729792" } });
        console.log("✅ User topildi:", user ? user.username : "Topilmadi (Yangi foydalanuvchi)");

        if (!user) {
            console.log("➕ Foydalanuvchi yaratish testi...");
            const newUser = await User.create({
                telegramId: "7201729792",
                firstName: "Sizning Ismingiz",
                balance: 0
            });
            console.log("✅ Yangi foydalanuvchi yaratildi:", newUser.id);
        }
    } catch (error) {
        console.error("❌ XATOLIK ANIQLANDI:");
        console.error(error);
    } finally {
        process.exit();
    }
}

testBotLogic();
