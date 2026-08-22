import { useState, useEffect, useContext, useRef } from 'react';
import api from '../api/axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

const NotificationCenter = () => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            const handleNotification = (data) => {
                if (data.notification) {
                    setNotifications(prev => [data.notification, ...prev]);
                }
            };

            socket.on('new_rescue_request', handleNotification);
            socket.on('rescue_status_update', handleNotification);

            return () => {
                socket.off('new_rescue_request', handleNotification);
                socket.off('rescue_status_update', handleNotification);
            };
        }
    }, [socket]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="notification-btn"
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="glass-panel notification-dropdown animate-fade-in">
                    <div className="notification-header">
                        <h4>Notifications</h4>
                        <span className="badge badge-notified">{unreadCount} unread</span>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <p className="notification-empty">No notifications yet</p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                                    onClick={() => !n.isRead && markAsRead(n._id)}
                                >
                                    <div className="notification-title">{n.title}</div>
                                    <div className="notification-message">{n.message}</div>
                                    <div className="notification-time">
                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
