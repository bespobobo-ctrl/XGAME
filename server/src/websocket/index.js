const { Computer } = require('../shared/database');

function setupWebSockets(io) {
    io.on('connection', (socket) => {
        console.log(`📡 Yangi bog'lanish (Socket ID: ${socket.id})`);

        // Agent o'z ismini aytib ro'yxatdan o'tganda ishlaydi
        socket.on('register-agent', async (data) => {
            const { pcId, pcName, macAddress } = data || {};

            let computer = null;
            if (pcId) computer = await Computer.findByPk(pcId);
            if (!computer && macAddress) computer = await Computer.findOne({ where: { macAddress } });

            if (computer) {
                console.log(`🖥️ Agent ulandi: ${computer.name} (ID: ${computer.id})`);
                socket.join(`pc_${computer.id}`);
                socket.join(`pc_${computer.name}`); // Fallback

                computer.lastOnline = new Date();
                if (computer.status === 'offline') computer.status = 'free';
                await computer.save();

                // 🔄 STATUS SYNC: Sessiya borligini tekshiramiz
                const { Session } = require('../shared/database');
                const activeSession = await Session.findOne({
                    where: { ComputerId: computer.id, status: 'active' }
                });

                if (activeSession || computer.status === 'busy' || computer.status === 'paused') {
                    console.log(`🔓 Sync: Unlocking ${computer.name} (Active Session Found)`);
                    socket.emit('unlock');
                } else {
                    console.log(`🔒 Sync: Locking ${computer.name} (No Active Session)`);
                    socket.emit('lock');
                }
            }
        });

        // Eskicha usul moshligini saqlash uchun (agar eski agentlar bo'lsa)
        socket.on('register-pc', async (pcName) => {
            socket.join(pcName);
        });

        /**
         * 👥 MANAGER JOIN CLUB ROOM
         */
        socket.on('join-club', (clubId) => {
            if (clubId) {
                const roomName = `club_${clubId}`;
                socket.join(roomName);
                console.log(`👨‍💼 Manager joined room: ${roomName} (Socket: ${socket.id})`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Kimdir tarmoqdan uzildi. Socket: ${socket.id}`);
            // Aslida kutilmaganda kompyuterdan LAN uzilsa ham uni darhol topa olamiz bu orqali
        });
    });
}

module.exports = { setupWebSockets };
