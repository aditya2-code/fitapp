const express = require('express');
const router  = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',             protect, getNotifications);    // GET    /api/notifications
router.get('/unread-count', protect, getUnreadCount);      // GET    /api/notifications/unread-count
router.put('/read-all',     protect, markAllAsRead);       // PUT    /api/notifications/read-all
router.put('/:id/read',     protect, markAsRead);          // PUT    /api/notifications/:id/read
router.delete('/:id',       protect, deleteNotification);  // DELETE /api/notifications/:id

module.exports = router;