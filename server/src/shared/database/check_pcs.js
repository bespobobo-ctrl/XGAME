const { Computer } = require('./index');

async function checkPcs() {
    try {
        const pcs = await Computer.findAll();
        console.log('--- KOMPYUTERLAR RO\'YXATI ---');
        pcs.forEach(pc => {
            console.log(`ID: ${pc.id} | Nomi: ${pc.name} | MAC: ${pc.macAddress} | Status: ${pc.status}`);
        });
        console.log('----------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Xatolik:', error);
        process.exit(1);
    }
}

checkPcs();
