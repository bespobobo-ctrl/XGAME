const Transaction = require('./src/database/models/Transaction');
const Club = require('./src/database/models/Club');

async function check() {
    try {
        const trans = await Transaction.findAll({ limit: 5, order: [['id', 'DESC']] });
        console.log("RECENT TRANSACTIONS:", JSON.stringify(trans, null, 2));
    } catch (e) {
        console.error("DB SYNC OR FETCH ERROR:", e);
    }
}

check().then(() => process.exit(0));
