import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <footer className="bg-slate-900 text-slate-400 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p>&copy; 2025 LuxeStay Hotels. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
