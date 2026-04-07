const { sequelize } = require('./server/src/shared/database');

async function checkSchema() {
    try {
        const [results] = await sequelize.query("PRAGMA table_info(Sessions)");
        console.log('--- Sessions Table Columns ---');
        results.forEach(col => console.log(`- ${col.name}`));
        console.log('------------------------------');
    } catch (e) {
        console.error(e);
    }
}

checkSchema().then(() => process.exit(0));
