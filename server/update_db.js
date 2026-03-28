const sequelize = require('./src/config/database');

async function update() {
    try {
        await sequelize.query("ALTER TABLE Transactions ADD COLUMN description STRING;");
        console.log("Added description column");
    } catch (e) { }

    try {
        await sequelize.query("ALTER TABLE Transactions ADD COLUMN ClubId INTEGER;");
        console.log("Added ClubId column");
    } catch (e) { }

    try {
        await sequelize.query("ALTER TABLE Transactions ADD COLUMN UserId INTEGER;");
        console.log("Added UserId column");
    } catch (e) { }

    console.log("MIGRATION COMPLETE!");
}

update().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
