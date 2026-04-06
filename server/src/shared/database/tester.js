async function runTests() {
    const serverUrl = 'http://localhost:3001/api/test/force-action';
    console.log("🚀 Stress-Test boshlandi (10 marotaba)...");

    for (let i = 1; i <= 10; i++) {
        console.log(`\n🔄 Sinov #${i}:`);
        try {
            // 1. Vaqtni ochish (Start)
            const res1 = await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pcId: 1, action: 'start' })
            });
            console.log(`✅ Vaqt ochildi. Status: ${res1.status}`);

            await new Promise(r => setTimeout(r, 2000));

            // 2. Vaqtni yopish (Stop)
            const res2 = await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pcId: 1, action: 'stop' })
            });
            console.log(`🛑 Vaqt yopildi. Status: ${res2.status}`);

            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.error(`❌ Xatolik #${i}:`, err.message);
        }
    }
    console.log("\n🏁 Barcha sinovlar yakunlandi.");
}
runTests();
