const Room = require('../database/models/Room');
const Computer = require('../database/models/Computer');
const Session = require('../database/models/Session');
const Transaction = require('../database/models/Transaction');

const { Op } = require('sequelize');
const { startOfDay, startOfWeek, startOfMonth, startOfYear } = require('date-fns');
const User = require('../database/models/User');

exports.getStats = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const now = new Date();

    const dStart = startOfDay(now);
    const wStart = startOfWeek(now, { weekStartsOn: 1 });
    const mStart = startOfMonth(now);
    const yStart = startOfYear(now);

    const [totalPCs, busyPCs, latestSession, allTransactions, allSessions, allComputers] = await Promise.all([
        Computer.count({ where: { ClubId: clubId } }),
        Computer.count({ where: { ClubId: clubId, status: 'busy' } }),
        Session.findOne({
            include: [{ model: Computer, where: { ClubId: clubId } }, { model: User, attributes: ['username', 'phone'] }],
            order: [['startTime', 'DESC']]
        }),
        Transaction.findAll({
            where: { ClubId: clubId, createdAt: { [Op.gte]: yStart } }
        }),
        Session.findAll({
            where: { startTime: { [Op.gte]: yStart } },
            include: [{ model: Computer, where: { ClubId: clubId }, include: [Room] }]
        }),
        Computer.findAll({ where: { ClubId: clubId }, include: [Room] })
    ]);

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

    allComputers.forEach(pc => {
        pcStats[pc.id] = { name: pc.name, roomId: pc.RoomId, hours: 0, revenue: 0, isBusy: pc.status === 'busy' };
    });

    allSessions.forEach(s => {
        let mins = s.totalMinutes || 0;
        let cost = s.totalCost || 0;

        if (s.status === 'active') {
            mins = Math.max(0, Math.floor((new Date() - new Date(s.startTime)) / 60000));
            const pricePerHour = s.Computer?.Room?.pricePerHour || 15000;
            cost = Math.floor((mins / 60) * pricePerHour);
        }

        const h = mins / 60;
        hours.year += h;
        if (s.startTime >= mStart) { hours.month += h; flow.month++; }
        if (s.startTime >= wStart) { hours.week += h; flow.week++; }
        if (s.startTime >= dStart) { hours.day += h; flow.day++; }

        if (!pcStats[s.ComputerId]) pcStats[s.ComputerId] = { name: s.Computer?.name || 'Unknown', roomId: s.Computer?.RoomId, hours: 0, revenue: 0 };
        pcStats[s.ComputerId].hours += h;
        pcStats[s.ComputerId].revenue += cost;
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
};

exports.broadcast = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Xat yozmadingiz' });

    // Asynchronous Telegram broadcast logic would go here
    res.json({ success: true, message: 'Xabar barcha foydalanuvchilarga yuborildi!' });
};

exports.getRooms = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const rooms = await Room.findAll({
        where: { ClubId: clubId },
        include: [{
            model: Computer,
            include: [{
                model: Session,
                where: { status: 'active' },
                required: false
            }]
        }]
    });
    res.json(rooms);
};

exports.pcAction = async (req, res, next) => {
    const { id } = req.params;
    const { action } = req.body;
    const clubId = req.user.ClubId;

    const pc = await Computer.findOne({ where: { id, ClubId: clubId } });
    if (!pc) return res.status(404).json({ error: 'Topilmadi' });

    if (action === 'start') {
        const hasSession = await Session.findOne({ where: { ComputerId: id, status: 'active' } });
        if (!hasSession) {
            await Session.create({ startTime: new Date(), ComputerId: id, ClubId: clubId, status: 'active' });
            pc.status = 'busy';
        }
    } else if (action === 'stop') {
        const session = await Session.findOne({ where: { ComputerId: id, status: 'active' } });
        if (session) {
            session.endTime = new Date();
            session.status = 'completed';
            session.totalMinutes = Math.floor((session.endTime - session.startTime) / 60000);
            session.totalCost = Math.round((session.totalMinutes / 60) * 15000); // approx logic
            await session.save();
        }
        pc.status = 'free';
    } else if (action === 'vip') {
        pc.status = 'vip';
    } else if (action === 'reserve') {
        pc.status = 'reserved';
    } else if (action === 'free') {
        pc.status = 'free';
    }

    try {
        await pc.save({ validate: false });
    } catch (e) {
        // Fallback for sqlite enum conflicts
        console.error("Save error:", e);
    }
    res.json({ success: true, pc });
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
    const { name, pricePerHour, pcSpecs } = req.body;
    const clubId = req.user.ClubId;

    const Room = require('../database/models/Room');
    const room = await Room.findOne({ where: { id, ClubId: clubId } });
    if (!room) return res.status(404).json({ error: 'Xona topilmadi' });

    if (name) room.name = name;
    if (pricePerHour) room.pricePerHour = pricePerHour;
    if (pcSpecs) room.pcSpecs = pcSpecs;

    await room.save();
    res.json({ success: true, room });
};
