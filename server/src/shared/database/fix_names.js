const { Computer } = require('./index');

async function fixNames() {
    try {
        const pcs = await Computer.findAll();
        for (const pc of pcs) {
            // Agar nom "DESKTOP-" bilan boshlansa yoki bo'sh bo'lsa, uni to'g'rilaymiz
            if (pc.name.startsWith('DESKTOP-') || !pc.name) {
                const newName = `PC-${pc.id}`; // Masalan: PC-85
                console.log(`🛠️ Fixing: ${pc.name} -> ${newName} (ID: ${pc.id})`);
                pc.name = newName;
                await pc.save();
            }
        }
        console.log('✅ Barcha nomlar muvaffaqiyatli to\'g\'rilandi!');
        process.exit(0);
    } catch (error) {
        console.error('FixNames Xatosi:', error);
        process.exit(1);
    }
}

fixNames();
