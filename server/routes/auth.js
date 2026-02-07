import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Server-side password validation
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character.'
            });
        }

        let role = 'GUEST'; // Default role
        const emailLower = email.toLowerCase();

        // Check specifically for the demo admin accounts or any email containing "admin"
        if (
            email === 'admin35@gmail.com' ||
            email === 'admin123@gmail.com' ||
            email === 'admin@admin.com' ||
            email === 'admin123@admin.com' ||
            emailLower.includes('admin')
        ) {
            role = 'ADMIN';
        }
        // Receptionist role detection
        else if (emailLower.includes('receptionist')) {
            role = 'RECEPTIONIST';
        }
        else if (emailLower.includes('housekeeping')) {
            role = 'HOUSEKEEPING';
        }
        else if (emailLower.includes('maintenance')) {
            role = 'MAINTENANCE';
        }
        else if (emailLower.includes('staff')) {
            role = 'STAFF';
        }
        else if (emailLower.includes('cleaner')) {
            role = 'CLEANER';
        }

        const user = await User.create({
            name,
            email,
            password,
            role
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error); // Debugging
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            await AuditLog.create({
                user: user.email,
                action: 'User Login',
                details: 'Successful login via email',
                ipAddress: req.ip || '127.0.0.1'
            });

            // Standardize role to uppercase if it's currently lowercase
            if (user.role === user.role.toLowerCase()) {
                user.role = user.role.toUpperCase();
            }

            user.lastLogin = new Date();
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                lastLogin: user.lastLogin,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/google
// @desc    Auth user via Google
// @access  Public
router.post('/google', async (req, res) => {
    const { name, email, googleId, avatar } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            // Update googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }

            await AuditLog.create({
                user: user.email,
                action: 'User Login',
                details: 'Successful login via Google',
                ipAddress: req.ip || '127.0.0.1'
            });

            // Standardize role to uppercase if it's currently lowercase
            if (user.role === user.role.toLowerCase()) {
                user.role = user.role.toUpperCase();
            }

            user.lastLogin = new Date();
            await user.save();

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                lastLogin: user.lastLogin,
                token: generateToken(user._id, user.role),
            });
        }

        // Create new user if doesn't exist
        user = await User.create({
            name,
            email,
            googleId,
            password: '', // No password for google users
            avatar,
            role: 'GUEST'
        });

        await AuditLog.create({
            user: user.email,
            action: 'User Registration',
            details: 'New user registered via Google',
            ipAddress: req.ip || '127.0.0.1'
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            token: generateToken(user._id, user.role),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
