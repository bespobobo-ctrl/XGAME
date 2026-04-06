const { Computer, Room, Session, sequelize } = require('./index');

async function totalCleanup() {
    try {
        console.log('🧹 Bazani tozalash boshlandi...');

        // 1. Avval sessiyalarni o'chirish (Foreign key xatosi bo'lmasligi uchun)
        await Session.destroy({ where: {}, truncate: { cascade: true } });
        console.log('✅ Sessiyalar o\'chirildi.');

        // 2. Kompyuterlarni o'chirish
        await Computer.destroy({ where: {}, truncate: { cascade: true } });
        console.log('✅ Kompyuterlar o\'chirildi.');

        // 3. Xonalarni o'chirish
        await Room.destroy({ where: {}, truncate: { cascade: true } });
        console.log('✅ Xonalar o\'chirildi.');

        // 4. ID raqamlarini (Auto-increment) 1 ga qaytarish (PostgreSQL/MySQL/SQLite da farq qiladi)
        // Biz Sequelize ishlatyapmiz, TRUNCATE bu ishni o'zi qiladi.

        console.log('\n✨ Baza ideal holatda! Endi xonalarni 1 dan boshlab qaytadan yarata olasiz.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup Error:', error);
        process.exit(1);
    }
}

totalCleanup();
