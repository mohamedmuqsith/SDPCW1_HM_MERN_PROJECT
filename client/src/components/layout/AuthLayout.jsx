import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center items-center text-white mb-6 hover:text-primary-200 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Home
                </Link>
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                        H
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    LuxeStay
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/95 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
