const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// CONFIG
const CONFIG_PATH = path.join(__dirname, 'config.json');
const SERVER_URL = 'http://localhost:5000/api'; // O'zingizning server manzilingiz (masalan: tunnel URL)

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('🚀 GameZone PC Agent ishga tushdi...');

    let config = {};
    if (fs.existsSync(CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }

    // 1. Agar Token bo'lmasa - Pairing (Bog'lanish)
    if (!config.agentToken) {
        console.log('❌ Ushbu kompyuter hali tizimga ulanmagan.');
        rl.question('Manager bergan 6 xonali Pairing Kodini kiriting: ', async (code) => {
            try {
                const macAddress = getMacAddress();
                const hostname = os.hostname();

                console.log(`🔗 Serverga ulanish so'ralmoqda (${SERVER_URL})...`);
                const response = await axios.post(`${SERVER_URL}/agent/pair`, {
                    pairingCode: code,
                    macAddress: macAddress,
                    hostname: hostname
                });

                if (response.data.success) {
                    config.agentToken = response.data.agentToken;
                    config.pcId = response.data.pcDetails.id;
                    config.pcName = response.data.pcDetails.name;

                    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
                    console.log(`✅ Muvaffaqiyatli bog'landi: ${config.pcName}`);
                    startHeartbeat(config.agentToken);
                }
            } catch (error) {
                console.error('❌ Xatolik:', error.response?.data?.message || error.message);
                process.exit(1);
            }
        });
    } else {
        // 2. Token bo'lsa - Heartbeatni boshlash
        console.log(`✅ Kompyuter aniqlandi: ${config.pcName}`);
        startHeartbeat(config.agentToken);
    }
}

function startHeartbeat(token) {
    console.log('💓 Heartbeat boshlandi...');

    // Har 30 soniyada holatni yuborib turish
    setInterval(async () => {
        try {
            await axios.post(`${SERVER_URL}/agent/status`, {}, {
                headers: { 'x-agent-token': token }
            });
            console.log(`[${new Date().toLocaleTimeString()}] Status yangilandi (Online)`);
        } catch (error) {
            console.error('⚠️ Server bilan aloqa uzildi:', error.message);
        }
    }, 30000);
}

// MAC manzilni olish (Oddiy ko'rinishda)
function getMacAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (const key in networkInterfaces) {
        for (const net of networkInterfaces[key]) {
            if (!net.internal && net.mac !== '00:00:00:00:00:00') {
                return net.mac;
            }
        }
    }
    return '00:00:00:00:00:00';
}

main();
