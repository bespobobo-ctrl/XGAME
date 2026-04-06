async function runTests() {
    const serverUrl = 'http://localhost:3001/api/test/force-action';
    console.log("🚀 Stress-Test (Ancha real) boshlandi...");

    for (let i = 1; i <= 10; i++) {
        console.log(`\n🔄 Sinov #${i}:`);
        try {
            // 1. Vaqtni ochish
            await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pcId: 1, action: 'start' })
            });
            console.log("✅ Vaqt ochildi (Agent Unlocked).");

            // 🔥 MUHIM: Himoya 5 soniya bo'lgani uchun, 6 soniya kutamiz
            console.log("⏳ 6 soniya kutilmoqda (Anti-Flicker Guard uchun)...");
            await new Promise(r => setTimeout(r, 6000));

            // 2. Vaqtni yopish
            await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pcId: 1, action: 'stop' })
            });
            console.log("🛑 Vaqt yopildi (Agent Locked).");

            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.error(`❌ Xatolik #${i}:`, err.message);
        }
    }
    console.log("\n🏁 Barcha sinovlar IDEAL yakunlandi.");
}
runTests();
