import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { notificationAPI }     from '../../api';
import Spinner                 from '../../components/common/Spinner';
import toast                   from 'react-hot-toast';

// ── Notification icon based on type ───────────────────────────
const getIcon = (type) => {
    const icons = {
        new_follower:     '👤',
        post_like:        '❤️',
        post_comment:     '💬',
        workout_reminder: '💪',
        meal_reminder:    '🥗',
        challenge_update: '🏆',
    };
    return icons[type] || '🔔';
};

// ── Single notification card ───────────────────────────────────
const NotificationCard = ({ notification, onRead, onDelete }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (!notification.isRead) onRead(notification._id);

        // Navigate to relevant page based on type
        if (
            notification.type === 'post_like' ||
            notification.type === 'post_comment'
        ) {
            navigate('/feed');
        } else if (notification.type === 'new_follower') {
            navigate(`/profile/${notification.sender?._id}`);
        } else if (notification.type === 'challenge_update') {
            navigate('/challenges');
        }
    };

    return (
        <div
            className={`flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer ${
                notification.isRead
                    ? 'bg-dark border-border opacity-60 hover:opacity-100'
                    : 'bg-card border-primary/30 hover:border-primary'
            }`}
            onClick={handleClick}
        >
            {/* Type Icon */}
            <div className="w-10 h-10 rounded-full bg-dark border border-border flex items-center justify-center text-xl flex-shrink-0">
                {getIcon(notification.type)}
            </div>

            {/* Sender Avatar + Message */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {notification.sender?.profilePicture ? (
                        <img
                            src={notification.sender.profilePicture}
                            alt="avatar"
                            className="w-6 h-6 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {notification.sender?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <p className="text-white text-sm font-medium truncate">
                        {notification.sender?.name}
                    </p>
                </div>

                <p className="text-slate-300 text-sm mt-1">
                    {notification.message}
                </p>

                <p className="text-slate-500 text-xs mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                </p>
            </div>

            {/* Right side — unread dot + delete */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {!notification.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                    }}
                    className="text-slate-600 hover:text-red-400 transition text-lg leading-none"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

// ── Main Notifications Page ────────────────────────────────────
const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const [filter,        setFilter]        = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const [notifsRes, countRes] = await Promise.all([
                notificationAPI.getAll(),
                notificationAPI.getUnreadCount(),
            ]);
            setNotifications(notifsRes.data);
            setUnreadCount(countRes.data.unreadCount);
        } catch {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === id ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(prev - 1, 0));
        } catch {
            toast.error('Failed to mark as read');
        }
    };

    const handleReadAll = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationAPI.delete(id);
            const deleted = notifications.find((n) => n._id === id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (!deleted?.isRead) {
                setUnreadCount((prev) => Math.max(prev - 1, 0));
            }
            toast.success('Notification deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleClearAll = async () => {
        try {
            await Promise.all(
                notifications.map((n) => notificationAPI.delete(n._id))
            );
            setNotifications([]);
            setUnreadCount(0);
            toast.success('All notifications cleared');
        } catch {
            toast.error('Failed to clear notifications');
        }
    };

    // Filter notifications
    const filtered = notifications.filter((n) => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'read')   return  n.isRead;
        return true;
    });

    // Group notifications by type for the summary
    const typeCounts = notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
    }, {});

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">🔔 Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="bg-primary text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleReadAll}
                            className="text-sm text-primary hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-sm text-slate-400 hover:text-red-400 transition"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            {notifications.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { type: 'new_follower',     label: 'Followers',  icon: '👤' },
                        { type: 'post_like',        label: 'Likes',      icon: '❤️' },
                        { type: 'post_comment',     label: 'Comments',   icon: '💬' },
                    ].map((item) => (
                        <div
                            key={item.type}
                            className="bg-card border border-border rounded-xl p-4 text-center"
                        >
                            <p className="text-2xl">{item.icon}</p>
                            <p className="text-white font-bold text-xl mt-1">
                                {typeCounts[item.type] || 0}
                            </p>
                            <p className="text-slate-400 text-xs">{item.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'unread', 'read'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition capitalize ${
                            filter === tab
                                ? 'bg-primary border-primary text-white'
                                : 'bg-dark border-border text-slate-400 hover:border-primary'
                        }`}
                    >
                        {tab}
                        {tab === 'unread' && unreadCount > 0 && (
                            <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {filtered.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                    <p className="text-5xl mb-4">🔔</p>
                    <p className="text-slate-400 text-lg font-medium">
                        {filter === 'unread'
                            ? "You're all caught up!"
                            : 'No notifications yet'}
                    </p>
                    <p className="text-slate-600 text-sm mt-2">
                        {filter === 'unread'
                            ? 'No unread notifications'
                            : 'Interact with others to receive notifications'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((notification) => (
                        <NotificationCard
                            key={notification._id}
                            notification={notification}
                            onRead={handleRead}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;