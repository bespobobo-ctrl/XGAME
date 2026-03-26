const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const config = require('../config/index');

// 🛡️ CONTROLLERS (Senior Structure)
const authCtrl = require('../controllers/authController');
const clubCtrl = require('../controllers/clubController');
const managerCtrl = require('../controllers/managerController');
const broadcastCtrl = require('../controllers/broadcastController');
const statsCtrl = require('../controllers/statsController');

// 📸 MULTER CONFIG (Image Uploads)
const storage = multer.diskPath ? multer.diskPath : multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 🛡️ AUTH MIDDLEWARE
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });
    try {
        req.user = jwt.verify(token, config.JWT_SECRET);
        next();
    } catch { res.status(401).json({ error: 'Invalid token' }); }
};

// 🏁 PUBLIC ROUTES
router.get('/ping', authCtrl.ping);
router.post('/login', authCtrl.login);

// 🏛️ CLUB ROUTES
router.get('/clubs', clubCtrl.getAllClubs);
router.get('/admin/clubs', auth, clubCtrl.getAllClubs);
router.post('/admin/clubs', auth, upload.single('image'), clubCtrl.createClub);
router.put('/admin/clubs/:id', auth, upload.single('image'), (req, res, next) => {
    // PUT logic inside controller if needed, currently using basic structure
    res.json({ success: true, message: 'Update manually handled in controller later' });
});
router.delete('/admin/clubs/:id', auth, clubCtrl.deleteClub);
router.patch('/admin/clubs/:id/block', auth, clubCtrl.toggleBlock);

// 👤 MANAGER ROUTES
router.get('/admin/managers', auth, managerCtrl.getAllManagers);
router.post('/admin/managers', auth, managerCtrl.createManager);
router.put('/admin/managers/:id', auth, managerCtrl.updateManager);
router.delete('/admin/managers/:id', auth, managerCtrl.deleteManager);
router.patch('/admin/managers/:id/block', auth, managerCtrl.toggleBlock);

// 📊 STATS & BROADCAST
router.get('/admin/stats', auth, statsCtrl.getDashboardStats);
router.post('/admin/broadcast', auth, broadcastCtrl.sendBroadcast);

module.exports = router;
