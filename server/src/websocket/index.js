const { Computer, Session } = require('../shared/database');

function setupWebSockets(io) {
    io.on('connection', (socket) => {
        console.log(`📡 Yangi bog'lanish (Socket ID: ${socket.id})`);

        // Agent o'z ismini aytib ro'yxatdan o'tganda ishlaydi
        socket.on('register-agent', async (data) => {
            const { pcId, macAddress } = data || {};

            let computer = null;
            if (pcId) computer = await Computer.findByPk(pcId);
            if (!computer && macAddress) computer = await Computer.findOne({ where: { macAddress } });

            if (computer) {
                console.log(`🖥️ Agent ulandi: ${computer.name} (ID: ${computer.id})`);
                socket.join(`pc_${computer.id}`);

                computer.lastOnline = new Date();
                if (computer.status === 'offline') computer.status = 'free';
                await computer.save();

                // 🔄 FINAL SYNC: Sessiya borligini tekshiramiz
                const activeSession = await Session.findOne({
                    where: {
                        ComputerId: computer.id,
                        status: ['active', 'paused']
                    }
                });

                if (activeSession) {
                    console.log(`🔓 Sync: Unlocking ${computer.name} (Session: ${activeSession.id})`);
                    // Agar bazada status 'busy' bo'lmay qolgan bo'lsa - to'g'rilaymiz
                    if (computer.status === 'free') {
                        computer.status = 'busy';
                        await computer.save();
                    }
                    socket.emit('unlock');
                } else {
                    console.log(`🔒 Sync: Locking ${computer.name} (No Active Session)`);
                    socket.emit('lock');
                }
            }
        });

        socket.on('join-club', (clubId) => {
            if (clubId) {
                const roomName = `club_${clubId}`;
                socket.join(roomName);
                console.log(`👨‍💼 Manager joined room: ${roomName} (Socket: ${socket.id})`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Kimdir tarmoqdan uzildi. Socket: ${socket.id}`);
        });
    });
}

module.exports = { setupWebSockets };
