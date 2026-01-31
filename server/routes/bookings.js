import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import ServiceRequest from '../models/ServiceRequest.js';

const router = express.Router();

const BOOKING_CONFIG = {
    MAX_BOOKING_DAYS: 30,
    MIN_BOOKING_DAYS: 1,
};

// ... (keep validateBookingDates and generateTransactionId helpers) ...
const validateBookingDates = (checkInStr, checkOutStr) => {
    const checkInDate = new Date(checkInStr + 'T12:00:00');
    const checkOutDate = new Date(checkOutStr + 'T12:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return { valid: false, error: 'Invalid date format. Please use YYYY-MM-DD format.' };
    }

    const checkInDateOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());

    if (checkInDateOnly < today) {
        return { valid: false, error: `Selected check-in date has already passed.` };
    }

    if (checkOutDate <= checkInDate) {
        return { valid: false, error: 'Check-out date must be after check-in date.' };
    }

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < BOOKING_CONFIG.MIN_BOOKING_DAYS) {
        return { valid: false, error: `Minimum booking duration is ${BOOKING_CONFIG.MIN_BOOKING_DAYS} night(s).` };
    }

    if (diffDays > BOOKING_CONFIG.MAX_BOOKING_DAYS) {
        return { valid: false, error: `Maximum booking is ${BOOKING_CONFIG.MAX_BOOKING_DAYS} days.` };
    }

    return { valid: true, nights: diffDays };
};

const generateTransactionId = () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

// @route   POST /api/bookings
// @desc    1. BOOKING PHASE: Pending Approval, Authorized Payment, Proforma Invoice
router.post('/', async (req, res) => {
    try {
        const { userId, roomName, roomType, checkIn, checkOut, totalPrice, idempotencyKey } = req.body;

        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const dateValidation = validateBookingDates(checkIn, checkOut);
        if (!dateValidation.valid) {
            return res.status(400).json({ message: dateValidation.error });
        }

        // DOUBLE BOOKING PREVENTION (Overlap Check)
        // Check if there is any booking for this room that overlaps with requested dates
        // And is NOT Cancelled or Rejected
        // Overlap Logic: (StartA < EndB) && (EndA > StartB)
        const conflictBooking = await Booking.findOne({
            roomName: roomName, // Ensure we check the specific room
            status: { $nin: ['Cancelled', 'Rejected'] }, // Ignore cancelled bookings
            $or: [
                {
                    checkIn: { $lt: new Date(checkOut) },
                    checkOut: { $gt: new Date(checkIn) }
                }
            ]
        });

        if (conflictBooking) {
            return res.status(400).json({
                message: `Room '${roomName}' is not available for these dates. It is already booked from ${new Date(conflictBooking.checkIn).toLocaleDateString()} to ${new Date(conflictBooking.checkOut).toLocaleDateString()}.`
            });
        }

        // Idempotency Check
        if (idempotencyKey) {
            const existingPayment = await import('../models/Payment.js').then(m => m.default.findOne({ idempotencyKey }));
            if (existingPayment) {
                return res.status(409).json({ message: 'Duplicate request.', payment: existingPayment });
            }
        }

        // Create Payment (AUTHORIZED only - No money taken yet)
        const Payment = (await import('../models/Payment.js')).default;
        const newPayment = new Payment({
            booking: new mongoose.Types.ObjectId(),
            amount: totalPrice,
            advanceAmount: 0, // No deposit for now, logic can be added later
            status: 'Authorized',
            transactionId: generateTransactionId(),
            idempotencyKey: idempotencyKey || generateTransactionId(),
        });
        await newPayment.save();

        // Create Booking (PENDING APPROVAL)
        const newBooking = new Booking({
            _id: newPayment.booking,
            user: userId,
            roomName,
            roomType,
            checkIn,
            checkOut,
            totalPrice,
            status: 'Pending Approval',
            payment: newPayment._id
        });
        await newBooking.save();

        // NOTIFICATION: Booking Created (Pending)
        try {
            await Notification.create({
                user: userId,
                message: `Booking received for ${roomName}. Waiting for Admin Approval.`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `BOOKING_CREATED:${newBooking._id}`
            });
        } catch (e) {
            console.log('Notification Error', e.message);
        }

        // Create Proforma Invoice
        const Invoice = (await import('../models/Invoice.js')).default;
        const newInvoice = new Invoice({
            booking: newBooking._id,
            type: 'Proforma',
            totalAmount: totalPrice,
            items: [
                { description: `Estimated Stay: ${roomName} (${dateValidation.nights} nights)`, amount: totalPrice }
            ]
        });
        await newInvoice.save();

        newBooking.invoices.push(newInvoice._id);
        await newBooking.save();

        await AuditLog.create({
            user: userId || 'Guest',
            action: 'Booking Request',
            details: `Booking ${newBooking._id} requested. Status: Pending Approval.`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.status(201).json({
            message: 'Booking request sent. Waiting for Admin Approval.',
            booking: newBooking
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/bookings
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        const role = req.query.role;
        let bookings;
        if (role === 'admin' || role === 'staff') {
            bookings = await Booking.find().populate('user', 'name email').sort({ createdAt: -1 });
        } else if (userId) {
            bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });
        } else {
            return res.status(400).json({ message: 'User ID or Role required' });
        }
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/bookings/:id/approve
// @desc    2. APPROVAL PHASE: Confirm Booking ONLY (No Payment Capture)
router.put('/:id/approve', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status !== 'Pending Approval') {
            return res.status(400).json({ message: `Cannot approve. Current status: ${booking.status}` });
        }

        booking.status = 'Confirmed';
        await booking.save();

        await AuditLog.create({
            user: req.body.adminId || 'Admin',
            action: 'Booking Approved',
            details: `Booking ${booking._id} Confirmed. Payment remains Authorized.`
        });

        // NOTIFICATION: Booking Confirmed
        try {
            await Notification.create({
                user: booking.user,
                message: `Good news! Your booking for ${booking.roomName} is Confirmed.`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `BOOKING_CONFIRMED:${booking._id}`
            });
        } catch (e) { console.log('Notification Error', e.message); }

        res.json({ message: 'Booking Confirmed', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/bookings/:id/reject
// @desc    Reject Booking & Void Authorization
router.put('/:id/reject', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const Payment = (await import('../models/Payment.js')).default;
        if (booking.payment) {
            await Payment.findByIdAndUpdate(booking.payment, { status: 'Voided' });
        }

        booking.status = 'Rejected';
        await booking.save();

        await AuditLog.create({
            user: req.body.adminId || 'Admin',
            action: 'Booking Rejected',
            details: `Booking ${booking._id} Rejected. Payment Voided.`
        });

        res.json({ message: 'Booking Rejected', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/bookings/:id/checkin
// @desc    3. CHECK-IN PHASE: Verify & Mark as Checked In
router.put('/:id/checkin', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status !== 'Confirmed') {
            return res.status(400).json({ message: `Cannot Check-In. Status must be Confirmed. Current: ${booking.status}` });
        }

        booking.status = 'Checked In';
        booking.actualCheckIn = new Date(); // Record actual time
        await booking.save();

        // UPDATE ROOM STATUS -> OCCUPIED
        const Room = (await import('../models/Room.js')).default;
        // Search by roomName (Assuming roomName contains number like "Room 101" or matches number property)
        // Adjust regex or query based on actual Room Name format
        const roomNumber = booking.roomName.replace('Room ', '');
        await Room.findOneAndUpdate({ number: roomNumber }, { status: 'Occupied' });

        await AuditLog.create({
            user: req.body.staffEmail || 'Staff',
            action: 'Guest Check-In',
            details: `Guest Checked In for Room ${booking.roomName}`
        });

        // NOTIFICATION: Welcome
        try {
            await Notification.create({
                user: booking.user,
                message: `Welcome to Smart Hotel! You are checked in to ${booking.roomName}.`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `CHECKIN_WELCOME:${booking._id}`
            });
        } catch (e) { console.log('Notification Error', e.message); }

        res.json({ message: 'Guest Checked In', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/bookings/:id/charges
// @desc    Add extra service charges (Food, Laundry, etc.)
router.post('/:id/charges', async (req, res) => {
    try {
        const { description, amount } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'Checked In') return res.status(400).json({ message: 'Guest must be Checked In to add charges.' });

        booking.charges.push({ description, amount });
        await booking.save();

        await AuditLog.create({
            user: req.body.staffEmail || 'Staff',
            action: 'Add Charge',
            details: `Added charge: ${description} ($${amount}) for Room ${booking.roomName}`
        });

        res.json({ message: 'Charge added', charges: booking.charges });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/bookings/:id/checkout
// @desc    4. CHECK-OUT PHASE: Generate Final Invoice & Process Payment (Strict Zero Balance)
router.put('/:id/checkout', async (req, res) => {
    try {
        const { paymentMethod, paidAmount } = req.body; // e.g., 'cash', 'card_on_file', 'online'

        const booking = await Booking.findById(req.params.id).populate('payment');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status !== 'Checked In') {
            return res.status(400).json({ message: `Cannot Check-Out. Guest is not Checked In.` });
        }


        const Payment = (await import('../models/Payment.js')).default;
        const Invoice = (await import('../models/Invoice.js')).default;

        // 1. Calculate Financials
        // Real-world: Add extra services here (e.g., Mini-bar, Laundry)
        const roomTotal = booking.totalPrice;
        const servicesTotal = booking.charges ? booking.charges.reduce((sum, item) => sum + item.amount, 0) : 0;

        const totalBill = roomTotal + servicesTotal;
        const advancePaid = booking.payment?.advanceAmount || 0;
        const payableAmount = totalBill - advancePaid;

        // 2. Validate Payment
        let amountPayingNow = 0;
        let finalStatus = 'Pending';
        let captureAuth = false;

        if (paymentMethod === 'card_on_file') {
            // Option A: Use the authorized card
            if (booking.payment?.status !== 'Authorized') {
                return res.status(400).json({ message: 'No authorized card on file. Please select another payment method.' });
            }
            amountPayingNow = payableAmount;
            captureAuth = true;
        } else {
            // Option B: Cash / POS Terminal / Transfer
            amountPayingNow = Number(paidAmount) || 0;
        }

        // 3. Balance Check
        const remainingBalance = payableAmount - amountPayingNow;

        if (remainingBalance > 0) {
            return res.status(400).json({
                message: 'Cannot Check-Out. Balance remaining.',
                financials: { totalBill, advancePaid, payableAmount, paidAmount: amountPayingNow, remainingBalance }
            });
        }

        // 4. Process Payment Record
        if (captureAuth && booking.payment) {
            // Capture existing Auth
            await Payment.findByIdAndUpdate(booking.payment._id, {
                status: 'Captured', // PAID via Card
                finalAmount: amountPayingNow,
                method: 'card_on_file'
            });
        } else if (booking.payment) {
            // Update exiting payment record (Switch from Auth to Paid via Cash)
            await Payment.findByIdAndUpdate(booking.payment._id, {
                status: 'Captured', // Treated as PAID
                finalAmount: amountPayingNow,
                advanceAmount: advancePaid, // Keep record
                paymentMethod: paymentMethod // 'cash', 'online'
            });
        }

        // 5. Generate Final Invoice
        const finalInvoice = new Invoice({
            booking: booking._id,
            type: 'Final',
            totalAmount: totalBill,
            items: [
                { description: `Room Charge (${booking.roomName})`, amount: roomTotal },
                ...booking.charges.map(c => ({ description: c.description, amount: c.amount })), // Add service items
                { description: `Less: Advance Payment`, amount: -advancePaid }
            ]
        });
        await finalInvoice.save();
        booking.invoices.push(finalInvoice._id);

        // 6. Complete Check-Out
        booking.status = 'Checked Out';
        booking.actualCheckOut = new Date();
        await booking.save();

        // UPDATE ROOM STATUS -> AVAILABLE
        const Room = (await import('../models/Room.js')).default;
        const roomNumber = booking.roomName.replace('Room ', '');
        await Room.findOneAndUpdate({ number: roomNumber }, { status: 'Available' });

        await AuditLog.create({
            user: req.body.staffEmail || 'Staff',
            action: 'Guest Check-Out',
            details: `Guest Checked Out. Total: ${totalBill}. Paid: ${amountPayingNow}. Method: ${paymentMethod}.`,
        });

        // NOTIFICATION: Checkout Thanks + HOUSEKEEPING TASK
        try {
            await Notification.create({
                user: booking.user,
                message: `Thank you for staying with us. Here is your final invoice.`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `CHECKOUT_THANKS:${booking._id}`
            });

            // GENERATE CHECKOUT CLEANING TASK
            // Needs to be assigned to Housekeeping role generally (or left Unassigned for pool)
            await ServiceRequest.create({
                user: req.user?._id || booking.user, // System or Admin triggered
                type: 'Cleaning',
                details: `Checkout Cleaning for ${booking.roomName}`,
                priority: 'High',
                status: 'New',
                roomNumber: roomNumber
            });
        } catch (e) { console.log('System Trigger Error', e.message); }

        res.json({
            message: 'Check-Out Complete. Payment Verified.',
            booking,
            invoice: finalInvoice,
            receipt: {
                date: new Date(),
                method: paymentMethod,
                amountPaid: amountPayingNow,
                invoiceNumber: finalInvoice._id
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
