const Notification              = require('../models/Notification');
const { sendNotification }      = require('../utils/socketManager');

// ─────────────────────────────────────────────────────────────
// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
// ─────────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id,
        })
            .populate('sender', 'name profilePicture')
            .sort({ createdAt: -1 })
            .limit(50);                    // cap at 50 most recent

        res.status(200).json(notifications);

    } catch (error) {
        console.error('Get notifications error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
// ─────────────────────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            isRead:    false,
        });

        res.status(200).json({ unreadCount: count });

    } catch (error) {
        console.error('Unread count error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ─────────────────────────────────────────────────────────────
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Only recipient can mark it as read
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Mark read error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ─────────────────────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'All notifications marked as read' });

    } catch (error) {
        console.error('Mark all read error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await notification.deleteOne();
        res.status(200).json({ message: 'Notification deleted' });

    } catch (error) {
        console.error('Delete notification error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Create and send a notification (used internally by other controllers)
//          Not a route — called directly from other controllers
// ─────────────────────────────────────────────────────────────
const createNotification = async ({ recipient, sender, type, referenceId, message }) => {
    try {
        // Don't notify yourself
        if (recipient.toString() === sender.toString()) return;

        const notification = await Notification.create({
            recipient,
            sender,
            type,
            referenceId: referenceId || null,
            message,
        });

        // Populate sender info before emitting via socket
        const populated = await Notification.findById(notification._id)
            .populate('sender', 'name profilePicture');

        // Send real-time notification via Socket.io
        sendNotification(recipient.toString(), populated);

        return notification;

    } catch (error) {
        console.error('Create notification error:', error.message);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
};