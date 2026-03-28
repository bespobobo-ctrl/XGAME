const req = { user: { ClubId: 1 } };
const res = { json: (data) => console.log("JSON RESULT:", JSON.stringify(data, null, 2)) };
const next = (e) => console.error("ERROR:", e);

const managerAppController = require('./src/controllers/managerAppController');

async function test() {
    console.log("TESTING getStats...");
    await managerAppController.getStats(req, res, next);
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
