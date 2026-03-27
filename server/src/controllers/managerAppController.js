const Room = require('../database/models/Room');
const Computer = require('../database/models/Computer');
const Session = require('../database/models/Session');
const Transaction = require('../database/models/Transaction');

exports.getStats = async (req, res, next) => {
    const clubId = req.user.ClubId;

    const [activePlayers, todayTransactions] = await Promise.all([
        Session.count({
            where: { status: 'active' },
            include: [{ model: Computer, where: { ClubId: clubId } }]
        }),
        Transaction.findAll({
            where: { ClubId: clubId }
            // Filter by today's date logic should be here
        })
    ]);

    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
        activePlayers,
        todayRevenue
    });
};

exports.getRooms = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const rooms = await Room.findAll({
        where: { ClubId: clubId },
        include: [Computer]
    });
    res.json(rooms);
};

exports.setup = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const { rooms } = req.body;

    if (!clubId) return res.status(400).json({ error: 'Foydalanuvchi klubga ulanmagan' });
    if (!rooms || !Array.isArray(rooms)) return res.status(400).json({ error: 'Xonalar ma`lumotlari noto`g`ri' });

    // Markazlashgan tranzaksiya (Senior approach)
    const sequelize = require('../database/index').sequelize;
    const t = await sequelize.transaction();

    try {
        for (const roomData of rooms) {
            const room = await Room.create({
                name: roomData.name || 'Asosiy xona',
                ClubId: clubId
            }, { transaction: t });

            const pcCount = parseInt(roomData.pcCount) || 0;
            const price = parseInt(roomData.price) || 20000;

            for (let i = 1; i <= pcCount; i++) {
                await Computer.create({
                    name: `${i}-PC`,
                    RoomId: room.id,
                    ClubId: clubId,
                    status: 'available'
                }, { transaction: t });
            }
        }
        await t.commit();
        res.json({ success: true, message: 'Klub infratuzilmasi muvaffaqiyatli yaratildi!' });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};
