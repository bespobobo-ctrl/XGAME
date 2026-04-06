const { User, Session, Computer, Room, Transaction, sequelize } = require('../../shared/database');
const { SESSION_STATUS, PC_STATUS } = require('../../shared/constants/statuses');
const { Op } = require('sequelize');

class SessionService {
    async executeAction(pcId, clubId, options) {
        let { action, amount, expectedMinutes: minutes, reserveTime, guestName, guestPhone, userId } = options;

        if (minutes && parseInt(minutes) > 1440 && !amount) {
            amount = minutes;
            minutes = null;
        }

        if (!pcId || !clubId) throw new Error("PC_ID and CLUB_ID are required.");

        const transaction = await sequelize.transaction();
        try {
            const pc = await Computer.findOne({
                where: { id: pcId, ClubId: clubId },
                include: [{ model: Room }]
            }, { transaction });

            if (!pc) throw new Error("Computer not found.");
            const roomPrice = pc.Room?.pricePerHour || 15000;

            switch (action) {
                case 'start': await this._handleStart(pc, roomPrice, amount, minutes, transaction); break;
                case 'stop': await this._handleStop(pc, transaction); break;
                case 'pause': await this._handlePause(pc, transaction); break;
                case 'resume': await this._handleResume(pc, transaction); break;
                case 'reserve': await this._handleReserve(pc, reserveTime, guestName, guestPhone, transaction, userId); break;
                case 'cancel_reserve': await this._handleCancelReserve(pc, transaction); break;
                default: throw new Error(`Invalid action: ${action}`);
            }

            await transaction.commit();
            return { success: true, action };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async _handleStart(pc, roomPrice, amount, minutes, transaction) {
        if (pc.status !== PC_STATUS.FREE && pc.status !== PC_STATUS.RESERVED) {
            throw new Error("PC is already busy!");
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

    async _handleStop(pc, transaction, origin, socketId) {
        console.trace('🛑 [DETEKTIV] _handleStop chaqirildi! Kim chaqirdi?');
        const activeSession = await Session.findOne({
            where: { ComputerId: pc.id, status: [SESSION_STATUS.ACTIVE, SESSION_STATUS.PAUSED] },
            transaction
        });

        if (activeSession) {
            const now = new Date();

            // 🛡️ ANTI-FLICKER GUARD: If session started < 5s ago, ignore stop request
            const ageSeconds = Math.floor((now - new Date(activeSession.startTime)) / 1000);
            if (ageSeconds < 5) {
                console.log(`⚠️ Ignored Rapid Stop Request for ${pc.name} (Age: ${ageSeconds}s)`);
                return;
            }

            console.log(`✅ Closing Session ID: ${activeSession.id}. Origin: ${origin || 'unknown'}, Socket: ${socketId || 'none'}`);
            let finalConsumedSeconds = activeSession.consumedSeconds || 0;

            if (activeSession.status === SESSION_STATUS.ACTIVE) {
                const lastStart = new Date(activeSession.lastResumeTime || activeSession.startTime);
                const currentInterval = Math.max(0, Math.floor((now - lastStart) / 1000));
                finalConsumedSeconds += currentInterval;
            }

            const roomPrice = pc.Room?.pricePerHour || 15000;
            let pcCost = Math.floor((finalConsumedSeconds / 3600) * roomPrice);

            const unpaidBarSales = await Transaction.findAll({
                where: { SessionId: activeSession.id, type: 'bar_sale', status: 'unpaid' },
                transaction
            });
            const barCost = unpaidBarSales.reduce((acc, t) => acc + t.amount, 0);

            let grandTotal = pcCost + barCost;
            const paidAlready = activeSession.prepaidAmount || 0;

            for (const tx of unpaidBarSales) {
                await tx.update({ status: 'approved' }, { transaction });
            }

            await activeSession.update({
                status: SESSION_STATUS.COMPLETED,
                endTime: now,
                consumedSeconds: finalConsumedSeconds,
                totalCost: grandTotal
            }, { transaction });

            let pcAmountToPay = Math.max(0, pcCost - paidAlready);
            if (pcAmountToPay > 0) {
                await Transaction.create({
                    amount: pcAmountToPay,
                    type: 'income',
                    description: `${pc.name} Session Final`,
                    ClubId: pc.ClubId,
                    SessionId: activeSession.id
                }, { transaction });
            }
        }
        await pc.update({ status: PC_STATUS.FREE }, { transaction });
    }

    async _handlePause(pc, transaction) {
        const session = await Session.findOne({ where: { ComputerId: pc.id, status: SESSION_STATUS.ACTIVE }, transaction });
        if (session) {
            const now = new Date();
            const lastStart = new Date(session.lastResumeTime || session.startTime);
            const interval = Math.max(0, Math.floor((now - lastStart) / 1000));
            await session.update({
                status: SESSION_STATUS.PAUSED,
                pausedAt: now,
                consumedSeconds: (session.consumedSeconds || 0) + interval
            }, { transaction });
            await pc.update({ status: PC_STATUS.PAUSED }, { transaction });
        }
    }

    async _handleResume(pc, transaction) {
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
        const nowInTashkent = new Date(new Date().getTime() + (5 * 3600000));
        const todayStr = nowInTashkent.toISOString().split('T')[0];
        const isoStr = `${todayStr}T${time}:00+05:00`;
        const reserveDate = new Date(isoStr);
        if (reserveDate <= new Date()) throw new Error("Time error");

        const session = await Session.create({
            ComputerId: pc.id, RoomId: pc.RoomId, ClubId: pc.ClubId,
            status: SESSION_STATUS.RESERVED, startTime: reserveDate,
            guestName: name, guestPhone: phone, UserId: userId
        }, { transaction });

        if (pc.status === PC_STATUS.FREE) await pc.update({ status: PC_STATUS.RESERVED }, { transaction });
    }

    async _handleCancelReserve(pc, transaction) {
        await Session.update({ status: 'cancelled' }, { where: { ComputerId: pc.id, status: SESSION_STATUS.RESERVED }, transaction });
        await pc.update({ status: PC_STATUS.FREE }, { transaction });
    }
}

module.exports = new SessionService();
