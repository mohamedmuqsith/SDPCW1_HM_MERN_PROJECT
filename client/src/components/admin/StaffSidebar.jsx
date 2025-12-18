import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, BedDouble, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StaffSidebar = () => {
    const location = useLocation();
    const { logout, user } = useAuth();

    const links = [
        { name: 'My Tasks', path: '/staff', icon: <ClipboardList size={20} /> },
        { name: 'Room Status', path: '/staff/rooms', icon: <BedDouble size={20} /> },
        { name: 'Notifications', path: '/staff/notifications', icon: <Bell size={20} /> },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 flex flex-col z-50">
            {/* Brand */}
            <div className="p-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary-500 rounded-lg flex items-center justify-center">
                    <User className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold tracking-wide">Staff Portal</span>
            </div>

            {/* User Info */}
            <div className="px-6 pb-6 pt-2">
                <div className="flex items-center space-x-3 bg-slate-800 p-3 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                        {user?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name || 'Staff Member'}</p>
                        <p className="text-xs text-slate-400">Housekeeping</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-secondary-600 text-white shadow-lg shadow-secondary-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}>
                                {link.icon}
                            </div>
                            <span className="font-medium text-sm">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default StaffSidebar;
