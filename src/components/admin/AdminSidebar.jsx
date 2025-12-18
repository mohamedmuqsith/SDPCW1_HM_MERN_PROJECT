import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarRange, BedDouble, ConciergeBell, Users, FileBarChart, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const links = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Bookings', path: '/admin/bookings', icon: <CalendarRange size={20} /> },
        { name: 'Rooms', path: '/admin/rooms', icon: <BedDouble size={20} /> },
        { name: 'Services', path: '/admin/services', icon: <ConciergeBell size={20} /> },
        { name: 'Staff', path: '/admin/staff', icon: <Users size={20} /> },
        { name: 'Reports', path: '/admin/reports', icon: <FileBarChart size={20} /> },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 flex flex-col z-50">
            {/* Brand */}
            <div className="p-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <BedDouble className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold tracking-wide">SmartStay</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
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

            {/* User / Logout */}
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

export default AdminSidebar;
