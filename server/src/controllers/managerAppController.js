const inventoryService = require('../modules/inventory/inventoryService');
const sessionService = require('../modules/session/sessionService');
const financeService = require('../modules/finance/financeService');
const { ROLES } = require('../shared/constants/statuses');

class ManagerAppController {
    /**
     * Get rooms and computers for the manager dashboard
     */
    async getRooms(req, res) {
        try {
            const clubId = req.user?.ClubId || 1; // Fallback to 1 for MVP
            const rooms = await inventoryService.getRoomsWithComputers(clubId);
            res.json(rooms);
        } catch (error) {
            console.error("Inventory error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Handle single PC actions (Start/Stop/Pause/Resume/Reserve)
     */
    async pcAction(req, res) {
        try {
            const pcId = req.params.id;
            const clubId = req.user?.ClubId || 1;
            const actionData = req.body;

            const result = await sessionService.executeAction(pcId, clubId, actionData);
            res.json(result);
        } catch (error) {
            console.error("Session Action Error:", error);
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Centralized statistics for manager panel
     */
    async getStats(req, res) {
        try {
            const clubId = req.user?.ClubId || 1;
            const stats = await financeService.getClubStats(clubId);
            res.json(stats);
        } catch (error) {
            console.error("Stats error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ManagerAppController();
