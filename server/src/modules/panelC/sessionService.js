const { Session, Computer, Room, Transaction, sequelize } = require('../../shared/database');
const { SESSION_STATUS, PC_STATUS } = require('../../shared/constants/statuses');
const { Op } = require('sequelize');

class SessionService {
    /**
     * Centralized PC Action Handler (Start/Stop/Pause/Resume/Reserve)
     */
    async executeAction(pcId, clubId, options) {
        const { action, expectedMinutes, reserveTime, guestName, guestPhone, userId } = options;
        if (!pcId || !clubId) throw new Error("PC_ID and CLUB_ID are required for tenant safety.");

        const transaction = await sequelize.transaction();
        try {
            const pc = await Computer.findOne({
                where: { id: pcId, ClubId: clubId },
                include: [{ model: Room }]
            }, { transaction });

            if (!pc) throw new Error("Computer not found or access denied.");
            const roomPrice = pc.Room?.pricePerHour || 15000;

            switch (action) {
                case 'start':
                    await this._handleStart(pc, roomPrice, expectedMinutes, transaction);
                    break;
                case 'stop':
                    await this._handleStop(pc, transaction);
                    break;
                case 'pause':
                    await this._handlePause(pc, transaction);
                    break;
                case 'resume':
                    await this._handleResume(pc, transaction);
                    break;
                case 'reserve':
                    await this._handleReserve(pc, reserveTime, guestName, guestPhone, transaction, userId);
                    break;
                default:
                    throw new Error(`Invalid action: ${action}`);
            }

            await transaction.commit();
            return { success: true, action };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // --- Private Handlers (Hidden Logic) ---

    async _handleStart(pc, roomPrice, expectedMinutes, transaction) {
        if (pc.status !== PC_STATUS.FREE && pc.status !== PC_STATUS.RESERVED) {
            throw new Error("Computer is already busy!");
        }

        // Cleanup any existing active sessions
        await Session.update({ status: SESSION_STATUS.COMPLETED }, {
            where: { ComputerId: pc.id, status: [SESSION_STATUS.ACTIVE, SESSION_STATUS.PAUSED] },
            transaction
        });

        await Session.create({
            ComputerId: pc.id,
            RoomId: pc.RoomId,
            ClubId: pc.ClubId,
            status: SESSION_STATUS.ACTIVE,
            startTime: new Date(),
            lastResumeTime: new Date(),
            consumedSeconds: 0,
            expectedMinutes
        }, { transaction });

        await pc.update({ status: PC_STATUS.BUSY }, { transaction });
    }

    async _handleStop(pc, transaction) {
        const activeSession = await Session.findOne({
            where: { ComputerId: pc.id, status: [SESSION_STATUS.ACTIVE, SESSION_STATUS.PAUSED] },
            transaction
        });

        if (activeSession) {
            const now = new Date();
            let finalConsumedSeconds = activeSession.consumedSeconds || 0;

            if (activeSession.status === SESSION_STATUS.ACTIVE) {
                const lastStart = new Date(activeSession.lastResumeTime || activeSession.startTime);
                const currentInterval = Math.max(0, Math.floor((now - lastStart) / 1000));
                finalConsumedSeconds += currentInterval;
            }

            const roomPrice = pc.Room?.pricePerHour || 15000;
            let totalCost = Math.floor((finalConsumedSeconds / 3600) * roomPrice);

            // Subtract any prepaid amount (deposit)
            const paidAlready = activeSession.prepaidAmount || 0;
            totalCost = Math.max(0, totalCost - paidAlready);

            await activeSession.update({
                status: SESSION_STATUS.COMPLETED,
                endTime: now,
                consumedSeconds: finalConsumedSeconds,
                totalCost: totalCost + paidAlready // Final actual total
            }, { transaction });

            // Create financial log for the REMAINING amount
            if (totalCost > 0) {
                await Transaction.create({
                    amount: totalCost,
                    type: 'income',
                    description: `${pc.name} Session (Final Balance)`,
                    ClubId: pc.ClubId,
                    SessionId: activeSession.id
                }, { transaction });
            }
        }

        await pc.update({ status: PC_STATUS.FREE }, { transaction });
    }

    async _handlePause(pc, transaction) {
        if (pc.status !== PC_STATUS.BUSY) throw new Error("PC is not active!");
        const activeSession = await Session.findOne({
            where: { ComputerId: pc.id, status: SESSION_STATUS.ACTIVE },
            transaction
        });

        if (activeSession) {
            const now = new Date();
            const lastStart = new Date(activeSession.lastResumeTime || activeSession.startTime);
            const currentInterval = Math.max(0, Math.floor((now - lastStart) / 1000));
            const newConsumed = (activeSession.consumedSeconds || 0) + currentInterval;

            await activeSession.update({
                status: SESSION_STATUS.PAUSED,
                pausedAt: now,
                consumedSeconds: newConsumed
            }, { transaction });
        }
        await pc.update({ status: PC_STATUS.PAUSED }, { transaction });
    }

    async _handleResume(pc, transaction) {
        if (pc.status !== PC_STATUS.PAUSED) throw new Error("PC is not paused!");
        await Session.update({
            status: SESSION_STATUS.ACTIVE,
            pausedAt: null,
            lastResumeTime: new Date()
        }, {
            where: { ComputerId: pc.id, status: SESSION_STATUS.PAUSED },
            transaction
        });
        await pc.update({ status: PC_STATUS.BUSY }, { transaction });
    }

    async _handleReserve(pc, time, name, phone, transaction, userId = null) {
        // 🇺🇿 TOSHKENT VAQTI (GMT+5) QAT'IY HISOB-KITOB
        const nowInTashkent = new Date(new Date().getTime() + (5 * 3600000));
        const todayStr = nowInTashkent.toISOString().split('T')[0];

        // Explicitly set offset as +05:00
        const isoStr = `${todayStr}T${time}:00+05:00`;
        const reserveDate = new Date(isoStr);

        const now = new Date(); // Actual global NOW
        if (reserveDate <= now) throw new Error("O'tgan vaqtga bron qilib bo'lmaydi!");

        const roomPrice = pc.Room?.pricePerHour || 15000;
        const depositAmount = roomPrice; // 1 soatlik depozit
        const minRequired = roomPrice * 2; // Kamida 2 soatlik puli bo'lishi shart

        // Check user balance if userId is provided
        if (userId) {
            const user = await User.findByPk(userId, { transaction, lock: true });
            if (!user) throw new Error("Foydalanuvchi topilmadi!");
            if (user.balance < minRequired) throw new Error(`Balans yetarli emas! Kamida ${minRequired.toLocaleString()} UZS bo'lishi shart.`);

            user.balance -= depositAmount;
            await user.save({ transaction, hooks: false });

            // Create deposit transaction
            await Transaction.create({
                amount: depositAmount,
                type: 'income',
                description: `BRON DEPOZIT (PC: ${pc.name})`,
                ClubId: pc.ClubId,
                UserId: user.id,
                status: 'approved'
            }, { transaction });
        }

        // Check for overlaps
        const existingRes = await Session.findOne({
            where: {
                ComputerId: pc.id,
                status: SESSION_STATUS.RESERVED,
                startTime: reserveDate
            },
            transaction
        });

        if (existingRes) throw new Error("Bu vaqtda allaqachon bron bor!");

        await Session.create({
            ComputerId: pc.id,
            RoomId: pc.RoomId,
            ClubId: pc.ClubId,
            status: SESSION_STATUS.RESERVED,
            startTime: reserveDate,
            guestName: name,
            guestPhone: phone,
            UserId: userId,
            prepaidAmount: depositAmount, // Track for later deduction
            totalCost: depositAmount // For stats
        }, { transaction });

        if (pc.status === PC_STATUS.FREE) {
            await pc.update({ status: PC_STATUS.RESERVED }, { transaction });
        }
    }
}

module.exports = new SessionService();
