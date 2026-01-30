import express from 'express';
import mongoose from 'mongoose';
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

// ============================================
// BOOKING VALIDATION CONFIGURATION
// ============================================
const BOOKING_CONFIG = {
    MAX_BOOKING_DAYS: 30,  // Maximum allowed booking duration in days
    MIN_BOOKING_DAYS: 1,   // Minimum 1 night stay
};

/**
 * Validates booking dates with strict rules (TIMEZONE-SAFE)
 * 
 * KEY FIX: Uses server's local date for comparison.
 * Dates are parsed as LOCAL dates, not UTC.
 * This ensures 2026-01-29 is correctly identified as "past" when today is 2026-01-30.
 * 
 * @param {string} checkInStr - Check-in date string (YYYY-MM-DD)
 * @param {string} checkOutStr - Check-out date string (YYYY-MM-DD)
 * @returns {{ valid: boolean, error?: string, nights?: number }}
 */
const validateBookingDates = (checkInStr, checkOutStr) => {
    // =============================================
    // PARSE DATES AS LOCAL TIME (NOT UTC!)
    // Using 'T12:00:00' to avoid DST edge cases at midnight
    // =============================================
    const checkInDate = new Date(checkInStr + 'T12:00:00');
    const checkOutDate = new Date(checkOutStr + 'T12:00:00');

    // Get today's date at start of day (LOCAL time)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Check if dates are valid
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return { valid: false, error: 'Invalid date format. Please use YYYY-MM-DD format.' };
    }

    // 2. STRICT: Check-in must NOT be in the past (before today)
    // Compare date portions only by creating date objects without time
    const checkInDateOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());

    if (checkInDateOnly < today) {
        return {
            valid: false,
            error: `Selected check-in date has already passed. You selected ${checkInStr}, but today is ${now.toISOString().split('T')[0]}.`
        };
    }

    // 3. Check-out MUST be after check-in (no same-day or backward)
    if (checkOutDate <= checkInDate) {
        return { valid: false, error: 'Check-out date must be after check-in date. Same-day checkout is not allowed.' };
    }

    // 4. Calculate duration in days
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Use round to handle DST edge cases

    // 5. Minimum stay check
    if (diffDays < BOOKING_CONFIG.MIN_BOOKING_DAYS) {
        return { valid: false, error: `Minimum booking duration is ${BOOKING_CONFIG.MIN_BOOKING_DAYS} night(s).` };
    }

    // 6. Maximum duration check
    if (diffDays > BOOKING_CONFIG.MAX_BOOKING_DAYS) {
        return {
            valid: false,
            error: `Invalid booking: Check-out date exceeds allowed duration. Maximum booking is ${BOOKING_CONFIG.MAX_BOOKING_DAYS} days. You selected ${diffDays} days.`
        };
    }

    return { valid: true, nights: diffDays };
};

// @route   POST /api/bookings
// @desc    Create a new booking
router.post('/', async (req, res) => {
    try {
        const { userId, roomName, roomType, checkIn, checkOut, totalPrice } = req.body;

        // Validate userId format to prevent CastError
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format. Please use a real ID from login/register response.' });
        }

        // ==========================================
        // STRICT DATE VALIDATION (BACKEND - MANDATORY)
        // ==========================================
        const dateValidation = validateBookingDates(checkIn, checkOut);
        if (!dateValidation.valid) {
            return res.status(400).json({
                message: dateValidation.error,
                code: 'INVALID_BOOKING_DATES'
            });
        }

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
            details: `Booking created for ${roomName} (${roomType}) - ${dateValidation.nights} nights`,
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

        // Update fields based on role
        if (req.body.role === 'staff') {
            // Staff can ONLY update status (Check-in/Check-out)
            if (status) booking.status = status;
            // Prevent staff from changing prices or rooms silently
        } else {
            // Admin can update everything
            booking.status = status || booking.status;
            booking.roomName = roomName || booking.roomName;
            booking.roomType = roomType || booking.roomType;
            booking.checkIn = checkIn || booking.checkIn;
            booking.checkOut = checkOut || booking.checkOut;
            booking.totalPrice = totalPrice || booking.totalPrice;
        }

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

// @route   PUT /api/bookings/:id/checkin
// @desc    Check-in a guest (Staff/Admin only)
router.put('/:id/checkin', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Validate current status
        if (booking.status !== 'Confirmed') {
            return res.status(400).json({
                message: `Cannot check-in. Current status is "${booking.status}". Booking must be "Confirmed" first.`
            });
        }

        // Note: Date validation removed for flexibility with demo/historical data
        // In production, you may want to re-enable: if (today < checkInDate) { ... }

        // Update status
        booking.status = 'Checked In';
        await booking.save();

        // Create audit log
        await AuditLog.create({
            user: req.body.staffEmail || 'Staff',
            action: 'Guest Check-In',
            details: `Checked in guest for ${booking.roomName}. Guest: ${booking.user?.name || 'Unknown'}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/bookings/:id/checkout
// @desc    Check-out a guest (Staff/Admin only)
router.put('/:id/checkout', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Validate current status
        if (booking.status !== 'Checked In') {
            return res.status(400).json({
                message: `Cannot check-out. Current status is "${booking.status}". Guest must be "Checked In" first.`
            });
        }

        // Update status
        booking.status = 'Checked Out';
        await booking.save();

        // Create audit log
        await AuditLog.create({
            user: req.body.staffEmail || 'Staff',
            action: 'Guest Check-Out',
            details: `Checked out guest from ${booking.roomName}. Guest: ${booking.user?.name || 'Unknown'}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
