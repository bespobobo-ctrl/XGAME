const { Computer } = require('../shared/database');

function setupWebSockets(io) {
    io.on('connection', (socket) => {
        console.log(`📡 Yangi bog'lanish (Socket ID: ${socket.id})`);

        // Agent o'z ismini aytib ro'yxatdan o'tganda ishlaydi
        socket.on('register-pc', async (pcName) => {
            console.log(`🖥️ Agent ulandi: ${pcName}`);

            // Ixtiyoriy xavfsizlik: Barcha shu ismdagi eskilarni o'chirib, shu yangi ulanishni qo'shamiz
            socket.join(pcName);

            try {
                const computer = await Computer.findOne({ where: { name: pcName } });
                if (computer) {
                    // Ulanganini bildirish uchun (offline dan free ga o'tkazish)
                    if (computer.status === 'offline') {
                        computer.status = 'free';
                        await computer.save();
                    }
                    console.log(`🟢 ${pcName} holati 'online (free)' qilindi.`);
                }
            } catch (err) {
                console.log("Xato register pc", err);
            }
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
