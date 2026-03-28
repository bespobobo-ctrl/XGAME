const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function check() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    console.log("--- TRANSACTIONS TABLE SCHEMA ---");
    const tableInfo = await db.all("PRAGMA table_info(Transactions)");
    console.log(JSON.stringify(tableInfo, null, 2));

    console.log("\n--- LATEST TRANSACTIONS ---");
    const data = await db.all("SELECT * FROM Transactions ORDER BY id DESC LIMIT 5");
    console.log(JSON.stringify(data, null, 2));

    await db.close();
}

check().catch(console.error);
