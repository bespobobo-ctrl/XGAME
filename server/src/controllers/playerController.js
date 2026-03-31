const { User, Club, Session, Computer, Room } = require('../database');
const { Op } = require('sequelize');

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
                name: (user.firstName && user.firstName !== '_' && user.firstName !== '-') ? user.firstName : user.username,
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
            console.log(`[MAP_ERROR] User not assigned to club: ${req.user.id}`);
            return res.status(400).json({ success: false, message: 'Klubga biriktirilmagansiz' });
        }

        console.log(`[MAP_FETCH] User: ${user.username}, ClubId: ${user.ClubId}`);

        const rooms = await Room.findAll({
            where: { ClubId: user.ClubId },
            include: [{
                model: Computer,
                include: [{
                    model: Session,
                    where: { status: { [Op.in]: ['active', 'paused'] } },
                    required: false
                }]
            }],
            order: [['name', 'ASC']]
        });

        console.log(`[MAP_SUCCESS] Found ${rooms.length} rooms for Club ${user.ClubId}`);
        if (rooms.length > 0) {
            console.log(`[MAP_DETAIL] Room 1 PCs: ${rooms[0].Computers?.length || 0}`);
        }
        res.json({ success: true, rooms });
    } catch (error) {
        console.error("GET_ROOMS_ERROR:", error);
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

        // 🇺🇿 TOSHKENT VAQTINI HISOBGA OLISH (UTC+5)
        let rDate = new Date();
        if (reserveTime && reserveTime.includes(':')) {
            const [h, m] = reserveTime.split(':');
            const now = new Date();
            rDate = new Date(now.getTime());
            rDate.setUTCHours(parseInt(h) - 5, parseInt(m), 0, 0);
            if (rDate < now) {
                rDate.setUTCDate(rDate.getUTCDate() + 1);
            }
        }

        await Session.create({
            startTime: new Date(),
            ComputerId: pc.id,
            ClubId: user.ClubId,
            UserId: user.id,
            status: 'reserved', // Statusni to'g'ridan-to'g'ri 'reserved' qilamiz
            reserveTime: rDate,
            guestName: user.firstName && user.firstName !== '_' ? user.firstName : user.username,
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

exports.cancelReserve = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });

        const pc = await Computer.findByPk(id);
        if (!pc) return res.status(404).json({ success: false, message: 'Kompyuter topilmadi' });

        // User faqat o'zining reservationini o'chira oladi (yoki manager bo'lmasa)
        // Biz player controlleridamiz, demak faqat player uchun
        const session = await Session.findOne({
            where: { ComputerId: id, status: 'paused', reserveTime: { [Op.ne]: null } },
            order: [['createdAt', 'DESC']]
        });

        if (session) {
            // Check if it's their own or they are manager (req.user.role is not available here, but they are in player controller)
            if (session.UserId !== user.id) {
                return res.status(403).json({ success: false, message: "Siz faqat o'zingiz bron qilgan kompyuterni bekor qila olasiz" });
            }
            session.status = 'cancelled';
            await session.save();
        }

        pc.status = 'free';
        await pc.save();

        if (req.app.get('io')) {
            req.app.get('io').to(`club_${pc.ClubId}`).emit('room_update');
        }

        res.json({ success: true, message: 'Bron muvaffaqiyatli bekor qilindi!' });
    } catch (error) {
        next(error);
    }
};

exports.unlockWithQR = async (req, res, next) => {
    try {
        const { qrData } = req.body;
        if (!qrData) return res.status(400).json({ success: false, message: 'QR ma\'lumotlar topilmadi' });

        const user = await User.findByPk(req.user.id);
        if (!user || user.balance < 1000) {
            return res.status(400).json({ success: false, message: 'Balansingiz yetarli emas (kamida 1000 UZS)' });
        }

        // Try to find PC by Name (typical for Agents) or ID
        const pc = await Computer.findOne({
            where: {
                [Op.or]: [{ id: qrData }, { name: qrData }],
                ClubId: user.ClubId
            }
        });

        if (!pc) return res.status(404).json({ success: false, message: 'Kompyuter topilmadi' });
        if (pc.status === 'busy' || pc.status === 'paused') {
            return res.status(400).json({ success: false, message: 'Bu kompyuter hozir band' });
        }

        // Create Active Session (Unlimited balance-based)
        const session = await Session.create({
            startTime: new Date(),
            ComputerId: pc.id,
            ClubId: user.ClubId,
            UserId: user.id,
            status: 'active',
            totalMinutes: 0,
            totalCost: 0,
            guestName: user.username
        });

        pc.status = 'busy';
        await pc.save();

        const io = req.app.get('io');
        if (io) {
            io.to(pc.name).emit('unlock', { sessionId: session.id, guestName: user.username });
            io.to(`club_${user.ClubId}`).emit('room_update');
        }

        res.json({ success: true, message: 'Kompyuter ochildi! O\'yinga tayyorlaning 🎮' });
    } catch (error) {
        next(error);
    }
};

exports.submitTopUp = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user || user.status !== 'active') return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

        if (!req.file) return res.status(400).json({ error: 'Chek suratini yuklang' });

        await Transaction.create({
            amount: parseInt(amount) || 0,
            type: 'deposit',
            ClubId: user.ClubId,
            UserId: user.id,
            status: 'pending',
            receiptImage: req.file.path,
            description: `To'lov so'rovi: ${user.username}`,
            comment: `Foydalanuvchi tomonidan yuborilgan chek`
        });

        res.json({ success: true, message: 'To\'lov so\'rovi yuborildi! Admin tasdiqlashini kuting 🕒' });
    } catch (error) {
        next(error);
    }
};
