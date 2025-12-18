import { Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';

const StaffLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <StaffSidebar />
            <main className="flex-1 ml-64 min-h-screen transition-all duration-300 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default StaffLayout;
