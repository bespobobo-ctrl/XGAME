const { Room, Computer, Session, Transaction, Club, User, sequelize } = require('../database');
const { Op } = require('sequelize');
const { startOfWeek, startOfMonth, startOfYear } = require('date-fns');
const { broadcastMessage } = require('../utils/bot');

/**
 * Toshkent (UTC+5) vaqt zonasiga mos kun boshlanishini hisoblash
 */
function getTashkentDayStart() {
    const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
    const tashkentNow = new Date(Date.now() + TASHKENT_OFFSET_MS);
    tashkentNow.setUTCHours(0, 0, 0, 0);
    return new Date(tashkentNow.getTime() - TASHKENT_OFFSET_MS);
}

// ═══════════════════════════════════════════════
// 📊 STATISTIKA
// ═══════════════════════════════════════════════
exports.getStats = async (req, res, next) => {
    try {
        const clubId = req.user.ClubId;
        const now = new Date();
        const dStart = getTashkentDayStart();
        const wStart = startOfWeek(now, { weekStartsOn: 1 });
        const mStart = startOfMonth(now);
        const yStart = startOfYear(now);

        const allRooms = await Room.findAll({ where: { ClubId: clubId }, attributes: ['id'] });
        const allRoomIds = allRooms.map(r => r.id);

        const [recentSessions, allTransactions, completedSessions, allComputers, ongoingSessions, upcomingReservations, club, roomsWithPrice] = await Promise.all([
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
                include: [{ model: Computer, attributes: ['id', 'name'], where: { ClubId: clubId } }],
                where: {
                    startTime: { [Op.gte]: yStart },
                    status: 'completed'
                }
            }),
            Computer.findAll({ where: { RoomId: { [Op.in]: allRoomIds } } }),
            Session.findAll({
                include: [{ model: Computer, where: { ClubId: clubId }, include: [Room] }],
                where: { status: 'active', reserveTime: null, startTime: { [Op.gte]: yStart } }
            }),
            Session.findAll({
                include: [
                    { model: Computer, where: { ClubId: clubId }, include: [Room] },
                    { model: User }
                ],
                where: { status: { [Op.in]: ['active', 'paused'] }, reserveTime: { [Op.ne]: null } },
                order: [['reserveTime', 'ASC']]
            }),
            Club.findByPk(clubId),
            Room.findAll({ where: { ClubId: clubId } })
        ]);

        const totalPCs = allComputers.length;
        const busyPCs = allComputers.filter(c => c.status === 'busy').length;
        const freePCs = allComputers.filter(c => c.status === 'free').length;
        const reservedPCs = allComputers.filter(c => c.status === 'reserved').length;

        const pcStats = {};
        allComputers.forEach(pc => {
            const room = roomsWithPrice.find(r => r.id === pc.RoomId);
            pcStats[pc.id] = {
                name: pc.name,
                id: pc.id,
                roomId: pc.RoomId,
                hours: 0,
                revenue: 0,
                pricePerHour: room?.pricePerHour || 15000
            };
        });

        const flow = { day: 0, week: 0, month: 0, year: 0 };
        const hours = { day: 0, week: 0, month: 0, year: 0 };

        // 1. TUGALLANGAN SEANSIYALAR (Completed)
        completedSessions.forEach(s => {
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

        // 2. DAVOM ETAYOTGAN SEANSIYALAR (Real-time active)
        let activeUnrealizedRevenue = { day: 0, week: 0, month: 0, year: 0 };
        ongoingSessions.forEach(s => {
            const sTime = new Date(s.startTime);
            const diffMs = Math.max(0, now - sTime);
            const h = diffMs / 3600000;
            const pcId = s.ComputerId;
            const roomPrice = pcStats[pcId]?.pricePerHour || 15000;
            const currentCost = Math.round(h * roomPrice);

            if (pcStats[pcId]) {
                pcStats[pcId].hours += h;
                pcStats[pcId].revenue += currentCost;
            }

            activeUnrealizedRevenue.year += currentCost;
            if (sTime >= mStart) activeUnrealizedRevenue.month += currentCost;
            if (sTime >= wStart) activeUnrealizedRevenue.week += currentCost;
            if (sTime >= dStart) activeUnrealizedRevenue.day += currentCost;

            // Flow count for active sessions too
            flow.year++;
            if (sTime >= mStart) flow.month++;
            if (sTime >= wStart) flow.week++;
            if (sTime >= dStart) flow.day++;

            hours.year += h;
            if (sTime >= mStart) hours.month += h;
            if (sTime >= wStart) hours.week += h;
            if (sTime >= dStart) hours.day += h;
        });

        const revenue = {
            day: allTransactions.filter(t => new Date(t.createdAt) >= dStart).reduce((sum, t) => sum + t.amount, 0) + activeUnrealizedRevenue.day,
            week: allTransactions.filter(t => new Date(t.createdAt) >= wStart).reduce((sum, t) => sum + t.amount, 0) + activeUnrealizedRevenue.week,
            month: allTransactions.filter(t => new Date(t.createdAt) >= mStart).reduce((sum, t) => sum + t.amount, 0) + activeUnrealizedRevenue.month,
            year: allTransactions.reduce((sum, t) => sum + t.amount, 0) + activeUnrealizedRevenue.year
        };

        const topPCs = Object.values(pcStats).sort((a, b) => b.hours - a.hours).slice(0, 3);

        res.json({
            totalPCs, busyPCs, freePCs, reservedPCs,
            clubName: club?.name || 'GAME CLUB',
            upcomingReservations: upcomingReservations.map(r => ({
                id: r.id,
                pc: r.Computer?.name,
                room: r.Computer?.Room?.name || 'Unknown',
                user: r.User?.username || r.guestName || 'Guest',
                phone: r.User?.phone || r.guestPhone || '',
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

// ═══════════════════════════════════════════════
// 📣 BROADCAST
// ═══════════════════════════════════════════════
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

        const telegramIds = users
            .filter(u => u.telegramId && !u.telegramId.startsWith('MANAGER_'))
            .map(u => u.telegramId);

        broadcastMessage(telegramIds, `<b>📣 ${club?.name || 'GAME ZONE'} HABARI</b>\n\n${message}`);

        res.json({ success: true, message: `Xabar yuborilmoqda (${telegramIds.length} users)...` });
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════
// 🏠 XONALAR
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
// 🖥️ PC ACTION HANDLERS
// ═══════════════════════════════════════════════

/**
 * PC ni yoqish (start)
 */
async function handleStart(pc, id, clubId, body) {
    const { expectedMinutes } = body;
    const existingSess = await Session.findOne({
        where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } },
        order: [['createdAt', 'DESC']]
    });

    if (existingSess) {
        existingSess.status = 'active';
        if (existingSess.reserveTime) {
            existingSess.startTime = new Date();
            existingSess.reserveTime = null;
        }
        existingSess.pausedAt = null;
        if (expectedMinutes) existingSess.expectedMinutes = expectedMinutes;
        await existingSess.save();
    } else {
        await Session.create({
            startTime: new Date(),
            ComputerId: id,
            ClubId: clubId,
            status: 'active',
            expectedMinutes: expectedMinutes || null
        });
    }
    pc.status = 'busy';
}

/**
 * PC ni to'xtatish va hisob-kitob (stop)
 */
async function handleStop(pc, id, clubId) {
    const sessions = await Session.findAll({
        where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } }
    });

    if (sessions.length === 0) {
        pc.status = 'free';
        return;
    }

    const room = await Room.findByPk(pc.RoomId);
    const price = room ? room.pricePerHour : 15000;

    for (const sess of sessions) {
        const wasPaused = sess.status === 'paused';
        const wasReserved = !!sess.reserveTime;

        sess.endTime = new Date();
        sess.status = 'completed';

        // Vaqtni hisoblash
        if (wasPaused && sess.pausedAt && !wasReserved) {
            // Pauza holatida to'xtatilgan — faqat pauza gacha bo'lgan vaqt
            const timeUpToPause = Math.floor((new Date(sess.pausedAt) - new Date(sess.startTime)) / 60000);
            sess.totalMinutes = Math.max(0, timeUpToPause);
        } else if (wasReserved) {
            // Bron qilingan lekin ochilmagan
            sess.totalMinutes = 0;
        } else {
            // Oddiy aktiv sessiya
            sess.totalMinutes = Math.max(0, Math.floor((new Date() - new Date(sess.startTime)) / 60000));
        }

        sess.totalCost = Math.round((sess.totalMinutes / 60) * price);
        await sess.save();

        if (sess.totalCost > 0) {
            await Transaction.create({
                amount: sess.totalCost,
                type: 'pc_payment',
                ClubId: clubId,
                UserId: sess.UserId || null,
                description: `${pc.name} o'yini tugatildi (${sess.totalMinutes} daqiqa). Mijoz: ${sess.guestName || 'Mehmon'}`
            });
        }
    }
    pc.status = 'free';
}

/**
 * PC ni bron qilish (reserve)
 */
async function handleReserve(pc, id, clubId, body) {
    const { reserveTime, guestName, guestPhone } = body;

    // Mavjud sessiya borligini tekshirish
    const existing = await Session.findOne({
        where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } }
    });
    if (existing) {
        throw Object.assign(new Error('Bu kompyuter hozir band'), { status: 400 });
    }

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
        reserveTime: rDate,
        guestName: guestName || null,
        guestPhone: guestPhone || null
    });
    pc.status = 'reserved';
}

/**
 * PC ni pauzaga olish
 */
async function handlePause(pc, id) {
    const sess = await Session.findOne({ where: { ComputerId: id, status: 'active' } });
    if (sess) {
        sess.status = 'paused';
        sess.pausedAt = new Date();
        await sess.save();
    }
    pc.status = 'paused';
}

/**
 * PC ni pauzadan tiklash
 */
async function handleResume(pc, id) {
    const sess = await Session.findOne({
        where: { ComputerId: id, status: 'paused', reserveTime: null }
    });
    if (sess) {
        if (sess.pausedAt) {
            const pauseDur = new Date() - new Date(sess.pausedAt);
            sess.startTime = new Date(new Date(sess.startTime).getTime() + pauseDur);
        }
        sess.status = 'active';
        sess.pausedAt = null;
        await sess.save();
    }
    pc.status = 'busy';
}

/**
 * Bron bekor qilish
 */
async function handleCancelReserve(pc, id) {
    await Session.update(
        { status: 'completed', endTime: new Date(), totalMinutes: 0, totalCost: 0 },
        { where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] }, reserveTime: { [Op.ne]: null } } }
    );
    pc.status = 'free';
}

/**
 * VIP rejim
 */
async function handleVip(pc, id) {
    await Session.update(
        { status: 'completed', endTime: new Date() },
        { where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } } }
    );
    pc.status = 'vip';
}

/**
 * PC ni bo'shatish
 */
async function handleFree(pc, id) {
    await Session.update(
        { status: 'completed', endTime: new Date() },
        { where: { ComputerId: id, status: { [Op.in]: ['active', 'paused'] } } }
    );
    pc.status = 'free';
}

/**
 * PC ni qo'lda band qilish (Lock)
 */
async function handleLock(pc) {
    pc.status = 'busy';
}

// Action handlers map
const actionHandlers = {
    start: handleStart,
    stop: handleStop,
    reserve: handleReserve,
    pause: handlePause,
    resume: handleResume,
    cancel_reserve: handleCancelReserve,
    vip: handleVip,
    free: handleFree,
    lock: handleLock,
};

const actionMessages = {
    start: 'Vaqt muvaffaqiyatli ochildi! ▶️',
    stop: "Vaqt to'xtatildi va hisob-kitob qilindi! 🧾",
    reserve: 'Bron muvaffaqiyatli amalga oshirildi! 📅',
    cancel_reserve: 'Bron bekor qilindi! ❌',
    pause: "Vaqt vaqtincha to'xtatildi (Pauza)! ⏸️",
    resume: 'Vaqt qayta tiklandi! ▶️',
    vip: 'VIP rejim yoqildi! 💎',
    free: 'Kompyuter tozalandi! 🧹',
    lock: 'Kompyuter band holatiga o\'tkazildi! 🔒'
};

/**
 * 🎮 Asosiy PC Action Controller
 */
exports.pcAction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        const clubId = req.user.ClubId;

        // Validatsiya
        if (!action || !actionHandlers[action]) {
            return res.status(400).json({ error: `Noto'g'ri amal: ${action}. Ruxsat etilganlar: ${Object.keys(actionHandlers).join(', ')}` });
        }

        const pc = await Computer.findOne({ where: { id, ClubId: clubId } });
        if (!pc) return res.status(404).json({ error: 'Kompyuter topilmadi' });

        // Handler chaqirish
        if (action === 'start' || action === 'reserve') {
            await actionHandlers[action](pc, id, clubId, req.body);
        } else if (action === 'stop') {
            await actionHandlers[action](pc, id, clubId);
        } else {
            await actionHandlers[action](pc, id);
        }

        await pc.save();

        // 📢 REAL-TIME YANGILASH
        const io = req.app.get('io');
        if (io) {
            io.emit('pc-status-updated', { pcId: pc.id, clubId: pc.ClubId, status: pc.status });
            io.emit('stats-updated', { clubId: pc.ClubId });
        }

        res.json({
            success: true,
            message: actionMessages[action] || 'Amal muvaffaqiyatli bajarildi!',
            pc
        });
    } catch (err) {
        console.error("PC ACTION ERROR:", err);
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        next(err);
    }
};

// ═══════════════════════════════════════════════
// ⚙️ SOZLAMALAR (SETUP, EDIT, DELETE)
// ═══════════════════════════════════════════════
exports.setup = async (req, res, next) => {
    const clubId = req.user.ClubId;
    const { rooms } = req.body;

    if (!Array.isArray(rooms) || rooms.length === 0) {
        return res.status(400).json({ error: "Kamida bitta xona bo'lishi kerak" });
    }

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
                await Computer.create({
                    name: `${i}-PC`,
                    RoomId: room.id,
                    ClubId: clubId,
                    status: 'free'
                }, { transaction: t });
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
                    await Computer.create({
                        name: `${i}-PC`,
                        RoomId: room.id,
                        ClubId: clubId,
                        status: 'free'
                    });
                }
            } else if (newCount < oldCount) {
                // Faqat bo'sh (faol sessiyasiz) PC'larni o'chirish
                const pcsToRemove = await Computer.findAll({
                    where: { RoomId: room.id },
                    order: [['id', 'DESC']],
                    limit: oldCount - newCount
                });
                for (const pc of pcsToRemove) {
                    // Aktiv sessiya borligini tekshirish
                    const activeSess = await Session.findOne({
                        where: { ComputerId: pc.id, status: { [Op.in]: ['active', 'paused'] } }
                    });
                    if (!activeSess) {
                        await pc.destroy();
                    }
                }
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
    const t = await sequelize.transaction();
    try {
        const room = await Room.findOne({ where: { id, ClubId: clubId }, transaction: t });
        if (!room) {
            await t.rollback();
            return res.status(404).json({ error: 'Not found' });
        }

        // Avval bog'liq sessiyalarni tugatish
        const pcIds = (await Computer.findAll({
            where: { RoomId: room.id },
            attributes: ['id'],
            transaction: t
        })).map(p => p.id);

        if (pcIds.length > 0) {
            await Session.update(
                { status: 'completed', endTime: new Date() },
                { where: { ComputerId: { [Op.in]: pcIds }, status: { [Op.in]: ['active', 'paused'] } }, transaction: t }
            );
        }

        await Computer.destroy({ where: { RoomId: room.id }, transaction: t });
        await room.destroy({ transaction: t });

        await t.commit();
        res.json({ success: true });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};
