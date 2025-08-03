import { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };

    const handleMarkAsRead = (notificationId: number) => {
        markAsRead(notificationId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button onClick={handleToggle} className="notification-bell-button">
                <FiBell className="notification-bell-icon" />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">Notifications</div>
                    {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">No new notifications.</p>
                    ) : (
                        <ul className="notification-list">
                            {notifications.map(notif => (
                                <li 
                                    key={notif.id} 
                                    className={`notification-item ${notif.is_read ? '' : 'unread'}`}
                                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                >
                                    <p>{notif.message}</p>
                                    <small>
                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    )}
                     <div className="notification-footer">
                        <a href="#" className="text-sm text-primary font-bold">View all notifications</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;