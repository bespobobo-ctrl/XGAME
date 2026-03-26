const { Computer } = require('../database/index');

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

        socket.on('disconnect', () => {
            console.log(`🔌 Kimdir tarmoqdan uzildi. Socket: ${socket.id}`);
            // Aslida kutilmaganda kompyuterdan LAN uzilsa ham uni darhol topa olamiz bu orqali
        });
    });
}

module.exports = { setupWebSockets };
