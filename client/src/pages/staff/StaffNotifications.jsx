import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StaffNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/notifications?userId=${user._id}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
            // Optimistic update
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const deleteNotification = async (id) => {
        // Assuming backend supports DELETE, if not, we just hide it or mark read
        // For now, implementing 'mark read' as the primary action, deleting visually
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500">Stay updated with latest activities.</p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium">
                    {notifications.filter(n => !n.read).length} Unread
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                        <p className="text-slate-500">You have no new notifications.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-6 flex items-start gap-4 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50/40'}`}
                            >
                                <div className={`mt-1 p-2 rounded-full ${notification.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-base ${notification.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                            {notification.message}
                                        </p>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                                            {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center"
                                            >
                                                <Check size={14} className="mr-1" /> Mark as Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification._id)}
                                            className="text-xs font-medium text-slate-400 hover:text-red-500 flex items-center"
                                        >
                                            <Trash2 size={14} className="mr-1" /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffNotifications;
