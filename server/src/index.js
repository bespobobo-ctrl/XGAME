const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/index');
const { initializeDatabase } = require('./database/index');
const { startBillingService } = require('./services/billingService');
const { setupWebSockets } = require('./websocket/index');
const User = require('./database/models/User');

const server = http.createServer(app);

// 🔌 WEBSOCKETS (Centralized Management)
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io); // Makes IO accessible in route controllers via req.app.get('io')

async function startServer() {
    try {
        console.log(`\n============== INITIALIZING GAMEZONE SERVER ==============`);

        // 1. Link Database
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

        // 3. Connect WebSockets
        setupWebSockets(io);

        // 4. Start Internal Services (Billing, etc.)
        startBillingService(io);

        // 5. Start HTTP Server
        const PORT = config.PORT || 3001;
        server.listen(PORT, () => {
            console.log(`🔥 Server running at: http://localhost:${PORT}`);
            console.log(`📱 Frontend active: http://localhost:${PORT}`);
            console.log(`==========================================================\n`);
        });

    } catch (error) {
        console.error('❌ CRITICAL SERVER ERROR:', error);
        process.exit(1);
    }
}

startServer();
