const inventoryService = require('../modules/panelB/inventoryService');
const sessionService = require('../modules/panelC/sessionService');
const financeService = require('../modules/panelA/financeService');
const { ROLES } = require('../shared/constants/statuses');

class ManagerAppController {
    /**
     * Get rooms and computers for the manager dashboard
     */
    async getRooms(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied: Missing Club Association." });
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
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied: Missing Club Association." });
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
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied: Missing Club Association." });
            const stats = await financeService.getClubStats(clubId);
            res.json(stats);
        } catch (error) {
            console.error("Stats error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ManagerAppController();
