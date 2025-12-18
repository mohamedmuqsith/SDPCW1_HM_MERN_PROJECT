import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, Bell } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!user?._id) return;
        try {
            const res = await fetch(`http://localhost:5000/api/notifications?userId=${user._id || user.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Rooms', path: '/rooms' },
        { name: 'Services', path: '/services' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-primary-900 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                            H
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-text text-transparent">
                            LuxeStay
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex space-x-8 items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                {/* Notifications */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2 text-slate-500 hover:text-primary-600 transition-colors"
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-fade-in max-h-96 overflow-y-auto">
                                            <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                                                <h3 className="font-semibold text-slate-900">Notifications</h3>
                                                <span className="text-xs text-slate-500">{unreadCount} unread</span>
                                            </div>
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-slate-400 text-sm">No notifications</div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div key={n._id}
                                                        className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${n.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                                                        onClick={() => markAsRead(n._id)}
                                                    >
                                                        <p className="text-sm text-slate-800">{n.message}</p>
                                                        <span className="text-xs text-slate-400 mt-1 block">
                                                            {new Date(n.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to={user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/dashboard'}
                                    className="flex items-center space-x-2 text-slate-700 hover:text-primary-700"
                                >
                                    <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200" />
                                    <span className="font-medium">{user.name}</span>
                                </Link>

                                {/* Admin/Staff Panel Links */}
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="text-sm font-medium text-slate-500 hover:text-primary-600">
                                        Admin Panel
                                    </Link>
                                )}
                                {user.role === 'staff' && (
                                    <Link to="/staff" className="text-sm font-medium text-slate-500 hover:text-primary-600">
                                        Staff Panel
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="text-slate-500 hover:text-red-600 transition-colors"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-lg shadow-primary-500/30"
                                >
                                    Book Now
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-700 hover:text-primary-600"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-primary-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {!isAuthenticated && (
                            <>
                                <Link
                                    to="/login"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-primary-50"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-primary-50"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
