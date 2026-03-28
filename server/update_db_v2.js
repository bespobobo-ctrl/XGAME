const sequelize = require('./src/config/database');

async function update() {
    // TRANSACTIONS
    try { await sequelize.query("ALTER TABLE Transactions ADD COLUMN description STRING;"); console.log("Added description column to Trans"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Transactions ADD COLUMN ClubId INTEGER;"); console.log("Added ClubId column to Trans"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Transactions ADD COLUMN UserId INTEGER;"); console.log("Added UserId column to Trans"); } catch (e) { }

    // ROOMS
    try { await sequelize.query("ALTER TABLE Rooms ADD COLUMN ClubId INTEGER;"); console.log("Added ClubId column to Rooms"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Rooms ADD COLUMN openTime STRING;"); console.log("Added openTime column to Rooms"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Rooms ADD COLUMN closeTime STRING;"); console.log("Added closeTime column to Rooms"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Rooms ADD COLUMN isLocked BOOLEAN;"); console.log("Added isLocked column to Rooms"); } catch (e) { }

    // COMPUTERS (just in case)
    try { await sequelize.query("ALTER TABLE Computers ADD COLUMN status STRING;"); console.log("Added status column to Computers"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Computers ADD COLUMN ClubId INTEGER;"); console.log("Added ClubId column to Computers"); } catch (e) { }

    // SESSIONS
    try { await sequelize.query("ALTER TABLE Sessions ADD COLUMN ClubId INTEGER;"); console.log("Added ClubId column to Sessions"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Sessions ADD COLUMN reserveTime DATETIME;"); console.log("Added reserveTime column to Sessions"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Sessions ADD COLUMN totalMinutes INTEGER;"); console.log("Added totalMinutes column to Sessions"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Sessions ADD COLUMN expectedMinutes INTEGER;"); console.log("Added expectedMinutes column to Sessions"); } catch (e) { }
    try { await sequelize.query("ALTER TABLE Sessions ADD COLUMN pausedAt DATETIME;"); console.log("Added pausedAt column to Sessions"); } catch (e) { }

    console.log("ALL MIGRATIONS COMPLETE!");
}

update().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
