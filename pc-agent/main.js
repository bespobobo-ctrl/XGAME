const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const axios = require('axios');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 🔒 SECURITY: Disable GPU acceleration (Must-have for gaming PCs to prevent crashes with games)
app.disableHardwareAcceleration();

const CONFIG_PATH = path.join(app.getPath('userData'), 'gamezone_config.json');

// Global State
let mainWindow = null;
let isLocked = true;
let socket = null;
let heartbeatTimer = null;

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
            console.log(`📦 [Agent] Config loaded. PC-ID: ${config.pcId}`);
        } catch (e) {
            console.error("❌ Config error:", e);
        }
    }
}

function saveConfig() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * 🛠️ CORE ACTION: Lock/Unlock
 */
function setPCState(shouldLock, reason = 'Sync') {
    if (isLocked === shouldLock) return;

    isLocked = shouldLock;
    console.log(`🚀 [ACTION] PC STATE -> ${isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'} | REASON: ${reason}`);

    if (isLocked) {
        showLockScreen();
    } else {
        hideLockScreen();
    }
}

async function showLockScreen() {
    if (!mainWindow) return;

    // Clean and simple load
    await mainWindow.loadFile('lock.html');
    mainWindow.webContents.send('set-pc-details', {
        id: config.pcId,
        name: config.pcName
    });

    if (socket?.connected) {
        mainWindow.webContents.send('status-connected');
    }

    mainWindow.show();
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.focus();
}

function hideLockScreen() {
    if (!mainWindow) return;

    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.hide();
    app.focus(); // Give focus back to the desktop/games
}

/**
 * 💓 HEARTBEAT: Ensure sync with server state
 */
async function syncStatus() {
    if (!config.agentToken || !config.serverUrl) return;

    try {
        const res = await axios.post(`${config.serverUrl}/api/agent/status`,
            { status: isLocked ? 'free' : 'busy' },
            { headers: { 'x-agent-token': config.agentToken }, timeout: 10000 }
        );

        if (res.data.success && res.data.pcDetails) {
            const serverStatus = res.data.pcDetails.status;
            // logic: If busy or paused on server -> Local should be UNLOCKED
            const shouldBeUnlocked = (serverStatus === 'busy' || serverStatus === 'paused');

            if (shouldBeUnlocked && isLocked) {
                setPCState(false, 'Heartbeat Sync');
            } else if (!shouldBeUnlocked && !isLocked) {
                setPCState(true, 'Heartbeat Sync');
            }
        }
    } catch (e) {
        console.error(`❌ [HEARTBEAT] Sync Error: ${e.message}`);
    }
}

/**
 * 📡 SOCKET: Real-time commands
 */
function connectSocket() {
    if (!config.agentToken || !config.serverUrl) return;
    if (socket) socket.disconnect();

    socket = io(config.serverUrl, {
        auth: { token: config.agentToken },
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log("📡 [SOCKET] Connected.");
        socket.emit('register-agent', { pcId: config.pcId });
        if (mainWindow) mainWindow.webContents.send('status-connected');
        syncStatus();
    });

    socket.on('lock', () => {
        console.log("📡 [SOCKET] Command: LOCK");
        setPCState(true, 'Socket Command');
    });

    socket.on('unlock', () => {
        console.log("📡 [SOCKET] Command: UNLOCK");
        setPCState(false, 'Socket Command');
    });

    socket.on('disconnect', () => {
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
            setPCState(false, 'Manual Login');
            return { success: true };
        }
        return { success: false, error: res.data.message };
    } catch (e) {
        return { success: false, error: "Server connection error" };
    }
});

ipcMain.handle('pair-pc', async (_, { pairingCode, serverUrl }) => {
    try {
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
            app.relaunch();
            app.exit(0);
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.response?.data?.message || e.message };
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
    console.log(`🚀 GameZone PC Agent v0.4.0 started...`);
    const { width, height } = screen.getPrimaryDisplay().bounds;

    mainWindow = new BrowserWindow({
        width, height, fullscreen: true, kiosk: true, alwaysOnTop: true, frame: false, skipTaskbar: true,
        backgroundColor: '#000',
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    if (!config.agentToken) {
        mainWindow.loadFile('pairing.html').then(() => {
            mainWindow.webContents.send('init-url', config.serverUrl);
        });
    } else {
        showLockScreen();
        connectSocket();
        heartbeatTimer = setInterval(syncStatus, 15000);
    }

    // 1. EXIT: Control+Shift+X
    const exitOk = globalShortcut.register('Control+Shift+X', () => {
        console.log("👋 [EXIT] Quitting...");
        app.quit();
    });
    if (!exitOk) console.error("❌ Exit shortcut (Ctrl+Shift+X) registration failed!");

    // 2. RESET: Control+Alt+R OR Control+Shift+R
    const resetAction = () => {
        console.log("🧹 [RESET] Config deleting... Relaunching!");
        if (fs.existsSync(CONFIG_PATH)) {
            try { fs.unlinkSync(CONFIG_PATH); } catch (e) { }
        }
        app.relaunch();
        app.exit(0);
    };

    const resetOk1 = globalShortcut.register('Control+Alt+R', resetAction);
    const resetOk2 = globalShortcut.register('Control+Shift+R', resetAction);
    const resetOk3 = globalShortcut.register('Control+Alt+Shift+R', resetAction);

    if (!resetOk1 && !resetOk2 && !resetOk3) {
        console.error("❌ Reset shortcuts (R) registration failed!");
    } else {
        console.log("✅ Reset shortcuts (Ctrl+Alt+R / Ctrl+Shift+R / Ctrl+Alt+Shift+R) registered.");
    }

    // 3. FORCE UNLOCK: Control+Shift+U
    globalShortcut.register('Control+Shift+U', () => {
        console.log("🔓 [FORCE] Unlocking...");
        setPCState(false, 'Admin Shortcut');
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

