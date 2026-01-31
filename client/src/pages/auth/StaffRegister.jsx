import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

const StaffRegister = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, getRoleRedirectPath } = useAuth();
    const navigate = useNavigate();

    // Detect role from email (for display purposes)
    const detectRoleFromEmail = (email) => {
        const emailLower = email.toLowerCase();
        if (emailLower.includes('admin')) return 'admin';
        if (emailLower.includes('receptionist')) return 'receptionist';
        if (emailLower.includes('cleaner')) return 'cleaner';
        if (emailLower.includes('housekeeping')) return 'housekeeping';
        if (emailLower.includes('maintenance')) return 'maintenance';
        if (emailLower.includes('staff')) return 'staff';
        return null;
    };

    const [detectedRole, setDetectedRole] = useState(null);

    const validateEmail = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!regex.test(email)) {
            setEmailError('Please enter a valid email address (e.g. name.receptionist@gmail.com)');
            setDetectedRole(null);
            return false;
        }

        // Check for any staff-related keyword
        const role = detectRoleFromEmail(email);
        if (!role) {
            setEmailError("Email must contain a role keyword: 'receptionist', 'housekeeping', 'maintenance', 'staff', or 'admin'.");
            setDetectedRole(null);
            return false;
        }

        setEmailError('');
        setDetectedRole(role);
        return true;
    };

    const validatePassword = (password) => {
        // Min 8 chars, 1 Uppercase, 1 Number, 1 Special Char
        const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        if (!regex.test(password)) {
            setPasswordError('Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 special character (!@#$%^&*).');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        validateEmail(val); // Always validate to update detected role
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        if (passwordError) validatePassword(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        setLoading(true);
        try {
            const userData = await register(name, email, password);

            // Check if the backend assigned a valid staff/admin role
            const validRoles = ['admin', 'receptionist', 'cleaner', 'housekeeping', 'maintenance', 'staff'];
            if (validRoles.includes(userData.role)) {
                const redirectPath = getRoleRedirectPath(userData.role);
                navigate(redirectPath, { replace: true });
            } else {
                alert("Account created, but staff role was not assigned. Redirecting to guest dashboard.");
                navigate('/dashboard', { replace: true });
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Staff Registration</h2>
                <p className="text-slate-500 mt-2">Create your personnel account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                        Full Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                        Staff Email Address
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
                            className={`block w-full pl-10 sm:text-sm rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500 ${emailError
                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300'
                                }`}
                            placeholder="name.staff@hotel.com"
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
                    {emailError ? (
                        <p className="mt-2 text-sm text-red-600" id="email-error">
                            {emailError}
                        </p>
                    ) : detectedRole ? (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-green-600">✓ Role detected:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${detectedRole === 'admin' ? 'bg-purple-100 text-purple-700' :
                                detectedRole === 'receptionist' ? 'bg-indigo-100 text-indigo-700' :
                                    detectedRole === 'housekeeping' ? 'bg-green-100 text-green-700' :
                                        detectedRole === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                }`}>
                                {detectedRole.charAt(0).toUpperCase() + detectedRole.slice(1)}
                            </span>
                        </div>
                    ) : (
                        <p className="mt-1 text-xs text-slate-400">
                            Include role in email: receptionist, housekeeping, maintenance, staff, or admin
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className={`h-5 w-5 ${passwordError ? 'text-red-500' : 'text-slate-400'}`} />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className={`block w-full pl-10 sm:text-sm rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500 ${passwordError
                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300'
                                }`}
                            placeholder="••••••••"
                            value={password}
                            onChange={handlePasswordChange}
                            onBlur={() => validatePassword(password)}
                        />
                        {passwordError && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            </div>
                        )}
                    </div>
                    {passwordError && (
                        <p className="mt-2 text-sm text-red-600" id="password-error">
                            {passwordError}
                        </p>
                    )}
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Staff Account'}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
                Already registered?{' '}
                <Link to="/staff/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Login here
                </Link>
            </p>
        </div>
    );
};

export default StaffRegister;
