const { Computer, Room, Session, Transaction, sequelize } = require('./index');

async function totalCleanup() {
    try {
        console.log('🧹 SQLite bazasini tozalash va ID-larni 1-ga qaytarish boshlandi...');

        // 1. Bog'liqliklarni o'chirish
        await Transaction.destroy({ where: {} });
        await Session.destroy({ where: {} });
        await Computer.destroy({ where: {} });
        await Room.destroy({ where: {} });

        // 2. MUHIM: SQLite-da ID sanoqlarini (Auto-increment) 1-ga qaytarish
        await sequelize.query("DELETE FROM sqlite_sequence WHERE name='Computers'");
        await sequelize.query("DELETE FROM sqlite_sequence WHERE name='Rooms'");
        await sequelize.query("DELETE FROM sqlite_sequence WHERE name='Sessions'");
        await sequelize.query("DELETE FROM sqlite_sequence WHERE name='Transactions'");

        console.log('✅ Barcha jadvallar tozalandi va ID sanoqlari 1-ga qaytarildi!');
        console.log('✨ Endi Admin paneldan yangi xona yaratsangiz, hammasi #1 dan boshlanadi.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup Error:', error);
        process.exit(1);
    }
}

totalCleanup();
