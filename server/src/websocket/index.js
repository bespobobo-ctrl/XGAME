const { Computer, Session } = require('../shared/database');

function setupWebSockets(io) {
    io.on('connection', (socket) => {
        console.log(`📡 Yangi bog'lanish (Socket ID: ${socket.id})`);

        socket.on('register-agent', async (data) => {
            const { pcId, macAddress } = data || {};
            let computer = null;
            if (pcId) computer = await Computer.findByPk(pcId);
            if (!computer && macAddress) computer = await Computer.findOne({ where: { macAddress } });

            if (computer) {
                console.log(`🖥️ Agent ulandi: ${computer.name} (ID: ${computer.id})`);
                socket.join(`pc_${computer.id}`);

                // DEBUG: Bazadagi hamma sessiyalarni tekshirish
                const allSessions = await Session.findAll({ where: { ComputerId: computer.id } });
                console.log(`🔍 DEBUG: PC ${computer.id} uchun jami ${allSessions.length} ta sessiya topildi.`);
                allSessions.forEach(s => console.log(`👉 ID: ${s.id}, Status: ${s.status}`));

                const activeSession = await Session.findOne({
                    where: {
                        ComputerId: computer.id,
                        status: ['active', 'paused']
                    }
                });

                if (activeSession) {
                    console.log(`🔓 FINAL SYNC: Unlocking (Session Found: ${activeSession.id})`);
                    if (computer.status === 'free') {
                        computer.status = 'busy';
                        await computer.save();
                    }
                    socket.emit('unlock');
                } else {
                    console.log(`🔒 FINAL SYNC: Locking (No Active Session in DB!)`);
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
