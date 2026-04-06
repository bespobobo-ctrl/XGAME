const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const axios = require('axios');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to the config file (stores pairing info)
const configPath = path.join(app.getPath('userData'), 'gamezone_config.json');

let config = {
    pcName: os.hostname(),
    agentToken: null,
    pcId: null,
    serverUrl: 'https://father-thank-luck-notes.trycloudflare.com' // Standart manzil
};

// State
let mainWindow = null;
let locking = true;
let socket = null;
let heartbeatTimer = null;
let lastUnlockTime = 0; // 🛡️ Anti-Flicker Guard (Client-Side)
const UNLOCK_GUARD_MS = 2000; // 2 soniya yengil himoya, ortiqcha qotishsiz

function canLock() {
    const elapsed = Date.now() - lastUnlockTime;
    if (elapsed < UNLOCK_GUARD_MS) {
        console.log(`🛡️ GUARD: Lock bloklandi! (Ochilganidan ${Math.round(elapsed / 1000)}s o'tdi, ${Math.round((UNLOCK_GUARD_MS - elapsed) / 1000)}s qoldi)`);
        return false;
    }
    return true;
}

function doUnlock(reason = 'Unknown') {
    if (!locking) return; // Allaqachon ochiq
    lastUnlockTime = Date.now();
    locking = false;
    console.log(`🔓 PC OCHILDI (Unlock) | Sabab: ${reason}`);
    updateWindowState();
}

function doLock(reason = 'Unknown') {
    if (locking) return; // Allaqachon qulflangan
    if (!canLock()) return; // Guard faol — qulflamaymiz!
    locking = true;
    console.log(`🔒 PC QULFLANDI (Lock) | Sabab: ${reason}`);
    updateWindowState();
}

function loadConfig() {
    if (fs.existsSync(configPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config = { ...config, ...data };
            console.log('📦 Config yuklandi:', config);
        } catch (e) {
            console.error('Config o\'qishda xato:', e);
        }
    }
}

function saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function createLockWindow() {
    if (mainWindow) return;

    const { width, height } = screen.getPrimaryDisplay().bounds;

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        fullscreen: true,
        kiosk: true,
        alwaysOnTop: true,
        frame: false,
        skipTaskbar: true,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.on('close', (e) => {
        if (locking && config.agentToken) e.preventDefault();
    });

    updateWindowState();
}

function updateWindowState() {
    if (!mainWindow) return;

    if (!config.agentToken) {
        mainWindow.loadFile('pairing.html').then(() => {
            mainWindow.webContents.send('init-url', config.serverUrl);
        });
    } else if (locking) {
        mainWindow.loadFile('lock.html').then(() => {
            mainWindow.webContents.send('set-pc-details', { id: config.pcId, name: config.pcName });
            if (socket && socket.connected) {
                mainWindow.webContents.send('status-connected', { id: config.pcId });
            }
        });
        mainWindow.show();
        mainWindow.setKiosk(true);
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
    } else {
        mainWindow.hide();
        mainWindow.setKiosk(false);
        mainWindow.setAlwaysOnTop(false);
    }
}

// 💓 Heartbeat & Sync Logic
async function sendHeartbeat() {
    if (!config.agentToken || !config.serverUrl) return;

    try {
        const response = await axios.post(`${config.serverUrl}/api/agent/status`,
            {
                status: locking ? 'free' : 'busy'
            },
            {
                headers: { 'x-agent-token': config.agentToken },
                timeout: 5000
            }
        );

        if (response.data.success && response.data.pcDetails) {
            const serverPC = response.data.pcDetails;

            // 1. Sync name
            if (serverPC.name && serverPC.name !== config.pcName) {
                config.pcName = serverPC.name;
                saveConfig();
                if (locking && mainWindow) {
                    mainWindow.webContents.send('set-pc-details', { id: config.pcId, name: config.pcName });
                }
            }

            // 2. Sync state (Guard bilan himoyalangan)
            const shouldBeOpen = (serverPC.status === 'busy' || serverPC.status === 'paused');
            console.log(`💓 API STATUS KELDI: ${serverPC.status}`);

            if (shouldBeOpen && locking) {
                console.log('🔄 Heartbeat Sync: Ochilmoqda...');
                doUnlock('heartbeat');
            } else if (!shouldBeOpen && !locking) {
                console.log('🔄 Heartbeat Sync: Qulflanmoqda...');
                doLock('heartbeat');
            }
        }
    } catch (e) {
        console.error('💓 Heartbeat uzildi:', e.message);
    }
}

async function connectSocket() {
    if (!config.agentToken || !config.serverUrl) return;

    if (socket) socket.disconnect();

    socket = io(config.serverUrl, {
        auth: { token: config.agentToken },
        transports: ['websocket'], // Majburiy WebSocket orqali Real-Time, sekin Polling ni olib tashlaymiz
        reconnectionDelay: 1000,
        reconnectionDelayMax: 3000
    });

    socket.on('connect', () => {
        socket.emit('register-agent', { pcId: config.pcId });
        if (mainWindow) mainWindow.webContents.send('status-connected', { id: config.pcId });
    });

    socket.on('lock', () => { console.log('📡 Socket: lock signal received'); doLock('socket'); });
    socket.on('unlock', () => { console.log('📡 Socket: unlock signal received'); doUnlock('socket'); });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Disconnected: ${reason}`);
        if (mainWindow) mainWindow.webContents.send('status-disconnected');

        // RECONNECT GRACE PERIOD: Agar sessiya faol bo'lsa va socket uzilsa, 
        // 5 soniya kutamiz. Darhol qulfga urmaymiz (sapchishni oldini olish).
        if (!locking) {
            console.log('🛡️ Grace Period: Sessiya ochiq, socket uzilishini 30s kutamiz...');
            setTimeout(() => {
                if (socket && !socket.connected && !locking) {
                    console.log('🚨 Shutdown: 30s ichida qayta ulanmadi, qulflaymiz.');
                    doLock('timeout');
                }
            }, 30000); // 30 soniya grace period
        }
    });
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
    return '0-0-0-0-0-0';
}

ipcMain.handle('login-attempt', async (event, { username, password }) => {
    try {
        if (!config.agentToken || !config.serverUrl) return { success: false, error: 'Taqdimotchi topilmadi!' };

        const response = await axios.post(`${config.serverUrl}/api/agent/login`,
            { username, password },
            {
                headers: { 'x-agent-token': config.agentToken },
                timeout: 10000
            }
        );

        if (response.data.success) {
            doUnlock('manual-login');
            return { success: true };
        } else {
            return { success: false, error: response.data.message };
        }
    } catch (e) {
        console.error('Login Error:', e.message);
        return { success: false, error: 'Server bilan aloqa uzildi!' };
    }
});

ipcMain.handle('pair-pc', async (event, { pairingCode, serverUrl }) => {
    try {
        const cleanUrl = serverUrl.trim().replace(/\/$/, ""); // Oxiridagi / ni olib tashlaymiz
        const response = await axios.post(`${cleanUrl}/api/agent/pair`, {
            pairingCode: pairingCode.trim(),
            macAddress: getMacAddress(),
            hostname: os.hostname()
        }, { timeout: 10000 });

        if (response.data.success) {
            const details = response.data.pcDetails;
            config.agentToken = response.data.agentToken;
            config.pcId = details.id;
            config.pcName = details.name;
            config.serverUrl = cleanUrl;
            saveConfig();

            locking = true;
            connectSocket();
            updateWindowState();

            if (!heartbeatTimer) heartbeatTimer = setInterval(sendHeartbeat, 10000);
            return { success: true, pcName: config.pcName };
        }
    } catch (error) {
        console.error('Pairing Error:', error.message);
        return { success: false, error: 'Serverga ulanib bo\'lmadi. Manzilni tekshiring.' };
    }
});

app.whenReady().then(() => {
    loadConfig();
    createLockWindow();

    if (config.agentToken) {
        connectSocket();
        heartbeatTimer = setInterval(sendHeartbeat, 10000);
        sendHeartbeat();
    }

    // Emergency keys
    globalShortcut.register('CommandOrControl+Q', () => app.exit(0));
    globalShortcut.register('CommandOrControl+Alt+R', () => {
        config = { pcName: os.hostname(), agentToken: null, pcId: null, serverUrl: config.serverUrl };
        saveConfig();
        app.relaunch();
        app.exit(0);
    });
    globalShortcut.register('CommandOrControl+Shift+U', () => {
        locking = false;
        updateWindowState();
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
