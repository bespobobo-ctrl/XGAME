const { Session, Computer, Room, Transaction, sequelize } = require('../../database/models');
const { SESSION_STATUS, PC_STATUS } = require('../../shared/constants/statuses');
const { Op } = require('sequelize');

class SessionService {
    /**
     * Centralized PC Action Handler (Start/Stop/Pause/Resume/Reserve)
     */
    async executeAction(pcId, clubId, options) {
        const { action, expectedMinutes, reserveTime, guestName, guestPhone } = options;
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
                    await this._handleReserve(pc, reserveTime, guestName, guestPhone, transaction);
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
            const start = new Date(activeSession.startTime);
            const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
            const roomPrice = pc.Room?.pricePerHour || 15000;
            const totalPrice = Math.floor((diffSeconds / 3600) * roomPrice);

            await activeSession.update({
                status: SESSION_STATUS.COMPLETED,
                endTime: now,
                totalPrice
            }, { transaction });

            // Create financial log
            if (totalPrice > 0) {
                await Transaction.create({
                    amount: totalPrice,
                    type: 'income',
                    description: `${pc.name} Session (Stop)`,
                    ClubId: pc.ClubId,
                    SessionId: activeSession.id
                }, { transaction });
            }
        }

        await pc.update({ status: PC_STATUS.FREE }, { transaction });
    }

    async _handlePause(pc, transaction) {
        if (pc.status !== PC_STATUS.BUSY) throw new Error("PC is not active!");
        await Session.update({ status: SESSION_STATUS.PAUSED, pausedAt: new Date() }, {
            where: { ComputerId: pc.id, status: SESSION_STATUS.ACTIVE },
            transaction
        });
        await pc.update({ status: PC_STATUS.PAUSED }, { transaction });
    }

    async _handleResume(pc, transaction) {
        if (pc.status !== PC_STATUS.PAUSED) throw new Error("PC is not paused!");
        await Session.update({ status: SESSION_STATUS.ACTIVE, pausedAt: null }, {
            where: { ComputerId: pc.id, status: SESSION_STATUS.PAUSED },
            transaction
        });
        await pc.update({ status: PC_STATUS.BUSY }, { transaction });
    }

    async _handleReserve(pc, time, name, phone, transaction) {
        if (pc.status !== PC_STATUS.FREE) throw new Error("PC is not free for reservation!");

        await Session.create({
            ComputerId: pc.id,
            RoomId: pc.RoomId,
            ClubId: pc.ClubId,
            status: SESSION_STATUS.RESERVED,
            startTime: new Date(`${new Date().toISOString().split('T')[0]}T${time}:00`),
            guestName: name,
            guestPhone: phone
        }, { transaction });

        await pc.update({ status: PC_STATUS.RESERVED }, { transaction });
    }
}

module.exports = new SessionService();
