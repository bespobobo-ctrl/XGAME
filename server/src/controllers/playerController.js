const { User, Club, Session, Computer, Room, Transaction } = require('../shared/database');
const sessionService = require('../modules/panelC/sessionService');
const { Op } = require('sequelize');

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Club, attributes: ['name'] }]
        });

        if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

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
                name: (user.firstName && user.firstName !== '_') ? user.firstName : user.username,
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
        if (!user || !user.ClubId) return res.status(400).json({ success: false, message: 'Klubga biriktirilmagansiz' });

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
        res.json({ success: true, rooms });
    } catch (error) {
        next(error);
    }
};

exports.unlockWithQR = async (req, res, next) => {
    try {
        const { qrData } = req.body;
        if (!qrData) return res.status(400).json({ success: false, message: 'QR ma\'lumotlar topilmadi' });

        const user = await User.findByPk(req.user.id);
        if (!user || (user.balance !== null && user.balance < 1000)) {
            return res.status(400).json({ success: false, message: 'Balansingiz yetarli emas (kamida 1000 UZS)' });
        }

        let pcIdOrName = qrData;
        if (qrData.includes('startapp=pc_')) {
            pcIdOrName = qrData.split('startapp=pc_')[1].split('&')[0];
        } else if (qrData.startsWith('pc_')) {
            pcIdOrName = qrData.substring(3);
        }

        const pc = await Computer.findOne({
            where: {
                [Op.or]: [
                    { id: isNaN(pcIdOrName) ? -1 : parseInt(pcIdOrName) },
                    { name: pcIdOrName }
                ]
            }
        });

        if (!pc) return res.status(404).json({ success: false, message: 'Kompyuter topilmadi' });

        // 🚀 PRO-FIX: Use Centralized SessionService for Scan
        const result = await sessionService.executeAction(pc.id, pc.ClubId, {
            action: 'start',
            userId: user.id,
            guestName: user.username
        }, {
            origin: 'player-qr'
        });

        // Emit Unlock via Socket
        const io = req.app.get('io');
        if (io) {
            setTimeout(() => {
                io.to(`pc_${pc.id}`).emit('unlock');
                io.to(`club_${pc.ClubId}`).emit('room_update');
            }, 100);
        }

        res.json({ success: true, message: 'Kompyuter ochildi! O\'yinga tayyorlaning 🎮' });
    } catch (error) {
        console.error("QR_UNLOCK_ERROR:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.submitTopUp = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

        if (!req.file) return res.status(400).json({ error: 'Chek suratini yuklang' });

        await Transaction.create({
            amount: parseInt(amount) || 0,
            type: 'deposit',
            ClubId: user.ClubId,
            UserId: user.id,
            status: 'pending',
            receiptImage: req.file.path,
            description: `To'lov so'rovi: ${user.username}`
        });

        res.json({ success: true, message: 'To\'lov so\'rovi yuborildi!' });
    } catch (error) {
        next(error);
    }
};

exports.reservePc = async (req, res, next) => {
    try {
        const pcId = req.params.id;
        const { time, guestName, guestPhone } = req.body;
        const user = await User.findByPk(req.user.id);

        const result = await sessionService.executeAction(pcId, user.ClubId, {
            action: 'reserve',
            userId: user.id,
            reserveTime: time,
            guestName: guestName || user.username,
            guestPhone: guestPhone || user.phone
        });

        const io = req.app.get('io');
        if (io) io.to(`club_${user.ClubId}`).emit('room_update');

        res.json({ success: true, message: 'Muvaffaqiyatli bron qilindi!' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.cancelReserve = async (req, res, next) => {
    try {
        const pcId = req.params.id;
        const user = await User.findByPk(req.user.id);

        await sessionService.executeAction(pcId, user.ClubId, { action: 'cancel_reserve' });

        const io = req.app.get('io');
        if (io) io.to(`club_${user.ClubId}`).emit('room_update');

        res.json({ success: true, message: 'Bron bekor qilindi' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
