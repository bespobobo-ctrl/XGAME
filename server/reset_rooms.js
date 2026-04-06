const { Room, Computer, Session, Transaction, sequelize } = require('./src/shared/database');

async function resetDB() {
    try {
        console.log("⚠️ Barcha xonalar, noutbuklar va sessiyalarni o'chirish boshlandi...");

        await sequelize.authenticate();

        // Tranzaktsiya, Xonalar va kompyuterlarni majburan o'chiramiz
        await Transaction.destroy({ where: {} });
        await Session.destroy({ where: {} });
        await Computer.destroy({ where: {} });
        await Room.destroy({ where: {} });

        console.log("✅ Barcha xonalar va PC lar MUVAFFAQIYATLI TOZALANDI!");
        console.log("Endi manager app orqali yangi xona qo'shib, 0 dan PC yaratishingiz mumkin.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Xatolik:", e);
        process.exit(1);
    }
}

resetDB();
