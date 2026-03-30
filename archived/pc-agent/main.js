const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Sozlamalarni config.json fayldan o'qiymiz
let config = {
    pcName: 'PC-1',
    serverUrl: 'https://xgame-eta.vercel.app' // O'zingizni serveringiz URL-ni kiritishingiz mumkin
};

try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        const rawData = fs.readFileSync(configPath);
        config = JSON.parse(rawData);
    }
} catch (err) {
    console.error('❌ Config yuklab bo`lmadi:', err);
}

const SERVER_URL = config.serverUrl;
const PC_NAME = config.pcName;

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: true,
        kiosk: true,        // Hech narsani bosib bo'lmaydi
        alwaysOnTop: true,  // Boshqa barcha oynalardan tepada
        frame: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('lock.html');

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('update-pc-name', PC_NAME);
    });

    mainWindow.on('close', (e) => {
        e.preventDefault();
    });
}

function lockPC() {
    if (!mainWindow) createWindow();
    mainWindow.show();
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true);
}

function unlockPC() {
    if (mainWindow) {
        mainWindow.setKiosk(false);
        mainWindow.setAlwaysOnTop(false);
        mainWindow.hide();
    }
}

app.whenReady().then(() => {
    createWindow();

    // === SOCKET ULANISH ===
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
        console.log(`📡 Serverga ulandi: ${PC_NAME}`);
        socket.emit('register-pc', PC_NAME);
    });

    socket.on('disconnect', () => {
        console.log('⚠️ Server bilan aloqa uzildi. Qulflanadi!');
        lockPC();
    });

    socket.on('lock', () => {
        console.log('🔒 Server buyrug`i: QULFLASH');
        lockPC();
    });

    socket.on('unlock', (data) => {
        console.log('🔓 Server buyrug`i: OCHISH', data);
        unlockPC();
    });

    // 🆘 MAXFIY TUGMALAR (Emergency)
    globalShortcut.register('CommandOrControl+Q', () => {
        console.log('🆘 Ctrl+Q: Dastur butunlay yopilmoqda');
        app.exit(0);
    });

    globalShortcut.register('CommandOrControl+Shift+U', () => {
        console.log('🔓 Ctrl+Shift+U: Ekran vaqtincha ochildi');
        unlockPC();
    });
});

app.on('window-all-closed', (e) => {
    if (process.platform !== 'darwin') e.preventDefault();
});
