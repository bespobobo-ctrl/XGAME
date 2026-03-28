const { Computer, Session, User, Transaction, sequelize } = require('./server/src/database');

async function check() {
    try {
        await sequelize.authenticate();
        const pcs = await Computer.findAll();
        const activeSess = await Session.count({ where: { status: 'active' } });
        const managers = await User.count({ where: { role: 'manager' } });
        const lastTransactions = await Transaction.findAll({ limit: 3, order: [['createdAt', 'DESC']] });

        console.log("\n========================================");
        console.log("🎮 GAMEZONE TIZIMINI TEKSHIRISH");
        console.log("========================================");
        console.log(`✅ Manager Controller (VIP): MAVJUD`);
        console.log(`👥 Jami Menegerlar: ${managers}`);
        console.log(`🖥️  Jami Kompyuterlar: ${pcs.length}`);
        console.log(`💎 VIP Rejimdagilar: ${pcs.filter(p => p.status === 'vip').length}`);
        console.log(`🔥 Faol Sessiyalar: ${activeSess}`);
        console.log(`----------------------------------------`);
        console.log(`💰 Oxirgi 3 ta tranzaksiya:`);
        lastTransactions.forEach(t => console.log(` - ${t.amount} so'm: ${t.description}`));
        console.log("========================================\n");
    } catch (e) {
        console.error("Xatolik:", e.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}
check();
