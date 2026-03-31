const { User, Computer, Session, Room, Transaction } = require('../database/index');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * ⏰ BILLING SERVICE
 * Har daqiqa faol seanslarni tekshiradi va foydalanuvchi balansini nazorat qiladi.
 */
async function runBillingCycle(io) {
    try {
        const activeSessions = await Session.findAll({
            where: { status: 'active' },
            include: [
                User,
                { model: Computer, include: [Room] }
            ]
        });

        // 1. ACTIVE SESSIONS PROCESSING
        for (const session of activeSessions) {
            const t = await sequelize.transaction();
            try {
                const { User: user, Computer: computer } = session;
                if (!computer) { await t.rollback(); continue; }

                const room = computer.Room;
                const pricePerHour = room ? room.pricePerHour : 20000;
                const pricePerMinute = Math.ceil(pricePerHour / 60);

                session.totalMinutes += 1;
                session.totalCost += pricePerMinute;

                let isLimitReached = false;
                if (session.expectedMinutes && session.totalMinutes >= session.expectedMinutes) {
                    isLimitReached = true;
                }

                if (user && user.balance !== undefined) {
                    const freshUser = await User.findByPk(user.id, { transaction: t, lock: true });
                    if (freshUser) {
                        freshUser.balance = Math.max(0, freshUser.balance - pricePerMinute);
                        if (freshUser.balance <= 0) isLimitReached = true;

                        // 🔔 LOW BALANCE ( < 5000 )
                        if (freshUser.balance > 0 && freshUser.balance < 5000) {
                            const { broadcastMessage } = require('../utils/bot');
                            if (freshUser.telegramId) {
                                const lastAlertKey = `alert_${freshUser.id}`;
                                const now = Date.now();
                                if (!global[lastAlertKey] || now - global[lastAlertKey] > 10 * 60000) {
                                    broadcastMessage([freshUser.telegramId], `⚠️ <b>BALANS KAM!</b>\n\nHisobingizda <b>${Math.floor(freshUser.balance)} UZS</b> qoldi.🔌`).catch(() => { });
                                    global[lastAlertKey] = now;
                                }
                            }
                        }
                        await freshUser.save({ transaction: t });
                    }
                }

                if (isLimitReached) {
                    session.status = 'completed';
                    session.endTime = new Date();
                    if (computer) computer.status = 'free';
                    if (io) {
                        io.to(computer.name).emit('lock');
                        io.emit('pc-status-updated', { pcId: computer.id, clubId: computer.ClubId, status: 'free' });
                    }
                } else if (io) {
                    io.emit('pc-status-updated', { pcId: computer.id, clubId: computer.ClubId, status: computer.status, totalMinutes: session.totalMinutes });
                }

                await session.save({ transaction: t });
                if (computer) await computer.save({ transaction: t });
                await t.commit();
            } catch (err) {
                if (t) await t.rollback();
                logger.error(`❌ Session billing error (ID:${session.id}):`, err);
            }
        }

        // 2. 🧪 BRONLARNI TEKSHIRISH & JARIMA (Automated)
        await checkReservations(io);

    } catch (err) {
        logger.error('❌ Global Billing Error:', err);
    }
}

/**
 * 📅 RESERVATION MONITORING (ALERTS & PENALTIES)
 */
async function checkReservations(io) {
    const { broadcastMessage } = require('../utils/bot');
    const now = new Date();

    // 🔔 10 MINUTE ALERT
    const tenMinsLater = new Date(now.getTime() + 11 * 60000);
    const alerts10 = await Session.findAll({
        where: { status: 'reserved', reserveTime: { [Op.between]: [now, tenMinsLater] }, notifiedAt: null },
        include: [{ model: Computer }, { model: User }]
    });
    for (const res of alerts10) {
        await sendReservationAlert(res, io, '10 MINUT QOLDI ⚠️');
    }

    // ❗️ 5 MINUTE URGENT ALERT
    const fiveMinsLater = new Date(now.getTime() + 6 * 60000);
    const alerts5 = await Session.findAll({
        where: { status: 'reserved', reserveTime: { [Op.between]: [now, fiveMinsLater] }, notifiedAt: { [Op.ne]: null } },
        include: [{ model: Computer }, { model: User }]
    });
    for (const res of alerts5) {
        const lastUrgent = `urgent_${res.id}`;
        if (!global[lastUrgent]) {
            await sendReservationAlert(res, io, '❗️ SHOSHILINCH: 5 MINUT QOLDI!');
            global[lastUrgent] = true;
        }
    }

    // ⚠️ EXPIRED RESERVATIONS (10 MINS PAST -> PENALTY & FREE)
    const tenMinsAgo = new Date(now.getTime() - 11 * 60000);
    const expired = await Session.findAll({
        where: { status: 'reserved', reserveTime: { [Op.lt]: tenMinsAgo }, penaltyApplied: false },
        include: [Computer, User]
    });

    for (const sess of expired) {
        const t = await sequelize.transaction();
        try {
            const pc = sess.Computer;
            const user = sess.User;
            const penaltyAmount = 5000;
            let penaltySuccess = false;

            if (user && user.balance >= penaltyAmount) {
                const freshUser = await User.findByPk(user.id, { transaction: t, lock: true });
                if (freshUser && freshUser.balance >= penaltyAmount) {
                    freshUser.balance -= penaltyAmount;
                    await freshUser.save({ transaction: t });
                    await Transaction.create({
                        UserId: freshUser.id, ClubId: sess.ClubId,
                        amount: -penaltyAmount, type: 'penalty',
                        description: `BRON KECHIKISH (PC: ${pc?.name || 'PC'})`,
                        status: 'approved'
                    }, { transaction: t });
                    penaltySuccess = true;
                }
            }

            // PC va Sessionni tozalash
            sess.status = 'completed';
            sess.endTime = now;
            sess.penaltyApplied = true;
            await sess.save({ transaction: t });

            if (pc) {
                pc.status = 'free';
                await pc.save({ transaction: t });
            }

            await t.commit();

            // Notify Manager
            const managers = await User.findAll({ where: { ClubId: sess.ClubId, role: 'manager' } });
            const managerTgIds = managers.map(m => m.telegramId).filter(id => id && !id.startsWith('MANAGER_'));
            const msg = `🔴 <b>BRON BEKOR QILINDI (JARIMA! 💸)</b>\n\n🖥 <b>PC:</b> ${pc?.name || 'PC'}\n👤 <b>Mijoz:</b> ${user?.username || sess.guestName || 'Mijoz'}\n💰 <b>Status:</b> ${penaltySuccess ? '5,000 UZS еchildi' : 'Balans yetarli emas'}`;
            if (managerTgIds.length > 0) broadcastMessage(managerTgIds, msg).catch(() => { });
            if (io) io.emit('pc-status-updated', { pcId: pc?.id, clubId: sess.ClubId, status: 'free' });

        } catch (err) {
            if (t) await t.rollback();
            logger.error(`❌ Penalty processing error:`, err);
        }
    }
}

async function sendReservationAlert(res, io, title) {
    const { broadcastMessage } = require('../utils/bot');
    const pcName = res.Computer?.name || 'PC';
    const guestName = res.User?.username || res.guestName || 'Mijoz';
    const rTime = new Date(res.reserveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const managers = await User.findAll({ where: { ClubId: res.ClubId, role: 'manager' } });
    const managerTgIds = managers.map(m => m.telegramId).filter(id => id && !id.startsWith('MANAGER_'));

    const msg = `📅 <b>${title}</b>\n\n🖥 <b>PC:</b> ${pcName}\n👤 <b>Mijoz:</b> ${guestName}\n⏰ <b>Vaqt:</b> ${rTime}`;

    if (managerTgIds.length > 0) await broadcastMessage(managerTgIds, msg).catch(() => { });
    if (io) io.emit('upcoming-alert', { pcName, guestName, rTime });

    res.notifiedAt = new Date();
    await res.save();
}

function startBillingService(io) {
    setInterval(() => runBillingCycle(io), 60000);
    console.log('⏰ Professional Billing Service (Fixed): ACTIVE');
}

module.exports = { startBillingService };
