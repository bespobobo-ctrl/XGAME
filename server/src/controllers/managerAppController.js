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

        const allRooms = await Room.findAll({ where: { ClubId: clubId } });
        const allRoomIds = allRooms.map(r => r.id);

        const [allTransactions, allSessions, allComputers, club] = await Promise.all([
            Transaction.findAll({ where: { ClubId: clubId, createdAt: { [Op.gte]: dStart } } }),
            Session.findAll({
                where: {
                    ClubId: clubId, [Op.or]: [
                        { startTime: { [Op.gte]: dStart } },
                        { status: { [Op.in]: ['active', 'paused', 'reserved'] } }
                    ]
                },
                include: [{ model: Computer, include: [Room] }, { model: User }]
            }),
            Computer.findAll({ where: { RoomId: { [Op.in]: allRoomIds } } }),
            Club.findByPk(clubId)
        ]);

        // 📅 RESERVATIONS & NOTIFICATIONS
        const upcomingReservations = [];
        const lowBalanceAlerts = [];

        allSessions.forEach(s => {
            // BUGUNGI BARCHA BRONLAR
            if (s.status === 'reserved' || s.reserveTime) {
                const rTime = s.reserveTime ? new Date(s.reserveTime) : null;
                const diffMin = rTime ? (rTime - now) / 60000 : null;

                upcomingReservations.push({
                    id: s.id,
                    pc: s.Computer?.name,
                    user: s.User?.username || s.guestName || 'Mehmon',
                    time: s.reserveTime,
                    isUrgent: diffMin !== null && diffMin <= 10 && diffMin > 0
                });
            }

            // Low Balance Logic (10,000 UZS)
            if (s.status === 'active' && s.User) {
                const pph = s.Computer?.Room?.pricePerHour || 15000;
                const elapsedH = (now - new Date(s.startTime)) / 3600000;
                const cost = Math.round(elapsedH * pph);
                const remainingBalance = (s.User.balance || 0) - cost;

                if (remainingBalance < 10000 && remainingBalance > 0) {
                    lowBalanceAlerts.push({
                        pc: s.Computer?.name,
                        user: s.User.username,
                        balance: remainingBalance
                    });
                }
            }
        });

        // 💰 REVENUE BREAKDOWN
        let cashTopups = 0;
        let adminPcRevenue = 0;
        let userPcRevenue = 0;

        allTransactions.forEach(t => {
            if (t.type === 'deposit') cashTopups += t.amount;
            if (t.type === 'pc_payment') {
                if (t.UserId) userPcRevenue += t.amount;
                else adminPcRevenue += t.amount;
            }
        });

        const busyPCs = allComputers.filter(c => c.status === 'busy' || c.status === 'paused').length;
        const freePCs = allComputers.filter(c => c.status === 'free' || c.status === 'available').length;
        const reservedPCs = allComputers.filter(c => c.status === 'reserved').length;

        res.json({
            clubName: club?.name || 'GAME CLUB',
            totalPCs: allComputers.length, busyPCs, freePCs, reservedPCs,
            upcomingReservations: upcomingReservations.sort((a, b) => (a.time ? new Date(a.time) : 0) - (b.time ? new Date(b.time) : 0)),
            lowBalanceAlerts,
            revenue: {
                day: adminPcRevenue + userPcRevenue,
                cashTopups,
                adminPcRevenue,
                userPcRevenue
            },
            roomStats: allRooms.map(r => {
                const rSessions = allSessions.filter(s => s.Computer?.RoomId === r.id);
                let adminRev = 0, userRev = 0, mins = 0;
                rSessions.forEach(rs => {
                    const dur = rs.status === 'completed' ? (rs.totalMinutes || 0) : ((now - new Date(rs.startTime)) / 60000);
                    mins += dur;
                    const cost = rs.status === 'completed' ? (rs.totalCost || 0) : Math.round((dur / 60) * r.pricePerHour);
                    if (rs.UserId) userRev += cost; else adminRev += cost;
                });
                return {
                    id: r.id, name: r.name, pcCount: r.pcCount,
                    totalHours: Math.round(mins / 60),
                    totalRevenue: adminRev + userRev,
                    adminRevenue: adminRev, userRevenue: userRev
                };
            })
        });
    } catch (err) {
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
                    required: false,
                    where: {
                        status: { [Op.in]: ['active', 'paused', 'reserved'] }
                    },
                    include: [{
                        model: User,
                        as: 'User',
                        attributes: ['id', 'username', 'phone']
                    }]
                }]
            }],
            order: [
                ['id', 'ASC'],
                [Computer, 'name', 'ASC']
            ]
        });
        res.json(rooms);
    } catch (err) {
        next(err);
    }
};

exports.addRoom = async (req, res, next) => {
    try {
        const clubId = req.user.ClubId;
        const { name, pricePerHour, pcCount, specs } = req.body;

        if (!name || !pricePerHour || !pcCount) {
            return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
        }

        const count = parseInt(pcCount);
        const room = await Room.create({
            name,
            pricePerHour: parseInt(pricePerHour),
            pcCount: count,
            ClubId: clubId
        });

        // Avtomatik PC larni yaratish (Auto-create PCs)
        const pcsToCreate = [];
        for (let i = 1; i <= count; i++) {
            pcsToCreate.push({
                name: `${i}-${name.substring(0, 5).toUpperCase().trim()}`,
                status: 'free',
                specs: specs || "Xarakteristikasi kiritilmagan",
                RoomId: room.id,
                ClubId: clubId
            });
        }

        if (pcsToCreate.length > 0) {
            await Computer.bulkCreate(pcsToCreate);
        }

        res.json({ success: true, room });
    } catch (err) {
        console.error("ADD ROOM ERROR:", err);
        res.status(500).json({ error: "Xona yaratishda xatolik!" });
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
            // Global (for all managers)
            io.emit('pc-status-updated', { pcId: pc.id, clubId: pc.ClubId, status: pc.status });
            io.emit('stats-updated', { clubId: pc.ClubId });

            // Specific PC Room (for the Agent/PC itself)
            const session = await Session.findOne({
                where: { ComputerId: pc.id, status: { [Op.in]: ['active', 'paused'] } },
                order: [['createdAt', 'DESC']]
            });

            io.to(pc.name).emit('pc-action', {
                action: action,
                status: pc.status,
                session: session ? {
                    startTime: session.startTime,
                    expectedMinutes: session.expectedMinutes,
                    totalMinutes: session.totalMinutes
                } : null
            });

            // Compatibility for older agents
            if (action === 'start' || action === 'resume') {
                io.to(pc.name).emit('unlock', { startTime: session?.startTime });
            } else if (action === 'stop' || action === 'free' || action === 'lock') {
                io.to(pc.name).emit('lock');
            }
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

// ═══════════════════════════════════════════════
// 💳 TOP-UP MANAGEMENT (Manual Billing)
// ═══════════════════════════════════════════════

exports.updateClubCard = async (req, res, next) => {
    try {
        const { cardNumber, cardOwner } = req.body;
        const club = await Club.findByPk(req.user.ClubId);
        if (!club) return res.status(404).json({ error: 'Klub topilmadi' });

        club.cardNumber = cardNumber;
        club.cardOwner = cardOwner;
        await club.save();

        res.json({ success: true, message: 'Karta ma\'lumotlari yangilandi' });
    } catch (error) {
        next(error);
    }
};

exports.getTopUpRequests = async (req, res, next) => {
    try {
        const requests = await Transaction.findAll({
            where: { ClubId: req.user.ClubId, status: 'pending' },
            include: [{ model: User, attributes: ['id', 'username', 'telegramId'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        next(error);
    }
};

exports.updateTopUpStatus = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { action, amount } = req.body;

        const trans = await Transaction.findOne({
            where: { id, ClubId: req.user.ClubId, status: 'pending' }
        });

        if (!trans) {
            await t.rollback();
            return res.status(404).json({ error: 'Topilmadi' });
        }

        if (action === 'approve') {
            const finalAmount = amount || trans.amount;
            const user = await User.findByPk(trans.UserId, { transaction: t, lock: true });
            if (user) {
                user.balance = (user.balance || 0) + parseInt(finalAmount);
                await user.save({ transaction: t });
            }
            trans.status = 'approved';
            trans.amount = finalAmount;

            if (user && user.telegramId) {
                const bot = require('../utils/bot');
                bot.broadcastMessage([user.telegramId], `✅ <b>HISOB TO'LDIRILDI!</b>\n\nBalansingizga <b>${parseInt(finalAmount).toLocaleString()} UZS</b> qo'shildi.`).catch(() => { });
            }
        } else {
            trans.status = 'rejected';
        }

        await trans.save({ transaction: t });
        await t.commit();
        res.json({ success: true, message: 'Bajarildi' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};
// ═══════════════════════════════════════════════
// 👤 USERS MANAGEMENT
// ═══════════════════════════════════════════════

exports.getUsers = async (req, res, next) => {
    try {
        const { q } = req.query;
        const clubId = req.user.ClubId;
        const where = {
            ClubId: clubId,
            role: 'customer'
        };
        if (q) {
            where[Op.or] = [
                { id: { [Op.like]: `%${q}%` } },
                { username: { [Op.like]: `%${q}%` } },
                { phone: { [Op.like]: `%${q}%` } }
            ];
        }
        const users = await User.findAll({
            where,
            attributes: ['id', 'username', 'phone', 'balance', 'status'],
            limit: 50,
            order: [['id', 'DESC']]
        });
        res.json(users);
    } catch (err) {
        next(err);
    }
};

exports.addUserBalance = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { amount, type, description } = req.body;
        const clubId = req.user.ClubId;

        const user = await User.findOne({ where: { id, ClubId: clubId }, transaction: t, lock: true });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        user.balance = (user.balance || 0) + parseInt(amount);
        await user.save({ transaction: t });

        await Transaction.create({
            amount: parseInt(amount),
            type: type || 'deposit',
            status: 'approved',
            ClubId: clubId,
            UserId: user.id,
            description: description || 'Balans qo\'shildi (Administrator)'
        }, { transaction: t });

        await t.commit();

        // 📣 Bildirishnoma yuborish
        if (user.telegramId) {
            const bot = require('../utils/bot');
            bot.broadcastMessage([user.telegramId], `✅ <b>HISOB TO'LDIRILDI!</b>\n\nBalansingizga <b>${parseInt(amount).toLocaleString()} UZS</b> qo'shildi.`).catch(() => { });
        }

        res.json({ success: true, balance: user.balance });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};
