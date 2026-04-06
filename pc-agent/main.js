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

            // 2. Sync state
            const shouldBeOpen = (serverPC.status === 'busy' || serverPC.status === 'paused');
            if (shouldBeOpen && locking) {
                console.log('🔄 Sync: Ochilmoqda...');
                locking = false;
                updateWindowState();
            } else if (!shouldBeOpen && !locking) {
                console.log('🔄 Sync: Qulflanmoqda...');
                locking = true;
                updateWindowState();
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
        transports: ['websocket', 'polling'],
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000
    });

    socket.on('connect', () => {
        socket.emit('register-agent', { pcId: config.pcId });
        if (mainWindow) mainWindow.webContents.send('status-connected', { id: config.pcId });
    });

    socket.on('lock', () => { locking = true; updateWindowState(); });
    socket.on('unlock', () => { locking = false; updateWindowState(); });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Disconnected: ${reason}`);
        if (mainWindow) mainWindow.webContents.send('status-disconnected');

        // RECONNECT GRACE PERIOD: Agar sessiya faol bo'lsa va socket uzilsa, 
        // 5 soniya kutamiz. Darhol qulfga urmaymiz (sapchishni oldini olish).
        if (!locking) {
            console.log('🛡️ Grace Period: Sessiya ochiq, socket uzilishini 5s kutamiz...');
            setTimeout(() => {
                if (socket && !socket.connected && !locking) {
                    console.log('🚨 Shutdown: 5s ichida qayta ulanmadi, qulflaymiz.');
                    locking = true;
                    updateWindowState();
                }
            }, 5000);
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
