const { initializeDatabase } = require('./server/src/shared/database');
const financeService = require('./server/src/modules/panelA/financeService');
const inventoryService = require('./server/src/modules/panelB/inventoryService');

async function testSystem() {
    console.log("🚀 INITIALIZING DATABASE FOR ARCHITECTURAL AUDIT...");

    try {
        await initializeDatabase();

        console.log("1. Testing PANEL A (Finance Service)...");
        const stats = await financeService.getClubStats(1);
        console.log("✅ Panel A Success:", stats.clubName);

        console.log("2. Testing PANEL B (Inventory Service)...");
        const rooms = await inventoryService.getRoomsWithComputers(1);
        console.log("✅ Panel B Success:", rooms.length, "rooms found.");

        console.log("\n🎊 ARCHITECTURE VERIFIED! Panel-based structure is functional.");
    } catch (err) {
        console.error("❌ ARCHITECTURAL FAILURE:", err.message);
        process.exit(1);
    }
}

testSystem();
