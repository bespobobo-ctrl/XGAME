const { Room, Computer, Session, Transaction, Club, User } = require('../database');
const { Op } = require('sequelize');
const { startOfDay, startOfWeek, startOfMonth, startOfYear } = require('date-fns');

exports.getStats = async (req, res, next) => {
    try {
        const clubId = req.user.ClubId;
        const now = new Date();
        const dStart = startOfDay(now);
        const wStart = startOfWeek(now);
        const mStart = startOfMonth(now);
        const yStart = startOfYear(now);

        const allRooms = await Room.findAll({ where: { ClubId: clubId } });
        const allRoomIds = allRooms.map(r => r.id);

        const [recentSessions, allTransactions, allSessions, allComputers, upcomingReservations, club] = await Promise.all([
            Session.findAll({
                include: [
                    { model: Computer, attributes: ['name'], where: { ClubId: clubId } },
                    { model: User, attributes: ['username', 'phone'] }
                ],
                where: { status: 'completed' },
                order: [['endTime', 'DESC']],
                limit: 5
            }),
            Transaction.findAll({
                where: { ClubId: clubId, createdAt: { [Op.gte]: yStart } },
                order: [['createdAt', 'DESC']]
            }),
            Session.findAll({
                include: [{ model: Computer, where: { ClubId: clubId } }],
                where: {
                    startTime: { [Op.gte]: yStart },
                    status: 'completed'
                }
            }),
            Computer.findAll({ where: { RoomId: { [Op.in]: allRoomIds } } }),
            Session.findAll({
                include: [{ model: Computer, where: { ClubId: clubId }, include: [Room] }, { model: User }],
                where: { status: { [Op.in]: ['active', 'paused'] }, reserveTime: { [Op.ne]: null } },
                order: [['reserveTime', 'ASC']]
            }),
            Club.findByPk(clubId)
        ]);

        const totalPCs = allComputers.length;
        const busyPCs = allComputers.filter(c => c.status === 'busy').length;
        const freePCs = allComputers.filter(c => c.status === 'free' || c.status === 'available').length;

        const pcStats = {};
        allComputers.forEach(pc => { pcStats[pc.id] = { name: pc.name, id: pc.id, hours: 0, revenue: 0 }; });

        const flow = { day: 0, week: 0, month: 0, year: 0 };
        const hours = { day: 0, week: 0, month: 0, year: 0 };

        allSessions.forEach(s => {
            const h = (s.totalMinutes || 0) / 60;
            const cost = s.totalCost || 0;
            const pcId = s.ComputerId;
            const sTime = new Date(s.startTime);

            if (pcStats[pcId]) {
                pcStats[pcId].hours += h;
                pcStats[pcId].revenue += cost;
            }

            flow.year++; hours.year += h;
            if (sTime >= mStart) { hours.month += h; flow.month++; }
            if (sTime >= wStart) { hours.week += h; flow.week++; }
            if (sTime >= dStart) { hours.day += h; flow.day++; }
        });

        // Accurate Daily Revenue for Uzbekistan (GMT+5)
        const tashkentOffset = 5 * 60 * 60 * 1000;
        const tashkentNow = new Date(new Date().getTime() + tashkentOffset);
        tashkentNow.setUTCHours(0, 0, 0, 0);
        const dStartTashkentInUTC = new Date(tashkentNow.getTime() - tashkentOffset);

        const revenue = {
            day: allTransactions
                .filter(t => new Date(t.createdAt) >= dStartTashkentInUTC)
                .reduce((sum, t) => sum + t.amount, 0),
            week: allTransactions.filter(t => new Date(t.createdAt) >= wStart).reduce((sum, t) => sum + t.amount, 0),
            month: allTransactions.filter(t => new Date(t.createdAt) >= mStart).reduce((sum, t) => sum + t.amount, 0),
            year: allTransactions.reduce((sum, t) => sum + t.amount, 0)
        };

        const topPCs = Object.values(pcStats).sort((a, b) => b.hours - a.hours).slice(0, 3);

        res.json({
            totalPCs, busyPCs, freePCs,
            clubName: club?.name || 'GAME CLUB',
            upcomingReservations: upcomingReservations.map(r => ({
                id: r.id,
                pc: r.Computer?.name,
                room: r.Computer?.Room?.name || 'Unknown',
                user: r.User?.username || 'Guest',
                time: r.reserveTime
            })),
            recentSessions: recentSessions.map(s => ({
                user: s.User?.username || 'Guest',
                phone: s.User?.phone || '',
                pc: s.Computer?.name,
                time: s.endTime,
                cost: s.totalCost,
                duration: s.totalMinutes
            })),
            revenue, flow, hours, topPCs,
            pcStats: Object.values(pcStats)
        });
    } catch (err) {
        console.error("STATS ERROR:", err);
        next(err);
    }
};

exports.broadcast = async (req, res, next) => {
    try {
        const clubId = req.user.ClubId;
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Xat yozmadingiz' });

        const club = await Club.findByPk(clubId, { attributes: ['name'] });
        const users = await User.findAll({
            where: { ClubId: clubId, telegramId: { [Op.ne]: null }, status: 'active' },
            attributes: ['telegramId'],
            raw: true
        });

        const telegramIds = users.filter(u => u.telegramId && !u.telegramId.startsWith('MANAGER_')).map(u => u.telegramId);
        const { broadcastMessage } = require('../utils/bot');
        broadcastMessage(telegramIds, `<b>📣 ${club?.name || 'GAME ZONE'} HABARI</b>\n\n${message}`);

        res.json({ success: true, message: `Xabar yuborilmoqda (${telegramIds.length} users)...` });
    } catch (err) {
        next(err);
    }
};

exports.getRooms = async (req, res, next) => {
    try {
        const clubId = req.user.ClubId;
        const rooms = await Room.findAll({
            where: { ClubId: clubId },
            include: [{
                model: Computer,
                include: [{
                    model: Session,
                    where: { status: { [Op.in]: ['active', 'paused'] } },
                    required: false
                }]
            }],
            order: [
                ['id', 'ASC'],
                [Computer, 'name', 'ASC'],
                [Computer, Session, 'startTime', 'DESC']
            ]
        });
        res.json(rooms);
    } catch (err) {
        next(err);
    }
};

exports.pcAction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, expectedMinutes, reserveTime } = req.body;
        const clubId = req.user.ClubId;

        const pc = await Computer.findOne({ where: { id, ClubId: clubId } });
        if (!pc) return res.status(404).json({ error: 'Kompyuter topilmadi' });

        if (action === 'start') {
            const existingSess = await Session.findOne({
                where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } },
                order: [['startTime', 'DESC']]
            });

            if (existingSess) {
                // Agar pauza yoki bronda bo'lsa, davom ettiramiz
                existingSess.status = 'active';
                if (existingSess.reserveTime) {
                    existingSess.startTime = new Date();
                    existingSess.reserveTime = null;
                }
                existingSess.pausedAt = null;
                if (expectedMinutes) existingSess.expectedMinutes = expectedMinutes;
                await existingSess.save();
                pc.status = 'busy';
            } else {
                // Yangi sessiya ochish
                await Session.create({
                    startTime: new Date(),
                    ComputerId: id,
                    ClubId: clubId,
                    status: 'active',
                    expectedMinutes: expectedMinutes || null
                });
                pc.status = 'busy';
            }
        } else if (action === 'stop') {
            const sessions = await Session.findAll({
                where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } }
            });

            for (const sess of sessions) {
                sess.endTime = new Date();
                sess.status = 'completed';

                // Vaqtni hisoblash (pauzani inobatga olgan holda)
                if (sess.pausedAt && !sess.reserveTime) {
                    sess.totalMinutes = Math.max(0, Math.floor((new Date(sess.pausedAt) - new Date(sess.startTime)) / 60000));
                } else if (!sess.reserveTime) {
                    sess.totalMinutes = Math.max(0, Math.floor((sess.endTime - sess.startTime) / 60000));
                } else {
                    sess.totalMinutes = 0; // Bron qilingan lekin boshlanmagan bo'lsa
                }

                const room = await Room.findByPk(pc.RoomId);
                const price = room ? room.pricePerHour : 15000;
                sess.totalCost = Math.round((sess.totalMinutes / 60) * price);
                await sess.save();

                if (sess.totalCost > 0) {
                    await Transaction.create({
                        amount: sess.totalCost,
                        type: 'pc_payment',
                        ClubId: clubId,
                        UserId: sess.UserId || null,
                        description: `${pc.name} o'yini tugatildi (${sess.totalMinutes} daqiqa)`
                    });
                }
            }
            pc.status = 'free';
        } else if (action === 'reserve') {
            let rDate = new Date();
            if (reserveTime && reserveTime.includes(':')) {
                const [h, m] = reserveTime.split(':');
                rDate.setHours(parseInt(h), parseInt(m), 0, 0);
                if (rDate < new Date()) rDate.setDate(rDate.getDate() + 1);
            }
            await Session.create({
                startTime: new Date(),
                ComputerId: id,
                ClubId: clubId,
                status: 'paused',
                reserveTime: rDate
            });
            pc.status = 'reserved';
        } else if (action === 'pause') {
            const sess = await Session.findOne({ where: { ComputerId: id, status: 'active' } });
            if (sess) {
                sess.status = 'paused';
                sess.pausedAt = new Date();
                await sess.save();
                pc.status = 'paused';
            }
        } else if (action === 'resume') {
            const sess = await Session.findOne({ where: { ComputerId: id, status: 'paused', reserveTime: null } });
            if (sess) {
                if (sess.pausedAt) {
                    const pauseDur = new Date() - new Date(sess.pausedAt);
                    sess.startTime = new Date(new Date(sess.startTime).getTime() + pauseDur);
                }
                sess.status = 'active';
                sess.pausedAt = null;
                await sess.save();
                pc.status = 'busy';
            }
        } else if (action === 'cancel_reserve') {
            await Session.update(
                { status: 'completed', endTime: new Date() },
                { where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] }, reserveTime: { [Op.ne]: null } } }
            );
            const hasOngoing = await Session.findOne({ where: { ComputerId: id, status: 'active', reserveTime: null } });
            if (!hasOngoing) pc.status = 'free';
        } else if (action === 'vip') {
            // VIP bo'lganda barcha ochiq sessiyalarni yopamiz
            await Session.update(
                { status: 'completed', endTime: new Date() },
                { where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } } }
            );
            pc.status = 'vip';
        } else if (action === 'free') {
            // Majburiy tozalash
            await Session.update(
                { status: 'completed', endTime: new Date() },
                { where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } } }
            );
            pc.status = 'free';
        }

        await pc.save();

        // 📢 REAL-TIME YANGILASH (Agar Socket.io ulangan bo'lsa)
        const io = req.app.get('io');
        if (io) {
            io.emit('pc-status-updated', { pcId: pc.id, clubId: pc.ClubId, status: pc.status });
            io.emit('stats-updated', { clubId: pc.ClubId });
        }

        const actionMessages = {
            start: 'Vaqt muvaffaqiyatli ochildi! ▶️',
            stop: 'Vaqt to\'xtatildi va hisob-kitob qilindi! 🧾',
            reserve: 'Bron muvaffaqiyatli amalga oshirildi! 📅',
            cancel_reserve: 'Bron bekor qilindi! ❌',
            pause: 'Vaqt vaqtincha to\'xtatildi (Pauza)! ⏸️',
            resume: 'Vaqt qayta tiklandi! ▶️',
            vip: 'VIP rejim yoqildi! 💎',
            free: 'Kompyuter tozalandi! 🧹'
        };

        res.json({
            success: true,
            message: actionMessages[action] || 'Amal muvaffaqiyatli bajarildi!',
            pc
        });
    } catch (err) {
        console.error("PC ACTION ERROR:", err);
        next(err);
    }
};

exports.setup = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const { rooms } = req.body;
    const { sequelize } = require('../database');
    const t = await sequelize.transaction();
    try {
        for (const roomData of rooms) {
            const room = await Room.create({
                name: roomData.name || 'Room',
                pcSpecs: roomData.pcSpecs || 'Standard',
                pricePerHour: parseInt(roomData.pricePerHour) || 15000,
                pcCount: parseInt(roomData.pcCount) || 0,
                ClubId: clubId
            }, { transaction: t });
            for (let i = 1; i <= room.pcCount; i++) {
                await Computer.create({ name: `${i}-PC`, RoomId: room.id, ClubId: clubId, status: 'available' }, { transaction: t });
            }
        }
        await t.commit();
        res.json({ success: true, message: 'Done' });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};

exports.editRoom = async (req, res, next) => {
    const { id } = req.params;
    const { name, pricePerHour, pcCount } = req.body;
    const clubId = req.user.ClubId;
    try {
        const room = await Room.findOne({ where: { id, ClubId: clubId } });
        if (!room) return res.status(404).json({ error: 'Not found' });
        if (name) room.name = name;
        if (pricePerHour) room.pricePerHour = pricePerHour;
        if (pcCount !== undefined) {
            const newCount = parseInt(pcCount);
            const oldCount = room.pcCount;
            if (newCount > oldCount) {
                for (let i = oldCount + 1; i <= newCount; i++) {
                    await Computer.create({ name: `${i}-PC`, RoomId: room.id, ClubId: clubId, status: 'available' });
                }
            } else if (newCount < oldCount) {
                const pcsToRemove = await Computer.findAll({ where: { RoomId: room.id }, order: [['id', 'DESC']], limit: oldCount - newCount });
                for (const pc of pcsToRemove) await pc.destroy();
            }
            room.pcCount = newCount;
        }
        await room.save();
        res.json({ success: true, room });
    } catch (err) {
        next(err);
    }
};

exports.deleteRoom = async (req, res, next) => {
    const { id } = req.params;
    const clubId = req.user.ClubId;
    try {
        const room = await Room.findOne({ where: { id, ClubId: clubId } });
        if (!room) return res.status(404).json({ error: 'Not found' });
        await Computer.destroy({ where: { RoomId: room.id } });
        await room.destroy();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
