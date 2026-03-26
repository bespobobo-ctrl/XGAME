const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

require('dotenv').config({ path: '../../.env' });
const { initializeDatabase } = require('./database/index');
const { startBillingService } = require('./services/billingService');
const { setupWebSockets } = require('./websocket/index');

const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// Websocket ornatamiz (mini app ulansa bo'lishi u-n cors ni hammaga ochamiz)
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io); // Marshrutlarda (routes) ishlatish imkoni

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API route'larni ulash
app.use('/api', apiRoutes);

// API route'lar kelajakda qo'shiladi
app.get('/ping', (req, res) => {
    res.json({ message: 'GameZone API is running! 🚀', status: 'OK' });
});

// 🌐 Mini App static fayllarni xizmat qilish (build qilingan dist papkasi)
const miniAppPath = path.join(__dirname, '../../mini-app/dist');
app.use(express.static(miniAppPath));

// 🖼️ Yuklangan rasmlar (Uploads) xizmati
const uploadsPath = path.join(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));

// SPA catch-all: API bo'lmagan barcha so'rovlarni index.html ga yo'naltirish
app.get('*', (req, res) => {
    res.sendFile(path.join(miniAppPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    await initializeDatabase();

    // 🛡️ Super Adminni tekshirish va yaratish
    const User = require('./database/models/User');
    const existingAdmin = await User.findOne({ where: { username: '123' } });
    if (!existingAdmin) {
        await User.create({
            username: '123',
            password: '123',
            role: 'super_admin',
            telegramId: '0' // Majburiy maydon to'ldirildi
        });
        console.log('Master Admin yaratildi: 123 / 123 🛡️');
    }

    // WebSockets ulash (Agentlarni eshitadi)
    setupWebSockets(io);

    // Taymer (Pul hisoblash)
    startBillingService(io);

    // Endi qanaqadir app.listen EMAS, balki http serverimiz.listen() chaqiriladi
    server.listen(PORT, () => {
        console.log(`\n========================================`);
        console.log(`🔥 GameZone API (+Sockets) ishga tushdi: http://localhost:${PORT}`);
        console.log(`📱 Mini App: http://localhost:${PORT}`);
        console.log(`========================================\n`);
    });
}

startServer();
