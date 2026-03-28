const { Room, Computer, Session, Transaction, Club, User } = require('../database');

const { Op } = require('sequelize');
const { startOfDay, startOfWeek, startOfMonth, startOfYear } = require('date-fns');

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
                attributes: ['amount', 'createdAt'],
                raw: true
            }),
            Session.findAll({
                where: { startTime: { [Op.gte]: yStart } },
                include: [{ model: Computer, attributes: ['id', 'RoomId', 'name'], where: { ClubId: clubId } }]
            }),
            Computer.findAll({ where: { ClubId: clubId }, raw: true }),
            Session.findAll({
                where: { status: 'paused', reserveTime: { [Op.ne]: null } },
                include: [
                    { model: Computer, where: { ClubId: clubId }, include: [{ model: Room, attributes: ['name'] }] },
                    { model: User, attributes: ['username', 'phone'] }
                ],
                order: [['reserveTime', 'ASC']]
            }),
            Club.findByPk(clubId, { attributes: ['name'], raw: true })
        ]);

        const totalPCs = allComputers.length;
        const busyPCs = allComputers.filter(p => (['busy', 'vip', 'reserved', 'paused'].includes(p.status))).length;
        const freePCs = totalPCs - busyPCs;

        const revenue = { day: 0, week: 0, month: 0, year: 0 };
        const flow = { day: 0, week: 0, month: 0, year: allSessions.length };
        const hours = { day: 0, week: 0, month: 0, year: 0 };
        const pcStats = {};

        const roomsMap = {};
        allRooms.forEach(r => roomsMap[r.id] = r.pricePerHour || 15000);

        allComputers.forEach(pc => {
            pcStats[pc.id] = { name: pc.name, roomId: pc.RoomId, hours: 0, revenue: 0, isBusy: pc.status === 'busy' };
        });

        allSessions.forEach(s => {
            let mins = s.totalMinutes || 0;
            let cost = s.totalCost || 0;

            if (s.Computer) {
                if (s.status === 'active') {
                    mins = Math.max(0, Math.floor((new Date() - new Date(s.startTime)) / 60000));
                } else if (s.status === 'paused' && s.pausedAt && !s.reserveTime) {
                    mins = Math.max(0, Math.floor((new Date(s.pausedAt) - new Date(s.startTime)) / 60000));
                }

                if (s.status === 'active' || (s.status === 'paused' && s.pausedAt && !s.reserveTime)) {
                    const pricePerHour = roomsMap[s.Computer.RoomId] || 15000;
                    cost = Math.floor((mins / 60) * pricePerHour);
                }
            }

            const h = mins / 60;
            const sTime = new Date(s.startTime);

            // Daily stats (What the dashboard actually displays as "KUNLIK")
            if (sTime >= dStart) {
                hours.day += h; flow.day++;
                revenue.day += cost;

                if (pcStats[s.ComputerId]) {
                    pcStats[s.ComputerId].hours += h;
                    pcStats[s.ComputerId].revenue += cost;
                }
            }

            // Other accumulation
            hours.year += h;
            revenue.year += cost;

            if (sTime >= mStart) {
                hours.month += h; flow.month++;
                revenue.month += cost;
            }
            if (sTime >= wStart) {
                hours.week += h; flow.week++;
                revenue.week += cost;
            }
        });

        // Also add other completed transactions that are not necessarily PC session payments
        allTransactions.forEach(t => {
            if (t.type !== 'pc_payment') {
                const date = new Date(t.createdAt);
                if (t.amount > 0) {
                    revenue.year += t.amount;
                    if (date >= mStart) revenue.month += t.amount;
                    if (date >= wStart) revenue.week += t.amount;
                    if (date >= dStart) revenue.day += t.amount;
                }
            }
        });

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
    const clubId = req.user.ClubId;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Xat yozmadingiz' });

    try {
        const club = await Club.findByPk(clubId, { attributes: ['name'] });

        // Fetch all users belonging to this club with valid telegramId
        const users = await User.findAll({
            where: {
                ClubId: clubId,
                telegramId: { [Op.ne]: null },
                status: 'active'
            },
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
                    required: false,
                    separate: false, // Don't use separate if we want to sort via order
                }]
            }],
            order: [
                ['id', 'ASC'],
                [Computer, 'name', 'ASC'],
                [Computer, Session, 'startTime', 'DESC'] // Most recent session first
            ]
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
            // First, look for a reservation or paused session that matches this computer
            const existingSess = await Session.findOne({
                where: {
                    ComputerId: id,
                    status: { [Op.in]: ['active', 'paused'] }
                },
                order: [['startTime', 'DESC']]
            });

            if (existingSess) {
                if (existingSess.status === 'paused') {
                    // Activate a reservation OR resume a regular pause
                    existingSess.status = 'active';
                    existingSess.startTime = new Date(); // Reset start time for a fresh play session from now
                    existingSess.reserveTime = null;
                    existingSess.pausedAt = null;
                    if (expectedMinutes) existingSess.expectedMinutes = expectedMinutes;
                    await existingSess.save();
                    pc.status = 'busy';
                }
                // If already active, it's just a duplicate request, nothing to do
            } else {
                // No existing active/paused session, create a brand new one
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
            const session = await Session.findOne({
                where: {
                    ComputerId: id,
                    status: { [Op.in]: ['active', 'paused'] },
                    reserveTime: null // Bron qilingan lekin hali boshlanmagan sessiyani stop orqali to'xtatib bo'lmaydi (bezoar bo'ladi)
                }
            });
            if (session) {
                session.endTime = new Date();
                session.status = 'completed';

                // If it was paused, usage stopped at pausedAt
                if (session.pausedAt) {
                    session.totalMinutes = Math.max(0, Math.floor((new Date(session.pausedAt) - new Date(session.startTime)) / 60000));
                } else {
                    session.totalMinutes = Math.max(0, Math.floor((session.endTime - session.startTime) / 60000));
                }

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
            let rDate = new Date();
            if (reserveTime && typeof reserveTime === 'string' && reserveTime.includes(':')) {
                const [h, m] = reserveTime.split(':');
                rDate.setHours(parseInt(h), parseInt(m), 0, 0);

                // Agar belgilangan vaqt bugun o'tib ketgan bo'lsa, ertaga uchun bron deb tushunamiz
                if (rDate < new Date()) {
                    rDate.setDate(rDate.getDate() + 1);
                }
            }
            // Create a placeholder session for this reservation
            await Session.create({
                startTime: new Date(),
                ComputerId: id,
                ClubId: clubId,
                status: 'paused', // reserved state representation
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
            const sess = await Session.findOne({
                where: {
                    ComputerId: id,
                    status: 'paused',
                    reserveTime: null // Do not resume a reservation as active via 'resume' action, use 'start' instead
                }
            });
            if (sess) {
                const now = new Date();
                const pauseDur = now - new Date(sess.pausedAt);
                sess.startTime = new Date(new Date(sess.startTime).getTime() + pauseDur);
                sess.status = 'active';
                sess.pausedAt = null;
                await sess.save();
                pc.status = 'busy';
            }
        } else if (action === 'cancel_reserve') {
            const resSess = await Session.findOne({
                where: { ComputerId: id, status: 'paused', reserveTime: { [Op.ne]: null } }
            });
            if (resSess) {
                resSess.status = 'completed';
                await resSess.save();
            }
            const hasOngoing = await Session.findOne({ where: { ComputerId: id, status: 'active' } });
            if (!hasOngoing) pc.status = 'free';
        } else if (action === 'free') {
            const sessionsToClose = await Session.findAll({
                where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } }
            });
            for (const s of sessionsToClose) {
                s.status = 'completed';
                s.endTime = new Date();
                await s.save();
            }
            pc.status = 'free';
        }

        await pc.save();

        // Return fresh PC status
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
