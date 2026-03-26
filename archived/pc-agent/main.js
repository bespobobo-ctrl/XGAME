const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Sozlamalarni config.json fayldan o'qiymiz
let config = {
    pcName: 'PC-DEFAULT',
    serverUrl: 'http://localhost:3000'
};

try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        const rawData = fs.readFileSync(configPath);
        config = JSON.parse(rawData);
    }
} catch (err) {
    console.error('❌ Config faylni o`qishda xatolik:', err);
}

const SERVER_URL = config.serverUrl;
const PC_NAME = config.pcName;

let mainWindow = null;
let isLocked = true; // Boshlanishda doim qulf. Server ulanib "Free" desa ochiladi.

// Kompyuter ustuvor (Kiosk) rejimini qamrab oladigan oyna
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: true,
        kiosk: true,        // Eng daxshatli funksiya: Windows da hech narsani bosib bo'lmaydi!!
        alwaysOnTop: true,  // Boshqa barcha o'yin yoki oynalardan TEPADA turadi
        frame: false,
        skipTaskbar: true,  // Taskbarni pastda yashiradi
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('lock.html');

    // Ochilganda ismini qo'shib ketamiz
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('update-pc-name', PC_NAME);
    });

    // Alt+F4 yoki boshqa yopish urinishlarini bloklash
    mainWindow.on('close', (e) => {
        // Agar app.exit() ishlatilsa bu yerga kelmaydi. 
        // Oddiy holatda yopilishni taqiqlaymiz.
        e.preventDefault();
    });
}

function lockPC() {
    if (!mainWindow) createWindow();
    mainWindow.show();
    mainWindow.setKiosk(true);       // Kioskni qayta aktivlash
    mainWindow.setAlwaysOnTop(true);
    isLocked = true;
    console.log('🔒 Kompyuter to`liq qulflanib bo`ldi!');
}

function unlockPC() {
    if (mainWindow) {
        mainWindow.setKiosk(false);      // Kiosk ochiladi
        mainWindow.setAlwaysOnTop(false);
        mainWindow.hide();               // Ekran ko'zdan yo'qoladi, O'yin o'ynash uchun!
    }
    isLocked = false;
    console.log('✅ Kompyuter Ochildi! O`yinni davom ettirishingiz mumkin.');
}

app.whenReady().then(() => {
    createWindow(); // Yoqilganda avtomatik qora ekran boshlanadi!

    console.log('-------------------------------------------');
    console.log('🆘 TEST REJIMIDA QUTQARUVCHI TUGMALAR:');
    console.log('🔹 Ctrl + Q          --> Dasturni yopish');
    console.log('🔹 Ctrl + Shift + U --> Ekran qulfini ochish');
    console.log('-------------------------------------------');

    // === SERVERGA ULANISH QISMI ===
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
        console.log(`📡 Server bilan bog'landi! [Agent: ${PC_NAME}]`);
        // O'zimizni serverga tanishtiramiz
        socket.emit('register-pc', PC_NAME);
    });

    socket.on('disconnect', () => {
        console.log('⚠️ Server bilan uzildi. Xavfsizlik uchun qulflanadi!');
        lockPC(); // Xavfsizlik — Agar Server yo'qolsa ham qulflaydi
    });

    // Server "lock" dilyabdi
    socket.on('lock', () => {
        lockPC();
    });

    // Server "unlock" diyabdi (Tolov tasdiqlandi yoki Boshlandi bosildi)
    socket.on('unlock', () => {
        unlockPC();
    });

    // Windows OT lari uchun shortcut hotkeylarni tutish (kiosk qo'shimchasi)
    globalShortcut.register('CommandOrControl+Alt+Delete', () => {
        console.log('Xaker hujumi to`xtatildi 😎');
    });

    // 🆘 MAXFIY "QUTQARUVCHI" KLAVISHLAR (Faqat Test UCHUN)
    // 1. Ctrl + Q -> Dasturni darhol va so'zsiz yopish (Emergency Exit)
    globalShortcut.register('CommandOrControl+Q', () => {
        console.log('🆘 Maxfiy Qutqaruvchi (Ctrl+Q) ishga tushdi, Dastur yopilmoqda...');
        app.exit(0); // app.quit() dan ko'ra kuchliroq, hamma blokirovkalarni chetlab o'tadi
    });

    // 2. Ctrl + Shift + U -> Faqat qizil ekranni berkitish (Dastur yopilmaydi)
    globalShortcut.register('CommandOrControl+Shift+U', () => {
        console.log('🔓 Maxfiy Qutqaruvchi (Ctrl+Shift+U) - Ekran ochildi!');
        unlockPC();
    });
});

// App odatda o'chib qolishini bloklaymiz
app.on('window-all-closed', (e) => {
    if (process.platform !== 'darwin') e.preventDefault();
});
