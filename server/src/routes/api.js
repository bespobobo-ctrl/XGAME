const express = require('express');
const router = express.Router();

// 🛡️ MIDDLEWARES
const { auth, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');

// 🎮 CONTROLLERS
const authCtrl = require('../controllers/authController');
const clubCtrl = require('../controllers/clubController');
const managerCtrl = require('../controllers/managerController');
const broadcastCtrl = require('../controllers/broadcastController');
const statsCtrl = require('../controllers/statsController');

/**
 * 🏁 PUBLIC ROUTES
 */
router.get('/health', (req, res) => res.status(200).send('API Healthy'));
router.post('/login', asyncHandler(authCtrl.login));
router.post('/register', asyncHandler(authCtrl.registerPlayer));
router.post('/telegram-auth', asyncHandler(authCtrl.telegramAuth));

/**
 * 🏛️ CLUB ROUTES (Admin Protected)
 */
router.get('/clubs', asyncHandler(clubCtrl.getAllClubs));
router.get('/admin/clubs', auth, authorize('super_admin'), asyncHandler(clubCtrl.getAllClubs));
router.post('/admin/clubs', auth, authorize('super_admin'), upload.single('image'), asyncHandler(clubCtrl.createClub));
router.put('/admin/clubs/:id', auth, authorize('super_admin'), upload.single('image'), asyncHandler(clubCtrl.updateClub));
router.delete('/admin/clubs/:id', auth, authorize('super_admin'), asyncHandler(clubCtrl.deleteClub));
router.patch('/admin/clubs/:id/block', auth, authorize('super_admin'), asyncHandler(clubCtrl.toggleBlock));

/**
 * 👤 MANAGER ROUTES (Admin Protected)
 */
router.get('/admin/managers', auth, authorize('super_admin'), asyncHandler(managerCtrl.getAllManagers));
router.post('/admin/managers', auth, authorize('super_admin'), asyncHandler(managerCtrl.createManager));
router.put('/admin/managers/:id', auth, authorize('super_admin'), asyncHandler(managerCtrl.updateManager));
router.delete('/admin/managers/:id', auth, authorize('super_admin'), asyncHandler(managerCtrl.deleteManager));
router.patch('/admin/managers/:id/block', auth, authorize('super_admin'), asyncHandler(managerCtrl.toggleBlock));

/**
 * 📊 DASHBOARD ROUTES
 */
router.get('/admin/stats', auth, authorize('super_admin'), asyncHandler(statsCtrl.getDashboardStats));
router.post('/admin/broadcast', auth, authorize('super_admin'), asyncHandler(broadcastCtrl.sendBroadcast));

const managerAppCtrl = require('../controllers/managerAppController');
const playerCtrl = require('../controllers/playerController');

/**
 * 👤 MANAGER DASHBOARD (Mini-App)
 */
router.get('/manager/stats', auth, authorize('manager'), asyncHandler(managerAppCtrl.getStats));
router.get('/manager/rooms', auth, authorize('manager'), asyncHandler(managerAppCtrl.getRooms));
router.post('/manager/setup', auth, authorize('manager'), asyncHandler(managerAppCtrl.setup));
router.post('/manager/broadcast', auth, authorize('manager'), asyncHandler(managerAppCtrl.broadcast));
router.post('/manager/pc/:id/action', auth, authorize('manager'), asyncHandler(managerAppCtrl.pcAction));
router.put('/manager/room/:id', auth, authorize('manager'), asyncHandler(managerAppCtrl.editRoom));
router.delete('/manager/room/:id', auth, authorize('manager'), asyncHandler(managerAppCtrl.deleteRoom));

/**
 * 🎮 PLAYER DASHBOARD (Gamer Profile)
 */
router.get('/player/me', auth, authorize('customer'), asyncHandler(playerCtrl.getMe));
router.get('/player/rooms', auth, authorize('customer'), asyncHandler(playerCtrl.getRooms));
router.post('/player/pc/:id/reserve', auth, authorize('customer'), asyncHandler(playerCtrl.reservePc));

module.exports = router;
