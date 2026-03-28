const { Computer, Session } = require('./src/database');

async function checkReserved() {
    try {
        const reservedPCs = await Computer.findAll({
            where: { status: 'reserved' },
            include: [{ model: Session, where: { status: 'paused' }, required: false }]
        });

        console.log("RESERVED PCS:", JSON.stringify(reservedPCs, (key, value) => {
            if (key === 'ClubId' || key === 'RoomId') return value;
            return value;
        }, 2));
    } catch (e) {
        console.error("DB CHECK ERROR:", e);
    }
}

checkReserved().then(() => process.exit(0));
