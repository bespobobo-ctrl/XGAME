const { initializeDatabase } = require('./server/src/database');
const financeService = require('./server/src/modules/finance/financeService');
const inventoryService = require('./server/src/modules/inventory/inventoryService');

async function testSystem() {
    console.log("🚀 INITIALIZING DATABASE FOR TEST...");

    try {
        await initializeDatabase(); // Run migrations and associations

        console.log("1. Testing FinanceService.getClubStats(1)...");
        const stats = await financeService.getClubStats(1);
        console.log("✅ Finance Success:", stats.clubName);

        console.log("2. Testing InventoryService.getRoomsWithComputers(1)...");
        const rooms = await inventoryService.getRoomsWithComputers(1);
        console.log("✅ Inventory Success:", rooms.length, "rooms found.");

        console.log("\n🎊 ALL MODULES OPERATIONAL! No breaks detected.");
    } catch (err) {
        console.error("❌ TEST FAILED:", err.message);
        process.exit(1);
    }
}

testSystem();
