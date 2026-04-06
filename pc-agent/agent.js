const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const readline = require('readline');

// CONFIG
const CONFIG_PATH = path.join(__dirname, 'config.json');
// API manzili to'g'irlandi (slash api qo'shildi)
const SERVER_URL = 'https://father-thank-luck-notes.trycloudflare.com/api';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Xatolik chiqqanda qora oyna birdaniga yopilib ketmasligi uchun
async function waitExit(msg = 'Chiqish (yopish) uchun ENTER tugmasini bosing...') {
    return new Promise(resolve => {
        rl.question(msg, () => {
            process.exit(1);
        });
    });
}

// Windows tizimini qulflash funksiyasi
function lockPC() {
    console.log('🔒 PC Qulflanmoqda...');
    exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
        if (err) console.error("Qulflashda xatolik:", err);
    });
}

async function main() {
    console.log('🚀 GameZone PC Agent ishga tushdi...');

    let config = {};
    if (fs.existsSync(CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }

    if (!config.agentToken) {
        console.log('❌ Ushbu kompyuter hali tizimga ulanmagan.');
        rl.question('Manager bergan 6 xonali Pairing Kodini kiriting: ', async (code) => {
            try {
                console.log(`🔗 Serverga ulanish so'ralmoqda...`);
                // /api orqali yuborish
                const response = await axios.post(`${SERVER_URL}/agent/pair`, {
                    pairingCode: code.trim(),
                    macAddress: getMacAddress(),
                    hostname: os.hostname()
                });

                if (response.data.success) {
                    config.agentToken = response.data.agentToken;
                    config.pcId = response.data.pcDetails.id;
                    config.pcName = response.data.pcDetails.name;

                    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
                    console.log(`\n✅ Muvaffaqiyatli bog'landi: ${config.pcName}`);

                    // Muvaffaqiyatli ulangan zaxoti PC ni qulflaydi!
                    lockPC();
                    startHeartbeat(config.agentToken);
                }
            } catch (error) {
                console.error('\n❌ Xatolik yuz berdi:', error.response?.data?.message || error.message);
                await waitExit(); // Oyna tez yopilib qolmaydi o'qish imkoni bo'ladi
            }
        });
    } else {
        console.log(`✅ Kompyuter aniqlandi: ${config.pcName}`);
        startHeartbeat(config.agentToken);
    }
}

function startHeartbeat(token) {
    console.log('💓 Heartbeat boshlandi. Har 20 soniyada Server bilan bog\'lanmoqda...');

    // Status update 20 seconds loop
    setInterval(async () => {
        try {
            const res = await axios.post(`${SERVER_URL}/agent/status`, {}, {
                headers: { 'x-agent-token': token }
            });
            console.log(`[${new Date().toLocaleTimeString()}] Status yangilandi (Online)`);

            // Serverdan bloklash buyrug'i kelsa
            if (res.data.command === 'lock') {
                lockPC();
            }
        } catch (error) {
            console.error('⚠️ Server bilan aloqa uzildi:', error.message);
        }
    }, 20000);
}

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
