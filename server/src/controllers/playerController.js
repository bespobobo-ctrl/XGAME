const { User, Club, Session, Computer, Room, Transaction } = require('../shared/database');
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

        // 🇺🇿 TOSHKENT VAQTI (GMT+5) QAT'IY HISOB-KITOB
        const nowInTashkent = new Date(new Date().getTime() + (5 * 3600000));
        const todayStr = nowInTashkent.toISOString().split('T')[0];
        const now = new Date();
        let rDate;

        if (reserveTime && reserveTime.includes(':')) {
            rDate = new Date(`${todayStr}T${reserveTime}:00+05:00`);
            // Agar vaqt o'tib ketgan bo'lsa, ertangi kunga
            if (rDate < now) {
                const tomorrowInTashkent = new Date(nowInTashkent.getTime() + 86400000);
                const tomStr = tomorrowInTashkent.toISOString().split('T')[0];
                rDate = new Date(`${tomStr}T${reserveTime}:00+05:00`);
            }
        } else {
            return res.status(400).json({ success: false, message: 'Vaqt noto\'g\'ri kiritilgan' });
        }

        await Session.create({
            startTime: rDate, // ⬅️ BU MUHIM! Tanlangan vaqtni startTime ga yozamiz
            ComputerId: pc.id,
            RoomId: pc.RoomId, // 🛡️ Analytics Xona daromadini hisoblashi uchun majburiy
            ClubId: user.ClubId,
            UserId: user.id,
            status: 'reserved',
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
            where: { ComputerId: id, status: 'reserved' },
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

        // Extract PC ID if it's a URL or formatted as "pc_ID"
        let pcIdOrName = qrData;
        if (qrData.includes('startapp=pc_')) {
            pcIdOrName = qrData.split('startapp=pc_')[1].split('&')[0];
        } else if (qrData.startsWith('pc_')) {
            pcIdOrName = qrData.substring(3);
        }

        // Fix: Don't restrict by user.ClubId as the user might be new and not assigned yet
        const pc = await Computer.findOne({
            where: {
                [Op.or]: [
                    { id: isNaN(pcIdOrName) ? -1 : parseInt(pcIdOrName) },
                    { name: pcIdOrName }
                ]
            }
        });

        if (!pc) return res.status(404).json({ success: false, message: 'Kompyuter topilmadi' });

        // Auto-assign user to this club if not assigned
        if (!user.ClubId) {
            user.ClubId = pc.ClubId;
            await user.save();
        }

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
            setTimeout(() => {
                io.to(`pc_${pc.id}`).emit('unlock', { sessionId: session.id, guestName: user.username });
                io.to(`club_${user.ClubId}`).emit('room_update');
            }, 500);
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
