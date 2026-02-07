import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu, Search, Bell, Clock, ChevronDown, User, ShieldCheck } from 'lucide-react';

const AdminLayout = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Format login time
    const formatLoginTime = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 lg:ml-72 min-h-screen transition-all duration-300 flex flex-col">
                {/* Responsive Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex justify-between items-center shadow-xs">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl w-64 border border-transparent focus-within:border-indigo-500 transition-all">
                            <Search size={18} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search analytics..."
                                className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 w-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-6">
                        {/* Persistent Session Time */}


                        <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                        </button>

                        <div className="h-8 w-px bg-slate-200"></div>

                        {/* Profile Section with Login Time */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group"
                            >
                                <div className="hidden sm:block text-right">
                                    <p className="text-xs font-black text-slate-900 leading-none mb-1">{user?.name || 'Admin'}</p>
                                    <div className="flex items-center justify-end gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Active
                                    </div>
                                </div>
                                <div className="relative">
                                    <img
                                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=6366f1&color=fff`}
                                        alt="Profile"
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                                    />
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl border border-slate-100 shadow-2xl z-20 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                        <div className="p-6 bg-linear-to-br from-indigo-600 to-indigo-700 text-white">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-2 bg-white/10 rounded-xl">
                                                    <ShieldCheck size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-tight">{user?.role || 'Administrator'}</p>
                                                    <p className="text-[10px] text-indigo-100 font-medium">{user?.email}</p>
                                                </div>
                                            </div>

                                            {/* Login Time Display */}

                                        </div>

                                        <div className="p-2">
                                            <Link to="/admin/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all group">
                                                <User size={18} className="text-slate-400 group-hover:text-indigo-500" />
                                                View Full Profile
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    localStorage.removeItem('user');
                                                    window.location.href = '/login';
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all group"
                                            >
                                                <Clock size={18} className="text-rose-400 group-hover:text-rose-500" />
                                                End Session
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Content Area */}
                <div className="p-4 sm:p-8 flex-1 overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
