import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
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

        // Determine role based on email pattern (for demo purposes, keeping logic similar to frontend mock)
        let role = 'guest';
        if (email.includes('admin') || email === 'admin35@gmail.com' || email === 'admin123@gmail.com') role = 'admin';
        else if (email.includes('staff')) role = 'staff';

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
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                token: generateToken(user._id),
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

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        }

        // Create new user if doesn't exist
        user = await User.create({
            name,
            email,
            googleId,
            password: '', // No password for google users
            avatar,
            role: 'guest'
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
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
