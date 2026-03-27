const sequelize = require('./server/src/config/database');

async function check() {
    try {
        const [results] = await sequelize.query("PRAGMA table_info(Users);");
        console.log("📝 USERS SCHEMA:");
        results.forEach(col => console.log(`- ${col.name} (${col.type})`));

        const [clubs] = await sequelize.query("SELECT * FROM Clubs;");
        console.log(`\n🏢 CLUBS:`, clubs);

        const [users] = await sequelize.query("SELECT * FROM Users;");
        console.log(`\n👥 USERS:`, users);

    } catch (e) {
        console.error("❌ ERR:", e);
    } finally {
        process.exit();
    }
}

check();
