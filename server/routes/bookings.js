import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import RoomInventory from '../models/RoomInventory.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getDatesInRange } from '../utils/dateRange.js';
import Payment from '../models/Payment.js';

const router = express.Router();

/**
 * HELPER: Check for booking conflicts using RoomInventory
 * This uses the unique index { roomNumber: 1, date: 1 } to detect overlaps.
 */
const checkConflict = async (roomNumber, checkIn, checkOut, excludeBookingId = null) => {
    const dates = getDatesInRange(checkIn, checkOut);
    const query = {
        roomNumber,
        date: { $in: dates }
    };
    if (excludeBookingId) {
        query.bookingId = { $ne: excludeBookingId };
    }
    const conflict = await RoomInventory.findOne(query);
    return conflict;
};

// @desc    Create a new booking (Standardized)
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, async (req, res) => {
    let inventoryClaimed = false;
    let dates = [];
    try {
        const { roomName, checkIn, checkOut, roomType, totalPrice, hotelName } = req.body;

        // 1. Validate dates
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (end <= start) {
            return res.status(400).json({ message: 'Check-out must be after check-in.' });
        }

        dates = getDatesInRange(checkIn, checkOut);

        // 2. Create Preliminary Booking (Status: PENDING_APPROVAL)
        const booking = new Booking({
            user: req.user._id,
            roomName,
            hotelName: hotelName || 'Central Hotel',
            roomType,
            checkIn,
            checkOut,
            totalPrice,
            status: 'PENDING_APPROVAL'
        });

        // 3. Atomically Claim Inventory Records
        // This is the "Lock" mechanism. If any record already exists, it throws 11000
        const inventoryRecords = dates.map(date => ({
            hotelName: booking.hotelName,
            roomNumber: roomName,
            date,
            bookingId: booking._id,
            status: 'PENDING_APPROVAL'
        }));

        try {
            await RoomInventory.insertMany(inventoryRecords, { ordered: true });
            inventoryClaimed = true;
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "Room is not available for selected dates.",
                    conflictDetails: { room: roomName, range: `${checkIn} to ${checkOut}` }
                });
            }
            throw error;
        }

        await booking.save();
        res.status(201).json(booking);

    } catch (error) {
        console.error('Booking Creation Error:', error);
        // Rollback inventory if booking save failed
        if (inventoryClaimed) {
            // Find manually since booking._id might not have been fully saved but exists on object
            await RoomInventory.deleteMany({ bookingId: booking._id });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Modify booking dates (Standardized)
// @route   PATCH /api/bookings/:id/dates
// @access  Private
router.patch('/:id/dates', protect, async (req, res) => {
    try {
        const { checkIn, checkOut } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        // 0. Permission & Status check
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized.' });
        }

        const EDITABLE_STATUSES = ['PENDING_APPROVAL', 'CONFIRMED'];
        if (!EDITABLE_STATUSES.includes(booking.status)) {
            return res.status(400).json({ message: `Cannot reschedule booking in ${booking.status} status.` });
        }

        // 0.1 Date validation
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid dates provided.' });
        }
        if (end <= start) {
            return res.status(400).json({ message: 'Check-out must be after check-in.' });
        }

        // 1. Temporarily release old inventory
        const oldDates = getDatesInRange(booking.checkIn, booking.checkOut);
        const oldStatus = booking.status;
        await RoomInventory.deleteMany({ bookingId: booking._id });

        // 2. Try to claim new dates
        const newDates = getDatesInRange(checkIn, checkOut);
        const inventoryRecords = newDates.map(date => ({
            hotelName: booking.hotelName || 'Central Hotel',
            roomNumber: booking.roomName,
            date,
            bookingId: booking._id,
            status: 'PENDING_APPROVAL' // Force to pending for re-approval or keep same? Usually needs re-approval
        }));

        try {
            if (inventoryRecords.length > 0) {
                await RoomInventory.insertMany(inventoryRecords);
            }

            // 3. Update booking
            booking.checkIn = checkIn;
            booking.checkOut = checkOut;
            // If it was confirmed, maybe it needs re-approval because dates changed?
            // For now, let's keep it in PENDING_APPROVAL after reschedule for safety.
            booking.status = 'PENDING_APPROVAL';
            await booking.save();

            res.json(booking);
        } catch (error) {
            // Restore old inventory if new fails
            console.warn('Reschedule conflict or error, restoring inventory:', error.message);

            const restoredRecords = oldDates.map(date => ({
                hotelName: booking.hotelName || 'Central Hotel',
                roomNumber: booking.roomName,
                date,
                bookingId: booking._id,
                status: oldStatus === 'CHECKED_IN' ? 'CHECKED_IN' : oldStatus // Safety check
            }));

            if (restoredRecords.length > 0) {
                try {
                    await RoomInventory.insertMany(restoredRecords);
                } catch (restoreErr) {
                    console.error('FATAL: Failed to restore inventory!', restoreErr);
                }
            }

            if (error.code === 11000) {
                return res.status(409).json({ message: "Conflict: Room already booked for these new dates." });
            }
            throw error;
        }
    } catch (error) {
        console.error('Final Reschedule Error:', {
            message: error.message,
            stack: error.stack,
            id: req.params.id,
            body: req.body
        });
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
});

// @desc    Admin Approve Booking
// @route   PUT /api/bookings/:id/approve
// @access  Private/Admin
router.put('/:id/approve', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        // Re-verify inventory still exists and belongs to this booking
        const inventoryCount = await RoomInventory.countDocuments({ bookingId: booking._id });
        const nights = getDatesInRange(booking.checkIn, booking.checkOut).length;

        if (inventoryCount < nights) {
            return res.status(409).json({ message: 'Inventory mismatch. The room might have been reassigned.' });
        }

        booking.status = 'CONFIRMED';
        await booking.save();
        await RoomInventory.updateMany({ bookingId: booking._id }, { status: 'CONFIRMED' });

        res.json({ message: 'Booking confirmed', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Reject Booking
// @route   PUT /api/bookings/:id/reject
// @access  Private/Admin
router.put('/:id/reject', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.status = 'REJECTED';
            await booking.save();
            await RoomInventory.deleteMany({ bookingId: booking._id });
        }
        res.json({ message: 'Booking rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Check In Guest
// @route   PUT /api/bookings/:id/checkin
// @access  Private/Admin
router.put('/:id/checkin', protect, authorize('ADMIN', 'MANAGER', 'RECEPTIONIST'), async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status !== 'CONFIRMED') {
            return res.status(400).json({ message: 'Booking must be CONFIRMED first' });
        }

        booking.status = 'CHECKED_IN';
        await booking.save();
        await RoomInventory.updateMany({ bookingId: booking._id }, { status: 'CHECKED_IN' });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Check Out Guest
// @route   PUT /api/bookings/:id/checkout
// @access  Private/Admin
router.put('/:id/checkout', protect, authorize('ADMIN', 'MANAGER', 'RECEPTIONIST'), async (req, res) => {
    try {
        const { paymentMethod, paidAmount } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Input validation to prevent NaN issues
        const numericPaidAmount = Number(paidAmount);
        if (isNaN(numericPaidAmount)) {
            return res.status(400).json({ message: 'Invalid paidAmount. Must be a number.' });
        }

        // Handle Payment record - ensuring we use the registered model
        const PaymentModel = mongoose.model('Payment');
        let payment;

        if (booking.payment) {
            try {
                payment = await PaymentModel.findById(booking.payment);
            } catch (err) {
                console.warn('Stale payment reference on booking:', booking.payment);
            }
        }

        if (!payment) {
            payment = new PaymentModel({
                booking: booking._id,
                amount: booking.totalPrice,
                status: 'Not Started'
            });
        }

        payment.finalAmount = numericPaidAmount;
        payment.status = 'Captured';
        payment.paymentMethod = paymentMethod || 'cash';
        await payment.save();

        booking.status = 'CHECKED_OUT';
        booking.payment = payment._id;
        booking.actualCheckOut = new Date();
        await booking.save();

        await RoomInventory.deleteMany({ bookingId: booking._id });

        res.json({
            message: 'Checkout successful',
            booking,
            receipt: {
                bookingId: booking._id,
                amountPaid: numericPaidAmount,
                date: new Date()
            }
        });
    } catch (error) {
        console.error('Checkout Error Full Details:', {
            message: error.message,
            stack: error.stack,
            id: req.params.id,
            user: req.user?._id
        });
        res.status(500).json({
            message: 'Internal Server Error during Checkout',
            details: error.message,
            type: error.name
        });
    }
});
// @desc    Add Service Charge
// @route   POST /api/bookings/:id/charges
// @access  Private/Admin
router.post('/:id/charges', protect, authorize('ADMIN', 'MANAGER', 'RECEPTIONIST'), async (req, res) => {
    try {
        const { description, amount } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status === 'CHECKED_OUT' || booking.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Cannot add charges to closed bookings' });
        }

        booking.charges.push({ description, amount: Number(amount) });
        await booking.save();

        res.json(booking);
    } catch (error) {
        console.error('Add Charge Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Guest Cancel Booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Ensure user owns the booking or is admin
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        booking.status = 'CANCELLED';
        await booking.save();

        // Release inventory
        await RoomInventory.deleteMany({ bookingId: booking._id });

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// KEEP EXISTING GET/DELETE ROUTES FOR SYSTEM INTEGRITY
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        // Admin, manager and receptionist can see all bookings
        // Guests only see their own
        if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(req.user.role.toUpperCase())) {
            query = { user: req.user._id };
        }

        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Fetch Bookings Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    await RoomInventory.deleteMany({ bookingId: req.params.id });
    res.json({ message: 'Booking deleted' });
});

export default router;
