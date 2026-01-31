import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require receptionist or admin role
const receptionistAuth = [protect, authorize('receptionist', 'admin')];

// ============================================================================
// BOOKING MANAGEMENT
// ============================================================================

// @route   GET /api/receptionist/bookings
// @desc    Get all bookings with optional status filter
// @access  Receptionist, Admin
router.get('/bookings', receptionistAuth, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate('idVerifiedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/receptionist/bookings/pending
// @desc    Get pending approval bookings (quick filter)
// @access  Receptionist, Admin
router.get('/bookings/pending', receptionistAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'PENDING_APPROVAL' })
            .populate('user', 'name email')
            .sort({ createdAt: 1 }); // FIFO for pending

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/receptionist/bookings/:id/approve
// @desc    Approve booking and optionally assign room
// @access  Receptionist, Admin
router.put('/bookings/:id/approve', receptionistAuth, async (req, res) => {
    try {
        const { assignedRoom } = req.body;
        const booking = await Booking.findById(req.params.id).populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found', code: 'NOT_FOUND' });
        }

        if (booking.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({
                message: 'Cannot approve this booking',
                reason: `Current status is '${booking.status}'. Only 'Pending Approval' bookings can be approved.`,
                code: 'INVALID_STATUS'
            });
        }

        booking.status = 'CONFIRMED';
        if (assignedRoom) {
            booking.assignedRoom = assignedRoom;
        }
        await booking.save();

        // Audit Log
        await AuditLog.create({
            user: req.user.email,
            action: 'BOOKING_APPROVED',
            details: `Approved booking ${booking._id} for ${booking.user?.name || 'Guest'}. Room: ${assignedRoom || booking.roomName}`,
            ipAddress: req.ip
        });

        // Notification to Guest
        try {
            await Notification.create({
                user: booking.user._id,
                message: `Great news! Your booking for ${booking.roomName} is confirmed. Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `BOOKING_APPROVED:${booking._id}`
            });
        } catch (e) { console.log('Notification Error:', e.message); }

        res.json({
            message: 'Booking Approved',
            reason: `Booking confirmed for ${booking.user?.name || 'Guest'}. ${assignedRoom ? `Room ${assignedRoom} assigned.` : ''} Guest can check-in from ${new Date(booking.checkIn).toLocaleDateString()}.`,
            booking
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/receptionist/bookings/:id/reject
// @desc    Reject booking
// @access  Receptionist, Admin
router.put('/bookings/:id/reject', receptionistAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await Booking.findById(req.params.id).populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found', code: 'NOT_FOUND' });
        }

        if (booking.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({
                message: 'Cannot reject this booking',
                reason: `Current status is '${booking.status}'. Only 'Pending Approval' bookings can be rejected.`,
                code: 'INVALID_STATUS'
            });
        }

        // Void payment if exists
        const Payment = (await import('../models/Payment.js')).default;
        if (booking.payment) {
            await Payment.findByIdAndUpdate(booking.payment, { status: 'Voided' });
        }

        booking.status = 'REJECTED';
        await booking.save();

        // Audit Log
        await AuditLog.create({
            user: req.user.email,
            action: 'BOOKING_REJECTED',
            details: `Rejected booking ${booking._id}. Reason: ${reason || 'Not specified'}`,
            ipAddress: req.ip
        });

        // Notification to Guest
        try {
            await Notification.create({
                user: booking.user._id,
                message: `Your booking for ${booking.roomName} could not be confirmed. ${reason || 'Please contact reception.'}`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `BOOKING_REJECTED:${booking._id}`
            });
        } catch (e) { console.log('Notification Error:', e.message); }

        res.json({
            message: 'Booking Rejected',
            reason: reason || 'Booking has been declined.',
            booking
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ============================================================================
// CHECK-IN
// ============================================================================

// @route   PUT /api/receptionist/bookings/:id/checkin
// @desc    Process guest check-in with ID verification and optional deposit
// @access  Receptionist, Admin
router.put('/bookings/:id/checkin', receptionistAuth, async (req, res) => {
    try {
        const { idVerified, assignedRoom, advanceDeposit } = req.body;
        const booking = await Booking.findById(req.params.id).populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found', code: 'NOT_FOUND' });
        }

        if (booking.status !== 'CONFIRMED') {
            return res.status(400).json({
                message: 'Cannot check-in guest',
                reason: `Booking must be 'Confirmed' first. Current status: '${booking.status}'`,
                code: 'INVALID_STATUS'
            });
        }

        // ID Verification is required
        if (!idVerified) {
            return res.status(400).json({
                message: 'ID Verification Required',
                reason: 'Guest ID must be verified before check-in.',
                code: 'ID_NOT_VERIFIED'
            });
        }

        // Update booking
        booking.status = 'CHECKED_IN';
        booking.actualCheckIn = new Date();
        booking.idVerified = true;
        booking.idVerifiedBy = req.user._id;
        if (assignedRoom) booking.assignedRoom = assignedRoom;
        if (advanceDeposit) booking.advanceDeposit = advanceDeposit;
        booking.checkInSlipGenerated = true;
        await booking.save();

        // Update Room Status to Occupied
        try {
            const Room = (await import('../models/Room.js')).default;
            const roomNumber = (assignedRoom || booking.roomName).replace('Room ', '');
            await Room.findOneAndUpdate({ number: roomNumber }, { status: 'Occupied' });
        } catch (e) { console.log('Room Update Error:', e.message); }

        // Update Payment with deposit if any
        if (advanceDeposit && booking.payment) {
            const Payment = (await import('../models/Payment.js')).default;
            await Payment.findByIdAndUpdate(booking.payment, { advanceAmount: advanceDeposit });
        }

        // Audit Log
        await AuditLog.create({
            user: req.user.email,
            action: 'GUEST_CHECKIN',
            details: `Checked in ${booking.user?.name || 'Guest'} to ${assignedRoom || booking.roomName}. Deposit: $${advanceDeposit || 0}`,
            ipAddress: req.ip
        });

        // Notification to Guest
        try {
            await Notification.create({
                user: booking.user._id,
                message: `Welcome! You are now checked in to ${assignedRoom || booking.roomName}. Enjoy your stay!`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `CHECKIN:${booking._id}`
            });
        } catch (e) { console.log('Notification Error:', e.message); }

        // Generate Check-In Slip data
        const checkInSlip = {
            slipNumber: `CIS-${Date.now()}`,
            guestName: booking.user?.name || 'Guest',
            roomNumber: assignedRoom || booking.roomName,
            checkInTime: booking.actualCheckIn,
            expectedCheckOut: booking.checkOut,
            depositCollected: advanceDeposit || 0,
            verifiedBy: req.user.name
        };

        res.json({
            message: 'Guest Checked In Successfully',
            reason: `${booking.user?.name || 'Guest'} verified and checked into ${assignedRoom || booking.roomName}. Check-in slip generated.`,
            booking,
            checkInSlip
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ============================================================================
// CHECK-OUT
// ============================================================================

// @route   PUT /api/receptionist/bookings/:id/checkout
// @desc    Process check-out with final invoice generation
// @access  Receptionist, Admin
router.put('/bookings/:id/checkout', receptionistAuth, async (req, res) => {
    try {
        const { paymentMethod, paidAmount } = req.body;
        const booking = await Booking.findById(req.params.id)
            .populate('user', 'name email')
            .populate('payment');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found', code: 'NOT_FOUND' });
        }

        if (booking.status !== 'CHECKED_IN') {
            return res.status(400).json({
                message: 'Cannot check-out guest',
                reason: `Guest must be 'Checked In' first. Current status: '${booking.status}'`,
                code: 'INVALID_STATUS'
            });
        }

        // Calculate financials
        const checkInDate = new Date(booking.actualCheckIn || booking.checkIn);
        const checkOutDate = new Date();
        const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

        const roomRate = booking.totalPrice / Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)));
        const roomTotal = roomRate * nights;
        const servicesTotal = booking.charges ? booking.charges.reduce((sum, c) => sum + c.amount, 0) : 0;
        const subtotal = roomTotal + servicesTotal;
        const taxRate = 0.08; // 8% tax
        const taxAmount = subtotal * taxRate;
        const totalBill = subtotal + taxAmount;
        const advancePaid = booking.advanceDeposit || booking.payment?.advanceAmount || 0;
        const payableAmount = totalBill - advancePaid;

        // Validate payment
        const amountPaying = Number(paidAmount) || 0;
        const remainingBalance = payableAmount - amountPaying;

        if (remainingBalance > 0.01) { // Allow small rounding errors
            return res.status(400).json({
                message: 'Cannot complete check-out',
                reason: `Outstanding balance of $${remainingBalance.toFixed(2)} must be cleared.`,
                code: 'BALANCE_DUE',
                financials: {
                    nights,
                    roomTotal: roomTotal.toFixed(2),
                    servicesTotal: servicesTotal.toFixed(2),
                    subtotal: subtotal.toFixed(2),
                    taxAmount: taxAmount.toFixed(2),
                    totalBill: totalBill.toFixed(2),
                    advancePaid: advancePaid.toFixed(2),
                    payableAmount: payableAmount.toFixed(2),
                    amountPaying: amountPaying.toFixed(2),
                    remainingBalance: remainingBalance.toFixed(2)
                }
            });
        }

        // Generate Final Invoice
        const finalInvoice = new Invoice({
            booking: booking._id,
            type: 'Final',
            items: [
                { description: `Room Charge (${nights} nights @ $${roomRate.toFixed(2)})`, amount: roomTotal, quantity: nights },
                ...booking.charges.map(c => ({ description: c.description, amount: c.amount, quantity: 1 })),
                { description: 'Tax (8%)', amount: taxAmount, quantity: 1 }
            ],
            totalAmount: totalBill,
            taxAmount: taxAmount,
            taxRate: taxRate,
            status: 'Paid',
            paidAt: new Date(),
            paidBy: req.user._id
        });
        await finalInvoice.save();

        // Update booking
        booking.status = 'CHECKED_OUT';
        booking.actualCheckOut = new Date();
        booking.invoices.push(finalInvoice._id);
        await booking.save();

        // Update Payment record
        if (booking.payment) {
            const Payment = (await import('../models/Payment.js')).default;
            await Payment.findByIdAndUpdate(booking.payment._id, {
                status: 'Captured',
                finalAmount: amountPaying,
                paymentMethod: paymentMethod || 'cash'
            });
        }

        // Update Room Status to Available
        try {
            const Room = (await import('../models/Room.js')).default;
            const roomNumber = (booking.assignedRoom || booking.roomName).replace('Room ', '');
            await Room.findOneAndUpdate({ number: roomNumber }, { status: 'Available' });

            // Create Housekeeping Task
            await ServiceRequest.create({
                user: req.user._id,
                type: 'Cleaning',
                details: `Checkout cleaning for ${booking.assignedRoom || booking.roomName}`,
                priority: 'High',
                status: 'New',
                roomNumber: roomNumber,
                department: 'Housekeeping'
            });
        } catch (e) { console.log('Post-checkout Error:', e.message); }

        // Audit Log
        await AuditLog.create({
            user: req.user.email,
            action: 'GUEST_CHECKOUT',
            details: `Checked out ${booking.user?.name || 'Guest'}. Total: $${totalBill.toFixed(2)}. Paid: $${amountPaying.toFixed(2)}. Method: ${paymentMethod || 'cash'}`,
            ipAddress: req.ip
        });

        // Notification to Guest
        try {
            await Notification.create({
                user: booking.user._id,
                message: `Thank you for staying with us! Your final invoice #${finalInvoice._id} is ready.`,
                type: 'booking',
                status: 'PENDING',
                eventKey: `CHECKOUT:${booking._id}`
            });
        } catch (e) { console.log('Notification Error:', e.message); }

        res.json({
            message: 'Check-Out Complete',
            reason: `${booking.user?.name || 'Guest'} checked out. Final invoice #${finalInvoice._id} generated. Payment: $${amountPaying.toFixed(2)} via ${paymentMethod || 'cash'}.`,
            booking,
            invoice: finalInvoice,
            financials: {
                nights,
                roomTotal: roomTotal.toFixed(2),
                servicesTotal: servicesTotal.toFixed(2),
                taxAmount: taxAmount.toFixed(2),
                totalBill: totalBill.toFixed(2),
                paid: amountPaying.toFixed(2)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ============================================================================
// SERVICE REQUESTS
// ============================================================================

// @route   GET /api/receptionist/service-requests
// @desc    Get all service requests
// @access  Receptionist, Admin
router.get('/service-requests', receptionistAuth, async (req, res) => {
    try {
        const { status, department } = req.query;
        let query = {};

        if (status) query.status = status;
        if (department) query.department = department;

        const requests = await ServiceRequest.find(query)
            .populate('user', 'name email')
            .populate('assignedTo', 'name department')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/receptionist/service-requests/:id/assign
// @desc    Assign service request to staff member
// @access  Receptionist, Admin
router.put('/service-requests/:id/assign', receptionistAuth, async (req, res) => {
    try {
        const { staffId, priority } = req.body;

        if (!staffId) {
            return res.status(400).json({
                message: 'Staff ID required',
                reason: 'Please select a staff member to assign this task.',
                code: 'MISSING_STAFF'
            });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Service request not found', code: 'NOT_FOUND' });
        }

        const staffMember = await User.findById(staffId);
        if (!staffMember) {
            return res.status(404).json({ message: 'Staff member not found', code: 'STAFF_NOT_FOUND' });
        }

        request.assignedTo = staffId;
        request.status = 'Assigned';
        if (priority) request.priority = priority;
        await request.save();

        // Audit Log
        await AuditLog.create({
            user: req.user.email,
            action: 'SERVICE_REQUEST_ASSIGNED',
            details: `Assigned ${request.type} request to ${staffMember.name}. Priority: ${request.priority}`,
            ipAddress: req.ip
        });

        // Notification to Staff
        try {
            await Notification.create({
                user: staffId,
                message: `New task assigned: ${request.type} for Room ${request.roomNumber}`,
                type: 'service',
                status: 'PENDING',
                eventKey: `TASK_ASSIGNED:${request._id}`
            });
        } catch (e) { console.log('Notification Error:', e.message); }

        res.json({
            message: 'Task Assigned',
            reason: `${request.type} assigned to ${staffMember.name} (${staffMember.department || staffMember.role})`,
            request
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/receptionist/staff
// @desc    Get staff members for assignment dropdown
// @access  Receptionist, Admin
router.get('/staff', receptionistAuth, async (req, res) => {
    try {
        const { department } = req.query;
        let query = { role: { $in: ['staff', 'housekeeping', 'maintenance'] } };

        if (department) query.department = department;

        const staff = await User.find(query).select('name email role department');
        res.json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ============================================================================
// DASHBOARD STATS
// ============================================================================

// @route   GET /api/receptionist/stats
// @desc    Get receptionist dashboard statistics
// @access  Receptionist, Admin
router.get('/stats', receptionistAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            pendingApprovals,
            todayCheckIns,
            todayCheckOuts,
            currentlyCheckedIn,
            newServiceRequests
        ] = await Promise.all([
            Booking.countDocuments({ status: 'PENDING_APPROVAL' }),
            Booking.countDocuments({ checkIn: { $gte: today, $lt: tomorrow }, status: 'CONFIRMED' }),
            Booking.countDocuments({ checkOut: { $gte: today, $lt: tomorrow }, status: 'CHECKED_IN' }),
            Booking.countDocuments({ status: 'CHECKED_IN' }),
            ServiceRequest.countDocuments({ status: 'New' })
        ]);

        res.json({
            pendingApprovals,
            todayCheckIns,
            todayCheckOuts,
            currentlyCheckedIn,
            newServiceRequests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
