/**
 * Sequelize raw query orqali database tozalash
 */
const path = require('path');
const { Sequelize } = require('sequelize');

const dbPath = path.join(__dirname, '../data/gamezone.db');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

async function clearAllClubs() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database ulandi');

        // Mavjud tablelarni ko'rsatish
        const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tablalar:', tables.map(t => t.name).join(', '));

        // Mavjud clublarni ko'rish
        const [clubs] = await sequelize.query('SELECT id, name FROM Clubs');
        console.log(`\nTopilgan klublar soni: ${clubs.length}`);
        clubs.forEach(c => console.log(`  - [${c.id}] ${c.name}`));

        if (clubs.length === 0) {
            console.log("✅ Database allaqachon bo'sh!");
            await sequelize.close();
            return;
        }

        // FK constraints off
        await sequelize.query('PRAGMA foreign_keys = OFF');

        // O'chirish
        try {
            const [, meta] = await sequelize.query('DELETE FROM Sessions');
            console.log("Seanslar o'chirildi");
        } catch (e) { console.log('Sessions skip:', e.message.slice(0, 60)); }

        try {
            await sequelize.query('DELETE FROM Computers');
            console.log("Kompyuterlar o'chirildi");
        } catch (e) { console.log('Computers skip:', e.message.slice(0, 60)); }

        try {
            await sequelize.query('DELETE FROM Rooms');
            console.log("Xonalar o'chirildi");
        } catch (e) { console.log('Rooms skip:', e.message.slice(0, 60)); }

        try {
            await sequelize.query("UPDATE Users SET ClubId = NULL WHERE role = 'admin'");
        } catch (e) { console.log('Users skip:', e.message.slice(0, 60)); }

        await sequelize.query('DELETE FROM Clubs');
        console.log("Klublar o'chirildi ✅");

        // FK constraints on
        await sequelize.query('PRAGMA foreign_keys = ON');

        // Tasdiqlash
        const [remaining] = await sequelize.query('SELECT COUNT(*) as cnt FROM Clubs');
        console.log(`\nQolgan klublar: ${remaining[0].cnt}`);
        console.log("🎉 Database tozalandi! Super Admin orqali yangi klub qo'shing.");

        await sequelize.close();
    } catch (err) {
        console.error('❌ Xatolik:', err.message);
        await sequelize.close();
        process.exit(1);
    }
}

clearAllClubs();
