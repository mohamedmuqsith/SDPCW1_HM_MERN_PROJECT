import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarRange, BedDouble, ConciergeBell, Users, FileBarChart, LogOut, Building2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const links = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
        { name: 'Bookings', path: '/admin/bookings', icon: <CalendarRange size={18} /> },
        { name: 'Rooms', path: '/admin/rooms', icon: <BedDouble size={18} /> },
        { name: 'Services', path: '/admin/services', icon: <ConciergeBell size={18} /> },
        { name: 'Staff', path: '/admin/staff', icon: <Users size={18} /> },
        { name: 'Reports', path: '/admin/reports', icon: <FileBarChart size={18} /> },
        { name: 'Hotels', path: '/admin/hotels', icon: <Building2 size={18} /> },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`fixed left-0 top-0 h-screen w-72 bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out border-r border-white/5 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                {/* Brand */}
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Building2 className="text-white" size={24} />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tight block leading-none">SmartStay</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Admin Hub</span>
                        </div>
                    </div>

                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Main Menu</p>
                    {links.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}>
                                    {link.icon}
                                </div>
                                <span className="font-bold text-sm tracking-tight">{link.name}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Account */}
                <div className="p-6 border-t border-white/5 bg-slate-900/50">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-4 w-full rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all group font-bold text-sm"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out System</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
