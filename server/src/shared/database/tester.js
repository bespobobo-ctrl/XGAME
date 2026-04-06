const axios = require('axios');

async function runTests() {
    const serverUrl = 'http://localhost:3001';
    console.log("🚀 Stress-Test boshlandi (10 marotaba)...");

    for (let i = 1; i <= 10; i++) {
        console.log(`\n🔄 Sinov #${i}:`);
        try {
            // 1. Vaqtni ochish (Start)
            await axios.post(`${serverUrl}/api/test/force-action`, { pcId: 1, action: 'start' });
            console.log("✅ Vaqt ochildi (PC Unlocked).");

            // 2 soniya kutib, tekshirish (Flicker-guard uchun)
            await new Promise(r => setTimeout(r, 2000));

            // 2. Vaqtni yopish (Stop)
            await axios.post(`${serverUrl}/api/test/force-action`, { pcId: 1, action: 'stop' });
            console.log("🛑 Vaqt yopildi (PC Locked).");

            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.error(`❌ Xatolik #${i}:`, err.message);
        }
    }
    console.log("\n🏁 Barcha sinovlar yakunlandi.");
}
runTests();
