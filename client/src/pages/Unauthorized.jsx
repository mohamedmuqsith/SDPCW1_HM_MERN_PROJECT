import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-500 mb-6">
                    You do not have permission to view this page. Please log in with the appropriate credentials.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-slate-200 text-slate-800 py-3 rounded-xl font-medium hover:bg-slate-300 transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
