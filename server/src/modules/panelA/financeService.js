const { Session, Transaction, Club, User, Computer, Room } = require('../../shared/database');
const { Op } = require('sequelize');

class FinanceService {
    /**
     * Get real-time stats for a specific club
     */
    async getClubStats(clubId) {
        if (!clubId) throw new Error("Club ID is required for financial isolation.");

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Calculate Daily Revenue (Completed PC sessions)
        const dayRevenue = await Session.sum('totalCost', {
            where: {
                ClubId: clubId,
                status: 'completed',
                updatedAt: { [Op.between]: [startOfDay, endOfDay] }
            }
        }) || 0;

        // 2. Identify Revenue Channels (Cash vs Portal)
        const cashPcRevenue = await Session.sum('totalCost', {
            where: {
                ClubId: clubId,
                status: 'completed',
                updatedAt: { [Op.between]: [startOfDay, endOfDay] },
                UserId: { [Op.is]: null } // Paid at counter (Cash/Physical)
            }
        }) || 0;

        const userPcRevenue = await Session.sum('totalCost', {
            where: {
                ClubId: clubId,
                status: 'completed',
                updatedAt: { [Op.between]: [startOfDay, endOfDay] },
                UserId: { [Op.not]: null } // Paid via User account (Portal)
            }
        }) || 0;

        // 3. Current Active Usage (Calculated based on room prices)
        const activeSessions = await Session.findAll({
            where: { ClubId: clubId, status: ['active', 'paused'] },
            include: [{ model: Room }]
        });

        const activeRevenue = activeSessions.reduce((acc, s) => {
            const now = new Date();
            const start = new Date(s.startTime);
            const diffHours = Math.max(0, (now - start) / 3600000);
            return acc + (diffHours * (s.Room?.pricePerHour || 15000));
        }, 0);

        // 4. Penalty Profit (Forfeited deposits from late cancellations)
        const penaltyProfit = await Session.sum('prepaidAmount', {
            where: {
                ClubId: clubId,
                status: 'cancelled',
                updatedAt: { [Op.between]: [startOfDay, endOfDay] }
            }
        }) || 0;

        // 5. Club Information
        const club = await Club.findByPk(clubId);

        return {
            clubId: clubId,
            clubName: club?.name || 'Unknown Club',
            revenue: {
                day: Math.round(dayRevenue + activeRevenue + penaltyProfit),
                cashPcRevenue: Math.round(cashPcRevenue),
                userPcRevenue: Math.round(userPcRevenue),
                penaltyProfit: Math.round(penaltyProfit)
            },
            counts: {
                activeSessions: activeSessions.length
            }
        };
    }
}

module.exports = new FinanceService();
