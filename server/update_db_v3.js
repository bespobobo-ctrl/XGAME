const sequelize = require('./src/config/database');

async function update() {
    const list = [
        "ALTER TABLE Transactions ADD COLUMN description STRING;",
        "ALTER TABLE Transactions ADD COLUMN ClubId INTEGER;",
        "ALTER TABLE Transactions ADD COLUMN UserId INTEGER;",
        "ALTER TABLE Rooms ADD COLUMN ClubId INTEGER;",
        "ALTER TABLE Rooms ADD COLUMN openTime STRING;",
        "ALTER TABLE Rooms ADD COLUMN closeTime STRING;",
        "ALTER TABLE Rooms ADD COLUMN isLocked BOOLEAN;",
        "ALTER TABLE Computers ADD COLUMN status STRING;",
        "ALTER TABLE Computers ADD COLUMN ClubId INTEGER;",
        "ALTER TABLE Sessions ADD COLUMN ClubId INTEGER;",
        "ALTER TABLE Sessions ADD COLUMN reserveTime DATETIME;",
        "ALTER TABLE Sessions ADD COLUMN totalMinutes INTEGER;",
        "ALTER TABLE Sessions ADD COLUMN expectedMinutes INTEGER;",
        "ALTER TABLE Sessions ADD COLUMN pausedAt DATETIME;"
    ];

    for (let q of list) {
        try {
            await sequelize.query(q);
            console.log("SUCCESS:", q);
        } catch (e) {
            console.log("FAIL (maybe exists):", q);
        }
    }
    console.log("DONE");
}

update().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
