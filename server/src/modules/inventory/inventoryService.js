const { Room, Computer, Session } = require('../../database');
const { PC_STATUS } = require('../../shared/constants/statuses');

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
                    required: false
                }]
            }],
            order: [['id', 'ASC']]
        });

        // Revenue calculation for each room (today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        for (let room of rooms) {
            const revenue = await Session.sum('totalCost', {
                where: {
                    RoomId: room.id,
                    status: 'completed',
                    updatedAt: { [require('sequelize').Op.gte]: startOfDay }
                }
            });
            room.setDataValue('todayRevenue', revenue || 0);
        }

        return rooms;
    }
}

module.exports = new InventoryService();
