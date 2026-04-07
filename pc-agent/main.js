const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const axios = require('axios');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 🔒 SECURITY: Disable GPU acceleration (Must-have for gaming PCs to prevent crashes)
app.disableHardwareAcceleration();

const CONFIG_PATH = path.join(app.getPath('userData'), 'gamezone_config.json');

// Global State
let mainWindow = null;
let locking = true;
let socket = null;
let heartbeatTimer = null;
let lastStateChange = 0;
const FLICKER_GUARD_MS = 5000; // 5 soniyalik "immunitet"

let config = {
    pcName: os.hostname(),
    agentToken: null,
    pcId: null,
    serverUrl: 'https://father-thank-luck-notes.trycloudflare.com'
};

// 📂 Persistence
function loadConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            config = { ...config, ...data };
            console.log("📦 [Agent] Config yuklandi:", config);
        } catch (e) {
            console.error("Config yuklashda xato:", e);
        }
    }
}
function saveConfig() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * 🛠️ CORE ACTION: Lock/Unlock with Professional Guard
 */
function updatePCStatus(shouldLock, reason = 'Unknown') {
    const now = Date.now();

    // 🛡️ Flicker Guard: Prevent rapid state switching (e.g. within 5s)
    if (locking !== shouldLock && (now - lastStateChange < FLICKER_GUARD_MS)) {
        console.warn(`🛡️ [GUARD] Forcefully ignoring ${shouldLock ? 'LOCK' : 'UNLOCK'} | Reason: ${reason} | Action too rapid!`);
        return;
    }

    // Ignore if same status
    if (locking === shouldLock) return;

    locking = shouldLock;
    lastStateChange = now;
    console.log(`🚀 [STATUS] PC changed to ${locking ? 'LOCKED' : 'UNLOCKED'} | Reason: ${reason} | Time: ${new Date().toLocaleTimeString()}`);

    if (locking) {
        showLockScreen();
    } else {
        hideLockScreen();
    }
}

async function showLockScreen() {
    if (!mainWindow) return;

    // Read background image once and send to renderer (Avoids white-flash)
    let bgBase64 = '';
    try {
        const bgPath = path.join(__dirname, 'assets', 'img', 'bg.jpg');
        if (fs.existsSync(bgPath)) {
            const bitmap = fs.readFileSync(bgPath);
            bgBase64 = `data:image/jpeg;base64,${bitmap.toString('base64')}`;
        }
    } catch (e) {
        console.error("BG load error:", e.message);
    }

    await mainWindow.loadFile('lock.html');
    mainWindow.webContents.send('set-pc-details', {
        id: config.pcId,
        name: config.pcName,
        background: bgBase64
    });

    if (socket?.connected) {
        mainWindow.webContents.send('status-connected', { id: config.pcId });
    }

    mainWindow.show();
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
}

function hideLockScreen() {
    if (!mainWindow) return;
    mainWindow.hide();
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
}

/**
 * 💓 HEARTBEAT: The "Reliability" Layer
 * Checks server every 15s to ensure status is consistent
 */
async function sendHeartbeat() {
    if (!config.agentToken || !config.serverUrl) return;

    try {
        console.log("💓 Sending Heartbeat...");
        const res = await axios.post(`${config.serverUrl}/api/agent/status`,
            { status: locking ? 'free' : 'busy' },
            { headers: { 'x-agent-token': config.agentToken }, timeout: 10000 }
        );

        if (res.data.success && res.data.pcDetails) {
            const serverStatus = res.data.pcDetails.status;
            const shouldBeOpen = (serverStatus === 'busy' || serverStatus === 'paused');

            // Sync with Server State
            if (shouldBeOpen && locking) {
                updatePCStatus(false, 'heartbeat-sync');
            } else if (!shouldBeOpen && !locking) {
                updatePCStatus(true, 'heartbeat-sync');
            }
        }
    } catch (e) {
        console.error("❌ Heartbeat error:", e.message);
    }
}

/**
 * 📡 SOCKET: The "Real-Time" Layer
 * Provides instant lock/unlock capability
 */
function connectSocket() {
    if (!config.agentToken || !config.serverUrl) return;

    if (socket) socket.disconnect();

    socket = io(config.serverUrl, {
        auth: { token: config.agentToken },
        transports: ['websocket'],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
    });

    socket.on('connect', () => {
        console.log("📡 WebSocket connected successfully!");
        socket.emit('register-agent', { pcId: config.pcId });
        if (mainWindow) mainWindow.webContents.send('status-connected', { id: config.pcId });
    });

    socket.on('lock', () => {
        console.log("📡 Socket Command: LOCK");
        updatePCStatus(true, 'socket-command');
    });

    socket.on('unlock', () => {
        console.log("📡 Socket Command: UNLOCK");
        updatePCStatus(false, 'socket-command');
    });

    socket.on('disconnect', (reason) => {
        console.warn("🔌 Socket disconnected:", reason);
        if (mainWindow) mainWindow.webContents.send('status-disconnected');
    });
}

/**
 * 💻 IPC COMMUNICATION
 */
ipcMain.handle('login-attempt', async (_, { username, password }) => {
    try {
        const res = await axios.post(`${config.serverUrl}/api/agent/login`,
            { username, password },
            { headers: { 'x-agent-token': config.agentToken }, timeout: 15000 }
        );
        if (res.data.success) {
            updatePCStatus(false, 'manual-login');
            return { success: true };
        }
        return { success: false, error: res.data.message };
    } catch (e) {
        return { success: false, error: "Server bilan bog'lanishda xatolik!" };
    }
});

ipcMain.handle('pair-pc', async (_, { pairingCode, serverUrl }) => {
    try {
        console.log("🔗 Pairing request sent...");
        const cleanUrl = serverUrl.trim().replace(/\/$/, "");
        const res = await axios.post(`${cleanUrl}/api/agent/pair`, {
            pairingCode: pairingCode.trim(),
            macAddress: getMacAddress(),
            hostname: os.hostname()
        }, { timeout: 15000 });

        if (res.data.success) {
            const { agentToken, pcDetails } = res.data;
            config = {
                ...config,
                agentToken,
                pcId: pcDetails.id,
                pcName: pcDetails.name,
                serverUrl: cleanUrl
            };
            saveConfig();

            // Professional restart after pairing
            app.relaunch();
            app.exit(0);
            return { success: true };
        }
    } catch (e) {
        console.error("Pairing failed:", e.message);
        return { success: false, error: "Server topilmadi yoki kod noto'g'ri." };
    }
});

function getMacAddress() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (!net.internal && net.mac !== '00:00:00:00:00:00') return net.mac;
        }
    }
    return '0-0-0-0-0-0';
}

/**
 * 🎬 MAIN STARTUP
 */
app.on('ready', () => {
    loadConfig();

    const { width, height } = screen.getPrimaryDisplay().bounds;
    mainWindow = new BrowserWindow({
        width,
        height,
        fullscreen: true,
        kiosk: true,
        alwaysOnTop: true,
        frame: false,
        skipTaskbar: true,
        backgroundColor: '#000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    if (!config.agentToken) {
        mainWindow.loadFile('pairing.html').then(() => {
            mainWindow.webContents.send('init-url', config.serverUrl);
        });
    } else {
        // Active mode
        showLockScreen();
        connectSocket();

        // Setup intervals
        heartbeatTimer = setInterval(sendHeartbeat, 15000);
        sendHeartbeat(); // First run
    }

    // Admin Access Keys
    globalShortcut.register('Control+Shift+Q', () => app.quit());
    globalShortcut.register('Control+Alt+R', () => {
        if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
        app.relaunch();
        app.exit(0);
    });
    // Dev only: Control+Shift+U (Local Unlock)
    globalShortcut.register('Control+Shift+U', () => {
        updatePCStatus(false, 'admin-shortcut');
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
