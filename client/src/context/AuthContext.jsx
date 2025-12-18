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

            const data = await response.json();

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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
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

            const data = await response.json();

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

    return (
        <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
