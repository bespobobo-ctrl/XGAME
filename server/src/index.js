const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/index');
const { initializeDatabase } = require('./shared/database/index');
const { startBillingService } = require('./services/billingService');
const { setupWebSockets } = require('./websocket/index');
const { User } = require('./shared/database/index');

const server = http.createServer(app);

// 🔌 WEBSOCKETS
const allowedOrigins = config.NODE_ENV === 'production'
    ? [process.env.MINI_APP_URL || 'https://xgame-eta.vercel.app']
    : ['*'];

const io = new Server(server, {
    cors: {
        origin: config.NODE_ENV === 'production' ? allowedOrigins : '*',
        credentials: true
    }
});
app.set('io', io);

async function startServer() {
    try {
        console.log(`\n============== INITIALIZING GAMEZONE SERVER ==============`);

        // 1. Database
        await initializeDatabase();

        // 2. Ensure Super Admin exists
        const existingAdmin = await User.findOne({ where: { username: config.SUPER_ADMIN_USER } });
        if (!existingAdmin) {
            await User.create({
                username: config.SUPER_ADMIN_USER,
                password: config.SUPER_ADMIN_PASS,
                role: 'super_admin',
                telegramId: '0'
            });
            console.log(`🛡️  Master Admin created: ${config.SUPER_ADMIN_USER} / ****`);
        }

        // 3. WebSockets
        setupWebSockets(io);

        // 4. Billing Service
        startBillingService(io);

        // 5. Reservation Monitoring (10m / 5m / penalty)
        const reservationScheduler = require('./scheduler/reservationScheduler');
        reservationScheduler.start(io);

        // 6. Start HTTP Server
        const PORT = config.PORT || 3001;
        server.listen(PORT, () => {
            console.log(`🔥 Server running at: http://localhost:${PORT}`);
            console.log(`📱 Frontend active: http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${config.NODE_ENV}`);
            console.log(`==========================================================\n`);
        });

    } catch (error) {
        console.error('❌ CRITICAL SERVER ERROR:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
