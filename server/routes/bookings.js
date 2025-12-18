import express from 'express';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Middleware to verify user from request body (simplified for this demo)
// In a real app, use the JWT middleware to extract user from token header
const getUser = async (req) => {
    // Ideally extract from req.headers.authorization
    // For now, we trust the frontend to send user ID or we default to a test workflow
    // This is a placeholder for proper JWT middleware integration
    if (req.body.userId) {
        return req.body.userId;
    }
    return null;
};

// @route   POST /api/bookings
// @desc    Create a new booking
router.post('/', async (req, res) => {
    try {
        const { userId, roomName, roomType, checkIn, checkOut, totalPrice } = req.body;

        const booking = await Booking.create({
            user: userId,
            roomName,
            roomType,
            checkIn,
            checkOut,
            totalPrice
        });

        await AuditLog.create({
            user: userId || 'Guest',
            action: 'New Booking',
            details: `Booking created for ${roomName} (${roomType})`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/bookings
// @desc    Get all bookings (Admin) or User bookings (Guest)
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        const role = req.query.role;

        let bookings;

        if (role === 'admin' || role === 'staff') {
            // Admin gets all bookings and populates user info
            bookings = await Booking.find().populate('user', 'name email').sort({ createdAt: -1 });
        } else if (userId) {
            // Guest gets only their bookings
            bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });
        } else {
            return res.status(400).json({ message: 'User ID or Role required' });
        }

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking details
router.put('/:id', async (req, res) => {
    try {
        const { status, roomName, roomType, checkIn, checkOut, totalPrice } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update fields if they exist in the request
        booking.status = status || booking.status;
        booking.roomName = roomName || booking.roomName;
        booking.roomType = roomType || booking.roomType;
        booking.checkIn = checkIn || booking.checkIn;
        booking.checkOut = checkOut || booking.checkOut;
        booking.totalPrice = totalPrice || booking.totalPrice;

        const updatedBooking = await booking.save();

        // Return populated booking
        const populatedBooking = await Booking.findById(updatedBooking._id).populate('user', 'name email');

        res.json(populatedBooking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete a booking
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await booking.deleteOne();
        res.json({ message: 'Booking removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
