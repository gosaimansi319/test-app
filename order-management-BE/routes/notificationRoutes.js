// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { markAsRead, getAdminNotifications, getUnreadNotificationCount, markAllAsRead } = require('../controllers/admin/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { getUserNotifications } = require('../controllers/user/userNotificationController');

router.use(authMiddleware);

router.get('/', authorizeRole(['user']), getUserNotifications); // For normal users
router.get('/admin', authorizeRole(['admin', 'manager']), getAdminNotifications); // For admin and manager
router.put('/read/:id', markAsRead);
router.patch('/allread', markAllAsRead);
router.get('/unread-count', getUnreadNotificationCount);

module.exports = router;
 