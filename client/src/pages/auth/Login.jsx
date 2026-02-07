import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, getRoleRedirectPath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleRedirect = (userData) => {
        // If staff members use the main login portal, they likely want to book/use guest services
        if (
            ['STAFF', 'HOUSEKEEPING', 'MAINTENANCE', 'CLEANER'].includes(userData.role.toUpperCase())
        ) {
            navigate('/dashboard', { replace: true });
        } else {
            // Use centralized role-based redirect for admins, receptionists, and guests
            const redirectPath = getRoleRedirectPath(userData.role);
            navigate(redirectPath, { replace: true });
        }
    };

    const validateEmail = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!regex.test(email)) {
            setEmailError('Please enter a valid email address (e.g. user@example.com)');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        if (emailError) validateEmail(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            return;
        }

        setLoading(true);
        try {
            const userData = await login(email, password);
            handleRedirect(userData);
        } catch (error) {
            console.error(error);
            alert(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const userData = await loginWithGoogle();
            handleRedirect(userData);
        } catch (error) {
            console.error("Google login failed", error);
            alert("Google login failed: " + error.message);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Welcome Back</h2>

            {/* Google Login Button */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors mb-6"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 mr-3" alt="Google" />
                Continue with Google
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or continue with email</span>
                </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                        Email address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className={`h-5 w-5 ${emailError ? 'text-red-500' : 'text-slate-400'}`} />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className={`block w-full pl-10 sm:text-sm rounded-lg py-2 focus:ring-primary-500 focus:border-primary-500 ${emailError
                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300'
                                }`}
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={() => validateEmail(email)}
                        />
                        {emailError && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            </div>
                        )}
                    </div>
                    {emailError && (
                        <p className="mt-2 text-sm text-red-600" id="email-error">
                            {emailError}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                            Forgot password?
                        </a>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign up
                </Link>
            </p>
        </div>
    );
};

export default Login;
