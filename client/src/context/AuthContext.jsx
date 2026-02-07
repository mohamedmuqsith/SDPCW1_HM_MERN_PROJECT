import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from local storage", error);
            return null;
        }
    });

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Login failed');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Registration failed');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        try {
            const { signInWithPopup } = await import("firebase/auth");
            const { auth, googleProvider } = await import("../firebase");

            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Sync with backend to get real MongoDB _id
            const response = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: user.displayName,
                    email: user.email,
                    googleId: user.uid,
                    avatar: user.photoURL
                }),
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Google Auth Sync Failed');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Google Auth Sync Failed');
            }

            console.log("Google Login Success, Backend User:", data);

            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    // Role-based redirect path helper
    const getRoleRedirectPath = (role) => {
        if (!role) return '/dashboard';
        const roleUpper = role.toUpperCase();
        switch (roleUpper) {
            case 'ADMIN':
                return '/admin';
            case 'RECEPTIONIST':
                return '/receptionist';
            case 'CLEANER':
            case 'HOUSEKEEPING': // Redirect to Cleaner Dashboard
                return '/cleaner';
            case 'MAINTENANCE':
            case 'STAFF':
                return '/staff';
            default: // GUEST
                return '/dashboard';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token: user?.token, // Expose token directly
            login,
            register,
            loginWithGoogle,
            logout,
            isAuthenticated: !!user,
            getRoleRedirectPath
        }}>
            {children}
        </AuthContext.Provider>
    );
};
