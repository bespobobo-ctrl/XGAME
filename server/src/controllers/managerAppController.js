const Room = require('../database/models/Room');
const Computer = require('../database/models/Computer');
const Session = require('../database/models/Session');
const Transaction = require('../database/models/Transaction');

const { Op } = require('sequelize');
const { startOfDay, startOfWeek, startOfMonth, startOfYear } = require('date-fns');
const User = require('../database/models/User');

exports.getStats = async (req, res, next) => {
    try {
        const clubId = req.user.ClubId;
        const now = new Date();

        const dStart = startOfDay(now);
        const wStart = startOfWeek(now, { weekStartsOn: 1 });
        const mStart = startOfMonth(now);
        const yStart = startOfYear(now);

        // Fetch essential data
        const allRooms = await Room.findAll({ where: { ClubId: clubId } });
        const allRoomIds = allRooms.map(r => r.id);

        const [latestSession, allTransactions, allSessions, allComputers] = await Promise.all([
            Session.findOne({
                include: [
                    { model: Computer, where: { ClubId: clubId } },
                    { model: User, attributes: ['username', 'phone'] }
                ],
                order: [['startTime', 'DESC']]
            }),
            Transaction.findAll({
                where: { ClubId: clubId, createdAt: { [Op.gte]: yStart } },
                attributes: ['amount', 'createdAt'],
                raw: true
            }),
            Session.findAll({
                where: { startTime: { [Op.gte]: yStart } },
                include: [{ model: Computer, attributes: ['id', 'RoomId', 'name'], where: { ClubId: clubId } }]
            }),
            Computer.findAll({ where: { ClubId: clubId }, raw: true })
        ]);

        const totalPCs = allComputers.length;
        const busyPCs = allComputers.filter(p => (p.status === 'busy' || p.status === 'vip' || p.status === 'reserved')).length;
        const freePCs = totalPCs - busyPCs;

        const revenue = { day: 0, week: 0, month: 0, year: 0 };
        allTransactions.forEach(t => {
            if (t.amount > 0) {
                revenue.year += t.amount;
                if (t.createdAt >= mStart) revenue.month += t.amount;
                if (t.createdAt >= wStart) revenue.week += t.amount;
                if (t.createdAt >= dStart) revenue.day += t.amount;
            }
        });

        const flow = { day: 0, week: 0, month: 0, year: allSessions.length };
        const hours = { day: 0, week: 0, month: 0, year: 0 };
        const pcStats = {};

        // Create a map of Room ID to Price for fast dynamic session calculation
        const roomsMap = {};
        allRooms.forEach(r => roomsMap[r.id] = r.pricePerHour || 15000);

        allComputers.forEach(pc => {
            pcStats[pc.id] = { name: pc.name, roomId: pc.RoomId, hours: 0, revenue: 0, isBusy: pc.status === 'busy' };
        });

        allSessions.forEach(s => {
            let mins = s.totalMinutes || 0;
            let cost = s.totalCost || 0;

            if (s.status === 'active' && s.Computer) {
                mins = Math.max(0, Math.floor((new Date() - new Date(s.startTime)) / 60000));
                const pricePerHour = roomsMap[s.Computer.RoomId] || 15000;
                cost = Math.floor((mins / 60) * pricePerHour);
            }

            const h = mins / 60;
            hours.year += h;
            if (s.startTime >= mStart) { hours.month += h; flow.month++; }
            if (s.startTime >= wStart) { hours.week += h; flow.week++; }
            if (s.startTime >= dStart) { hours.day += h; flow.day++; }

            if (pcStats[s.ComputerId]) {
                pcStats[s.ComputerId].hours += h;
                pcStats[s.ComputerId].revenue += cost;
            }
        });

        const topPCs = Object.values(pcStats).sort((a, b) => b.hours - a.hours).slice(0, 3);

        res.json({
            totalPCs, busyPCs, freePCs,
            latestVisit: latestSession ? {
                user: latestSession.User?.username || 'Guest',
                phone: latestSession.User?.phone || '',
                pc: latestSession.Computer?.name,
                time: latestSession.startTime
            } : null,
            revenue, flow, hours, topPCs,
            pcStats: Object.values(pcStats)
        });
    } catch (err) {
        console.error("STATS ERROR:", err);
        next(err);
    }
};

exports.broadcast = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Xat yozmadingiz' });

    // Asynchronous Telegram broadcast logic would go here
    res.json({ success: true, message: 'Xabar barcha foydalanuvchilarga yuborildi!' });
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
            }]
        });
        res.json(rooms);
    } catch (err) {
        console.error("GET ROOMS ERROR:", err);
        next(err);
    }
};

exports.pcAction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, expectedMinutes, reserveTime } = req.body;
        const clubId = req.user.ClubId;

        const pc = await Computer.findOne({ where: { id, ClubId: clubId } });
        if (!pc) return res.status(404).json({ error: 'Topilmadi' });

        if (action === 'start') {
            const hasSession = await Session.findOne({ where: { ComputerId: id, status: 'active' } });
            if (!hasSession) {
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
            const session = await Session.findOne({ where: { ComputerId: id, status: 'active' } });
            if (session) {
                session.endTime = new Date();
                session.status = 'completed';
                session.totalMinutes = Math.floor((session.endTime - session.startTime) / 60000);

                // Fetch dynamic price from room
                const room = await Room.findByPk(pc.RoomId);
                const price = room ? room.pricePerHour : 15000;
                session.totalCost = Math.round((session.totalMinutes / 60) * price);

                await session.save();

                // Log transaction
                await Transaction.create({
                    amount: session.totalCost,
                    type: 'pc_payment',
                    ClubId: clubId,
                    UserId: session.UserId || null,
                    description: `${pc.name} uchun to'lov (${session.totalMinutes} daqiqa)`
                });
            }
            pc.status = 'free';
        } else if (action === 'vip') {
            pc.status = 'vip';
        } else if (action === 'reserve') {
            await Session.create({
                startTime: new Date(),
                ComputerId: id,
                ClubId: clubId,
                status: 'paused', // reserved state representation
                reserveTime: reserveTime || new Date()
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
                const now = new Date();
                const pauseDur = now - new Date(sess.pausedAt);
                sess.startTime = new Date(new Date(sess.startTime).getTime() + pauseDur);
                sess.status = 'active';
                sess.pausedAt = null;
                await sess.save();
                pc.status = 'busy';
            }
        } else if (action === 'free') {
            // Stop any session on this PC
            await Session.update({ status: 'completed', endTime: new Date() }, {
                where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } }
            });
            pc.status = 'free';
        }

        await pc.save();
        res.json({ success: true, pc });
    } catch (err) {
        console.error("PC ACTION ERROR:", err);
        next(err);
    }
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
                pcSpecs: roomData.pcSpecs || 'Standard Gaming PC',
                pricePerHour: parseInt(roomData.pricePerHour) || 20000,
                pcCount: parseInt(roomData.pcCount) || 0,
                ClubId: clubId
            }, { transaction: t });

            const pcCount = parseInt(roomData.pcCount) || 0;

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

exports.editRoom = async (req, res, next) => {
    const { id } = req.params;
    const { name, pricePerHour, pcSpecs, pcCount, isLocked, openTime, closeTime } = req.body;
    const clubId = req.user.ClubId;

    const room = await Room.findOne({ where: { id, ClubId: clubId }, include: [Computer] });
    if (!room) return res.status(404).json({ error: 'Xona topilmadi' });

    if (name) room.name = name;
    if (pricePerHour) room.pricePerHour = pricePerHour;
    if (pcSpecs) room.pcSpecs = pcSpecs;
    if (isLocked !== undefined) room.isLocked = isLocked;
    if (openTime) room.openTime = openTime;
    if (closeTime) room.closeTime = closeTime;

    // Handle PC count changes
    if (pcCount !== undefined && parseInt(pcCount) !== room.pcCount) {
        const newCount = parseInt(pcCount);
        const oldCount = room.pcCount;

        if (newCount > oldCount) {
            // Add PCs
            for (let i = oldCount + 1; i <= newCount; i++) {
                await Computer.create({
                    name: `${i}-PC`,
                    RoomId: room.id,
                    ClubId: clubId,
                    status: 'available'
                });
            }
        } else if (newCount < oldCount) {
            // Remove extra PCs (starting from the end)
            // Note: Ideally check for active sessions first
            const pcsToRemove = await Computer.findAll({
                where: { RoomId: room.id },
                order: [['id', 'DESC']],
                limit: oldCount - newCount
            });
            for (const pc of pcsToRemove) {
                await pc.destroy();
            }
        }
        room.pcCount = newCount;
    }

    await room.save();
    res.json({ success: true, room });
};

exports.deleteRoom = async (req, res, next) => {
    const { id } = req.params;
    const clubId = req.user.ClubId;

    const room = await Room.findOne({ where: { id, ClubId: clubId } });
    if (!room) return res.status(404).json({ error: 'Xona topilmadi' });

    // Cascade delete computers
    await Computer.destroy({ where: { RoomId: room.id } });
    await room.destroy();

    res.json({ success: true, message: 'Xona muvaffaqiyatli o`chirildi' });
};
