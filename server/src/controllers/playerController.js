const { User, Club, Session, Computer } = require('../database');

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Club, attributes: ['name'] }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        const recentSessions = await Session.findAll({
            where: { UserId: user.id, status: 'completed' },
            include: [{ model: Computer, attributes: ['name'] }],
            order: [['endTime', 'DESC']],
            limit: 5
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                telegramId: user.telegramId,
                name: user.firstName || user.username,
                balance: user.balance,
                ClubId: user.ClubId,
                clubName: user.Club ? user.Club.name : 'Unknown Club',
            },
            recentSessions: recentSessions.map(s => ({
                id: s.id,
                pc: s.Computer ? s.Computer.name : 'PC',
                date: s.endTime,
                duration: s.totalMinutes,
                cost: s.totalCost
            }))
        });
    } catch (error) {
        next(error);
    }
};

exports.getRooms = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user || !user.ClubId) {
            return res.status(400).json({ success: false, message: 'Klubga biriktirilmagansiz' });
        }

        const rooms = await Room.findAll({
            where: { ClubId: user.ClubId },
            include: [{
                model: Computer,
                attributes: ['id', 'name', 'status', 'type', 'pricePerHour'],
                include: [{
                    model: Session,
                    as: 'Sessions',
                    where: { status: { [Op.in]: ['active', 'paused'] } },
                    required: false,
                    attributes: ['startTime', 'guestName']
                }]
            }],
            order: [['name', 'ASC']]
        });

        res.json({ success: true, rooms });
    } catch (error) {
        next(error);
    }
};

exports.reservePc = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reserveTime } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user || !user.ClubId) {
            return res.status(400).json({ success: false, message: 'Klubga biriktirilmagansiz' });
        }

        const pc = await Computer.findOne({ where: { id, ClubId: user.ClubId } });
        if (!pc) return res.status(404).json({ success: false, message: 'Kompyuter topilmadi' });

        if (pc.status === 'busy' || pc.status === 'paused' || pc.status === 'reserved') {
            return res.status(400).json({ success: false, message: "Bu kompyuter hozir bo'sh emas" });
        }

        let rDate = new Date();
        if (reserveTime && reserveTime.includes(':')) {
            const [h, m] = reserveTime.split(':');
            rDate.setHours(parseInt(h), parseInt(m), 0, 0);
            if (rDate < new Date()) rDate.setDate(rDate.getDate() + 1);
        }

        await Session.create({
            startTime: new Date(),
            ComputerId: pc.id,
            ClubId: user.ClubId,
            status: 'paused',
            reserveTime: rDate,
            guestName: user.firstName || user.username,
            guestPhone: user.telegramId || 'Telegram User'
        });

        pc.status = 'reserved';
        await pc.save();

        if (req.app.get('io')) {
            req.app.get('io').to(`club_${user.ClubId}`).emit('room_update');
        }

        res.json({ success: true, message: 'Kompyuter muvaffaqiyatli bron qilindi!' });
    } catch (error) {
        next(error);
    }
};
