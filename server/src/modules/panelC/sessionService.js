const { User, Session, Computer, Room, Transaction, sequelize } = require('../../shared/database');
const { SESSION_STATUS, PC_STATUS } = require('../../shared/constants/statuses');
const { Op } = require('sequelize');

class SessionService {
    /**
     * Centralized PC Action Handler (Start/Stop/Pause/Resume/Reserve)
     */
    async executeAction(pcId, clubId, options) {
        let { action, amount, expectedMinutes: minutes, reserveTime, guestName, guestPhone, userId } = options;

        // 🛡️ HEURISTIC SAFETY: If old/cached frontend sends a huge value (money) in minutes field
        // 1440 mins = 24 hours. Anything more than that is definitely an amount (UZS).
        if (minutes && parseInt(minutes) > 1440 && !amount) {
            amount = minutes;
            minutes = null;
        }

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
                    await this._handleStart(pc, roomPrice, amount, minutes, transaction);
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
                case 'cancel_reserve':
                    await this._handleCancelReserve(pc, transaction);
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

    async _handleCancelReserve(pc, transaction) {
        const session = await Session.findOne({
            where: { ComputerId: pc.id, status: SESSION_STATUS.RESERVED },
            transaction
        });

        if (session) {
            await session.update({ status: 'cancelled', penaltyApplied: true }, { transaction });

            // Log as specific penalty transaction if deposit exists
            if (session.prepaidAmount > 0) {
                // Find existing deposit and convert it to penalty
                const existingTx = await Transaction.findOne({ where: { SessionId: session.id, type: 'income' }, transaction });
                if (existingTx) {
                    await existingTx.update({
                        type: 'penalty',
                        description: `Shtraf: Bron qilingan vaqtda kelmadi (PC: ${pc.name})`
                    }, { transaction });
                }
            }
        }
        await pc.update({ status: PC_STATUS.FREE }, { transaction });
    }

    async _handleStart(pc, roomPrice, amount, minutes, transaction) {
        if (pc.status !== PC_STATUS.FREE && pc.status !== PC_STATUS.RESERVED) {
            throw new Error("Computer is already busy!");
        }

        let expectedMinutes = null;
        let totalCost = 0;

        if (minutes) {
            expectedMinutes = parseInt(minutes);
            totalCost = Math.ceil((expectedMinutes / 60) * roomPrice);
        } else if (amount) {
            totalCost = parseInt(amount);
            expectedMinutes = Math.floor((totalCost / roomPrice) * 60);
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
            expectedMinutes,
            totalCost
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
            let pcCost = Math.floor((finalConsumedSeconds / 3600) * roomPrice);

            // 1. Calculate Unpaid Bar Sales connected to this session
            const unpaidBarSales = await Transaction.findAll({
                where: { SessionId: activeSession.id, type: 'bar_sale', status: 'unpaid' },
                transaction
            });
            const barCost = unpaidBarSales.reduce((acc, t) => acc + t.amount, 0);

            // 2. Grand Total and Remaining
            let grandTotal = pcCost + barCost;
            const paidAlready = activeSession.prepaidAmount || 0;
            let amountToPay = Math.max(0, grandTotal - paidAlready);

            // 3. Mark bar sales as approved so they enter finance stats
            for (const tx of unpaidBarSales) {
                await tx.update({ status: 'approved' }, { transaction });
            }

            await activeSession.update({
                status: SESSION_STATUS.COMPLETED,
                endTime: now,
                consumedSeconds: finalConsumedSeconds,
                totalCost: grandTotal
            }, { transaction });

            // 4. Create income log ONLY for the PC time deficit (to avoiding double counting bar)
            // If they owe money, we check how much is for PC.
            // If grandTotal = 14k (8k pc + 6k bar), paid = 0 -> amountToPay = 14k.
            // But we already marked 6k as 'bar_sale' approved! So we only need 8k as 'income'!
            let pcAmountToPay = Math.max(0, pcCost - paidAlready);

            if (pcAmountToPay > 0) {
                await Transaction.create({
                    amount: pcAmountToPay,
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

        const now = new Date();
        if (reserveDate <= now) throw new Error("O'tgan vaqtga bron qilib bo'lmaydi!");

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

        const roomPrice = pc.Room?.pricePerHour || 15000;
        const depositAmount = roomPrice;
        const minRequired = roomPrice * 2;

        if (userId) {
            const user = await User.findByPk(userId, { transaction, lock: true });
            if (!user) throw new Error("Foydalanuvchi topilmadi!");
            if (user.balance < minRequired) throw new Error(`Balans yetarli emas! Kamida ${minRequired.toLocaleString()} UZS bo'lishi shart.`);

            user.balance -= depositAmount;
            await user.save({ transaction, hooks: false });
        }

        const session = await Session.create({
            ComputerId: pc.id,
            RoomId: pc.RoomId,
            ClubId: pc.ClubId,
            status: SESSION_STATUS.RESERVED,
            startTime: reserveDate,
            guestName: name,
            guestPhone: phone,
            UserId: userId,
            prepaidAmount: depositAmount,
            totalCost: depositAmount
        }, { transaction });

        if (userId) {
            await Transaction.create({
                amount: depositAmount,
                type: 'income',
                description: `BRON DEPOZIT (PC: ${pc.name})`,
                ClubId: pc.ClubId,
                UserId: userId,
                SessionId: session.id,
                status: 'approved'
            }, { transaction });
        }

        if (pc.status === PC_STATUS.FREE) {
            await pc.update({ status: PC_STATUS.RESERVED }, { transaction });
        }
    }
}

module.exports = new SessionService();
