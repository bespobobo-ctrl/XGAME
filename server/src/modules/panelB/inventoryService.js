const { Room, Computer, Session, Transaction } = require('../../shared/database');
const { PC_STATUS } = require('../../shared/constants/statuses');
const { Op } = require('sequelize');

class InventoryService {
    /**
     * Get all rooms with computers and their active sessions for a specific club
     */
    async getRoomsWithComputers(clubId) {
        if (!clubId) throw new Error("Club ID is required for multi-tenant isolation.");

        const rooms = await Room.findAll({
            where: { ClubId: clubId },
            include: [{
                model: Computer,
                include: [{
                    model: Session,
                    where: {
                        status: ['active', 'paused', 'reserved']
                    },
                    required: false,
                    include: [{
                        model: Transaction,
                        where: { type: 'bar_sale', status: 'unpaid' },
                        required: false
                    }]
                }, {
                    model: Session,
                    as: 'UpcomingReservations',
                    where: {
                        status: 'reserved'
                    },
                    required: false
                }]
            }],
            order: [['id', 'ASC']]
        });

        // Optimized revenue calculation: One query to get all room revenues for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const roomRevenues = await Session.findAll({
            attributes: [
                'RoomId',
                [require('sequelize').fn('SUM', require('sequelize').col('totalCost')), 'totalRoomRevenue']
            ],
            where: {
                status: 'completed',
                updatedAt: { [Op.gte]: startOfDay }
            },
            group: ['RoomId'],
            raw: true
        });

        // Map revenues back to rooms
        const revMap = Object.fromEntries(roomRevenues.map(r => [r.RoomId, r.totalRoomRevenue || 0]));
        rooms.forEach(room => {
            room.setDataValue('todayRevenue', revMap[room.id] || 0);
        });

        return rooms;
    }
}

module.exports = new InventoryService();
