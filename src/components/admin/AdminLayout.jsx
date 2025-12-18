import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <AdminSidebar />

            <main className="flex-1 ml-64 min-h-screen transition-all duration-300">
                {/* Top Header */}
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900">{user?.name || 'Admin User'}</p>
                            <p className="text-xs text-slate-500">Administrator</p>
                        </div>
                        <img
                            src={user?.avatar || "https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"}
                            alt="Profile"
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        />
                    </div>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
