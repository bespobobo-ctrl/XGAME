const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const axios = require('axios');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to the config file (stores pairing info)
const configPath = path.join(app.getPath('userData'), 'gamezone_config.json');
const SERVER_URL = 'https://father-thank-luck-notes.trycloudflare.com';

let config = {
    pcName: os.hostname(), // Default to Windows hostname until paired
    agentToken: null,
    pcId: null
};

// State
let mainWindow = null;
let locking = true; // Default locked
let socket = null;
let heartbeatTimer = null;

function loadConfig() {
    if (fs.existsSync(configPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config = { ...config, ...data };
            console.log('📦 Config loaded:', config);
        } catch (e) {
            console.error('Config parsing error:', e);
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
            nodeIntegration: true, // Required for ipcRenderer inside HTML
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
        mainWindow.loadFile('pairing.html');
        console.log('⚠️ Status: Unpaired. Loading pairing screen.');
    } else if (locking) {
        mainWindow.loadFile('lock.html').then(() => {
            mainWindow.webContents.send('set-pc-details', { id: config.pcId, name: config.pcName });
        });
        mainWindow.show();
        mainWindow.setKiosk(true);
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        console.log('🔒 Status: Locked. Showing lock screen.');
    } else {
        mainWindow.hide();
        mainWindow.setKiosk(false);
        mainWindow.setAlwaysOnTop(false);
        console.log('🔓 Status: Unlocked. Hiding window.');
    }
}

// 💓 Heartbeat & Sync Logic
async function sendHeartbeat() {
    if (!config.agentToken) return;

    try {
        const response = await axios.post(`${SERVER_URL}/api/agent/status`,
            {
                status: locking ? 'free' : 'busy' // Report current visual state
            },
            {
                headers: { 'x-agent-token': config.agentToken }
            }
        );

        if (response.data.success && response.data.pcDetails) {
            const serverPC = response.data.pcDetails;

            // 1. Sync name if it changed on server (e.g. "Desktop-XXX" -> "PC-01")
            if (serverPC.name && serverPC.name !== config.pcName) {
                console.log(`🏷️ Name Sync: ${config.pcName} -> ${serverPC.name}`);
                config.pcName = serverPC.name;
                saveConfig();
                // Refresh UI if showing lock screen
                if (locking && mainWindow) {
                    mainWindow.webContents.send('set-pc-details', { id: config.pcId, name: config.pcName });
                }
            }

            // 2. Sync state (Unlock if busy/active on server but locked here)
            // busy or paused means the user should actually be playing
            const shouldBeOpen = (serverPC.status === 'busy' || serverPC.status === 'paused');

            if (shouldBeOpen && locking) {
                console.log('🔄 Sync: Unlocking PC based on server status');
                locking = false;
                updateWindowState();
            } else if (!shouldBeOpen && !locking) {
                console.log('🔄 Sync: Locking PC based on server status (Session ended)');
                locking = true;
                updateWindowState();
            }
        }
    } catch (e) {
        console.error('💓 Heartbeat failed:', e.message);
    }
}

async function connectSocket() {
    if (!config.agentToken) return;

    if (socket) {
        socket.disconnect();
    }

    console.log('🔄 Connecting to Socket.io server...');
    socket = io(SERVER_URL, {
        auth: { token: config.agentToken },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log(`✅ Socket connected! Registering PC ID: ${config.pcId}`);
        socket.emit('register-agent', {
            pcId: config.pcId,
            pcName: config.pcName,
            macAddress: getMacAddress(),
            isLocked: locking
        });

        if (mainWindow) {
            mainWindow.webContents.send('status-connected', { id: config.pcId });
        }
    });

    socket.on('lock', () => {
        console.log('🔒 Command: LOCK received');
        locking = true;
        updateWindowState();
    });

    socket.on('unlock', (data) => {
        console.log('🔓 Command: UNLOCK received');
        locking = false;
        updateWindowState();
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        if (mainWindow) {
            mainWindow.webContents.send('status-disconnected');
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

ipcMain.handle('pair-pc', async (event, pairingCode) => {
    try {
        console.log(`🔗 Pairing attempt with code: ${pairingCode}`);
        const response = await axios.post(`${SERVER_URL}/api/agent/pair`, {
            pairingCode: pairingCode.trim(),
            macAddress: getMacAddress(),
            hostname: os.hostname() // Only for server's reference, server shouldn't overwrite PC-01
        });

        if (response.data.success) {
            const details = response.data.pcDetails;
            config.agentToken = response.data.agentToken;
            config.pcId = details.id;
            config.pcName = details.name; // This will be "PC-01" or whatever is in DB
            saveConfig();

            console.log(`✅ Pairing Success! Agent ID: ${config.pcId}, Name: ${config.pcName}`);

            locking = true; // Start locked
            connectSocket();
            updateWindowState();

            // Start heartbeats immediately
            if (!heartbeatTimer) heartbeatTimer = setInterval(sendHeartbeat, 10000);

            return { success: true, pcName: config.pcName };
        }
    } catch (error) {
        console.error('Pairing Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Ulanishda xatolik' };
    }
});

app.whenReady().then(() => {
    loadConfig();
    createLockWindow();

    if (config.agentToken) {
        connectSocket();
        // Check status every 10 seconds to auto-unlock if session is active
        heartbeatTimer = setInterval(sendHeartbeat, 10000);
        sendHeartbeat(); // First check
    }

    // emergency shortcuts
    globalShortcut.register('CommandOrControl+Shift+Esc', () => {
        // Stop default behavior
    });

    globalShortcut.register('CommandOrControl+Q', () => {
        console.log('🔒 Emergency Quit');
        app.exit(0);
    });

    globalShortcut.register('CommandOrControl+Alt+R', () => {
        console.log('🔄 Factory Resetting Agent');
        config = { pcName: os.hostname(), agentToken: null, pcId: null };
        saveConfig();
        app.relaunch();
        app.exit(0);
    });

    globalShortcut.register('CommandOrControl+Shift+U', () => {
        console.log('🔓 Local Emergency Unlock');
        locking = false;
        updateWindowState();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
