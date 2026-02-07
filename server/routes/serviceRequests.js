import express from 'express';
import ServiceRequest from '../models/ServiceRequest.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Booking from '../models/Booking.js';
import { sendExternalAlert } from './notifications.js';

const router = express.Router();

// Helper for Notification
const createNotification = async (userId, message, type, eventKey) => {
    try {
        await Notification.create({
            user: userId,
            message,
            type,
            eventKey,
            status: 'PENDING'
        });
    } catch (err) {
        if (err.code !== 11000) console.error('Notification Error:', err); // Ignore dupes
    }
};

// @route   POST /api/service-requests
// @desc    Create a service request with Auto-Merge Logic
// @access  Private (Guest/Staff)
router.post('/', protect, async (req, res) => {
    try {
        console.log('[DEBUG] Service Request Body:', req.body);
        console.log('[DEBUG] Service Request User:', req.user._id);
        const { type, details, roomNumber, priority, preferredTime, bookingId } = req.body;

        // ===== TYPE NORMALIZATION (Defense in Depth) =====
        // Map common variations to standard type names
        const typeNormalizationMap = {
            'room_service': 'Room Service',
            'housekeeping': 'Housekeeping',
            'cleaning': 'Cleaning',
            'technical': 'Tech Support',
            'tech_support': 'Tech Support',
            'transport': 'Transport',
            'other': 'Other Inquiry',
            'other_inquiry': 'Other Inquiry'
        };
        const normalizedType = typeNormalizationMap[type.toLowerCase()] || type;

        // 1. STRICT VALIDATION: Check for ACTIVE Check-in
        let activeBooking;
        if (bookingId) {
            activeBooking = await Booking.findOne({
                _id: bookingId,
                user: req.user._id,
                status: { $in: ['CHECKED_IN', 'CONFIRMED'] }
            });
        } else {
            activeBooking = await Booking.findOne({
                user: req.user._id,
                status: { $in: ['CHECKED_IN', 'CONFIRMED'] }
            });
        }

        const isStaff = ['admin', 'staff', 'receptionist'].includes(req.user.role);

        if (!activeBooking && !isStaff) {
            return res.status(403).json({
                message: 'Request Rejected',
                reason: 'No active check-in found.',
                code: 'NO_ACTIVE_BOOKING'
            });
        }

        const room = activeBooking ? (activeBooking.assignedRoom || activeBooking.roomName) : (roomNumber || 'N/A');

        // 2. DUPLICATE/DEBOUNCE CHECK: Only block EXACT duplicates (Same Type + Same Details)
        // created within the last 2 minutes. This prevents accidental double-clicks.
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const exactDuplicate = await ServiceRequest.findOne({
            roomNumber: room,
            type: normalizedType,
            details: details, // Exact match on details
            status: 'New',
            createdAt: { $gte: twoMinutesAgo }
        });

        if (exactDuplicate) {
            console.log('[DEBUG] Exact Duplicate Blocked:', exactDuplicate._id);
            return res.status(400).json({
                message: 'Request Ignored',
                reason: 'You just submitted this exact request. Please wait a moment.',
                code: 'DUPLICATE_IGNORED'
            });
        }

        // 3. CREATE NEW REQUEST (Always create new, never merge)

        const request = await ServiceRequest.create({
            user: req.user._id,
            booking: activeBooking?._id,
            type: normalizedType,
            details,
            preferredTime,
            priority: priority || 'Medium', // Default or provided
            roomNumber: room,
            status: 'New'
        });

        // REAL-TIME NOTIFICATION (Socket.io)
        if (normalizedType === 'Housekeeping' || normalizedType === 'Cleaning') {
            const io = req.app.get('io');
            if (io) {
                // Populate basic fields for the dashboard
                const populatedRequest = await ServiceRequest.findById(request._id)
                    .populate('user', 'name email')
                    .populate('booking', 'roomName checkIn checkOut');

                io.emit('housekeeping:new_task', populatedRequest);
                console.log('Socket emitted: housekeeping:new_task');
            }
        }

        await AuditLog.create({
            user: req.user.email,
            action: 'Service Request',
            details: `Requested ${normalizedType}: ${details}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            message: 'Service Request Submitted Successfully',
            reason: `Logged for Room ${room}. Priority: ${request.priority}`,
            request
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ========================================================================
// @route   POST /api/service-requests/cleaner
// @desc    Request Cleaning Service with STRICT validation and detailed responses
// @access  Private (Guest only)
// ========================================================================
const CLEANER_CONFIG = {
    serviceHours: { open: 8, close: 18 },  // 8 AM - 6 PM
    sameDayCutoff: 16,                      // 4:00 PM
    lateNightBlock: { start: 22, end: 6 }, // 10 PM - 6 AM
    timezone: 'Asia/Kolkata',
    slaMinutes: { morning: 120, afternoon: 180 }
};

router.post('/cleaner', protect, async (req, res) => {
    try {
        const { requestedDate, details, priority } = req.body;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const timeString = `${currentHour}:${currentMinutes.toString().padStart(2, '0')}`;

        // ===== RULE 6: Late-Night Block (10 PM - 6 AM) =====
        if (currentHour >= CLEANER_CONFIG.lateNightBlock.start || currentHour < CLEANER_CONFIG.lateNightBlock.end) {
            return res.status(400).json({
                message: 'Cleaning Request Rejected',
                reason: 'Cleaning requests cannot be submitted between 10:00 PM - 6:00 AM to ensure guest privacy.',
                code: 'LATE_NIGHT_BLOCKED',
                suggestion: 'Please submit your request after 6:00 AM.',
                currentTime: timeString
            });
        }

        // ===== RULE 1: Active Booking Required =====
        const activeBooking = await Booking.findOne({
            user: req.user._id,
            status: { $in: ['CHECKED_IN', 'CONFIRMED'] }
        });

        if (!activeBooking) {
            return res.status(403).json({
                message: 'Cleaning Request Rejected',
                reason: 'You must be checked in to request cleaning service.',
                code: 'NO_ACTIVE_BOOKING',
                suggestion: 'Please check in at the front desk first.'
            });
        }

        const checkInDate = new Date(activeBooking.checkIn);
        const checkOutDate = new Date(activeBooking.checkOut);
        const stayDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const dayOfStay = Math.ceil((now - checkInDate) / (1000 * 60 * 60 * 24));

        // ===== RULE 2: Request Date Within Stay Period =====
        if (requestedDate) {
            const reqDate = new Date(requestedDate);
            if (reqDate < checkInDate || reqDate > checkOutDate) {
                return res.status(400).json({
                    message: 'Cleaning Request Rejected',
                    reason: `Cleaning can only be requested during your stay (${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()}).`,
                    code: 'DATE_OUT_OF_STAY',
                    suggestion: 'Choose a date within your booking period.',
                    stayPeriod: {
                        checkIn: checkInDate.toISOString(),
                        checkOut: checkOutDate.toISOString()
                    }
                });
            }
        }

        // ===== RULE 3: Service Hours Window (8 AM - 6 PM) =====
        if (currentHour < CLEANER_CONFIG.serviceHours.open || currentHour >= CLEANER_CONFIG.serviceHours.close) {
            return res.status(400).json({
                message: 'Cleaning Request Rejected',
                reason: `Cleaning service is available 8:00 AM - 6:00 PM. Current time: ${timeString}.`,
                code: 'OUTSIDE_SERVICE_HOURS',
                suggestion: 'Please submit your request during service hours.',
                serviceHours: {
                    open: '08:00',
                    close: '18:00',
                    currentTime: timeString,
                    timezone: CLEANER_CONFIG.timezone
                }
            });
        }

        // ===== RULE 4: Same-Day Cutoff (4 PM) =====
        const isSameDayRequest = !requestedDate || new Date(requestedDate).toDateString() === now.toDateString();
        if (isSameDayRequest && currentHour >= CLEANER_CONFIG.sameDayCutoff) {
            return res.status(400).json({
                message: 'Cleaning Request Rejected',
                reason: `Same-day cleaning requests must be made before 4:00 PM. Current time: ${timeString}.`,
                code: 'SAME_DAY_CUTOFF',
                suggestion: 'Please request cleaning for tomorrow instead.',
                cutoffTime: '16:00',
                currentTime: timeString
            });
        }

        // ===== RULE 5: No Duplicate Pending Requests =====
        const existingRequest = await ServiceRequest.findOne({
            user: req.user._id,
            type: { $in: ['Cleaning', 'Housekeeping'] },
            status: { $in: ['New', 'Assigned', 'In Progress'] }
        });

        if (existingRequest) {
            const hoursAgo = Math.round((now - new Date(existingRequest.createdAt)) / (1000 * 60 * 60));
            return res.status(400).json({
                message: 'Cleaning Request Rejected',
                reason: `You already have a cleaning request in progress (submitted ${hoursAgo} hour(s) ago).`,
                code: 'DUPLICATE_REQUEST',
                suggestion: 'Track status in "My Requests". Contact front desk to update.',
                existingRequest: {
                    id: existingRequest._id,
                    status: existingRequest.status,
                    createdAt: existingRequest.createdAt
                }
            });
        }

        // ===== ALL VALIDATIONS PASSED - CREATE REQUEST =====
        const isMorning = currentHour < 12;
        const slaMinutes = isMorning ? CLEANER_CONFIG.slaMinutes.morning : CLEANER_CONFIG.slaMinutes.afternoon;
        const estimatedStart = new Date(now.getTime() + slaMinutes * 60000);
        const estimatedEnd = new Date(estimatedStart.getTime() + 2 * 60 * 60000); // 2-hour window

        const request = await ServiceRequest.create({
            user: req.user._id,
            booking: activeBooking._id,
            type: 'Cleaning',
            details: details || 'Regular room cleaning requested',
            priority: priority || 'Medium',
            roomNumber: activeBooking.assignedRoom || activeBooking.roomName,
            status: 'New',
            department: 'Housekeeping'
        });

        await AuditLog.create({
            user: req.user.email,
            action: 'CLEANER_REQUEST',
            details: `Cleaning requested for Room ${request.roomNumber}. Day ${dayOfStay}/${stayDays} of stay.`,
            ipAddress: req.ip
        });

        // Format time for display
        const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        // Build detailed success reason
        let successReason = `Your room (${request.roomNumber}) will be cleaned today between ${formatTime(estimatedStart)} - ${formatTime(estimatedEnd)}`;
        if (isMorning) {
            successReason += ' because you requested early in the morning and are first in queue';
        } else if (currentHour < CLEANER_CONFIG.sameDayCutoff) {
            successReason += ' because you made it before the 4:00 PM cutoff';
        }
        successReason += `. You are on Day ${dayOfStay} of ${stayDays} of your stay.`;

        // REAL-TIME NOTIFICATION (Socket.io)
        const io = req.app.get('io');
        if (io) {
            // Populate basic fields for the dashboard
            const populatedRequest = await ServiceRequest.findById(request._id)
                .populate('user', 'name email')
                .populate('booking', 'roomName checkIn checkOut');

            io.emit('housekeeping:new_task', populatedRequest);
            console.log('Socket emitted: housekeeping:new_task (from POST /cleaner)');
        }

        res.status(201).json({
            message: 'Cleaning Service Scheduled',
            reason: successReason,
            code: 'CLEANER_REQUEST_APPROVED',
            request,
            scheduling: {
                estimatedWindow: `${formatTime(estimatedStart)} - ${formatTime(estimatedEnd)}`,
                priority: request.priority,
                dayOfStay,
                totalDays: stayDays,
                roomNumber: request.roomNumber
            }
        });

    } catch (error) {
        console.error('Cleaner Request Error:', error);
        res.status(500).json({
            message: 'Server Error',
            reason: 'An unexpected error occurred while processing your cleaning request.',
            code: 'SERVER_ERROR'
        });
    }
});

// @route   GET /api/service-requests
// @desc    Get requests with Advanced Sorting & Filtering
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        const { role, department, _id } = req.user;

        // --- FILTERING LOGIC ---
        if (role === 'guest') {
            query.user = _id;
        } else if (role === 'admin' || role === 'receptionist') {
            // View All
        } else if (role === 'staff') {
            /* DEBUG: Show ALL requests during demo/testing
            const myDept = (department && department !== 'None') ? department : 'Housekeeping';
            query.$or = [
                { assignedTo: _id },
                { department: myDept },
                { department: { $exists: false } }
            ]; 
            */
        }

        // --- SORTING LOGIC ---
        // 1. Overdue (dueAt < now) - implicit check via sort? No, difficult in simple sort.
        // We will sort by Priority & Date, then client highlights overdue.
        // Priority Order: Emergency > High > Medium > Low

        // MongoDB doesn't sort Enums easily without aggregation. 
        // We often map Priority to Number in Schema, but here it's String.
        // We will sort by createdAt descending for now, and let Client handle complex "Score" sorting,
        // OR use Aggregation. Let's start with basic sort for MVP speed, 
        // BUT user asked for "sorting order (overdue > high priority > oldest new)".
        // Let's do Aggregation.

        const requests = await ServiceRequest.aggregate([
            { $match: query },
            {
                $addFields: {
                    isOverdue: { $lt: ["$dueAt", new Date()] },
                    priorityScore: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$priority", "Emergency"] }, then: 4 },
                                { case: { $eq: ["$priority", "High"] }, then: 3 },
                                { case: { $eq: ["$priority", "Medium"] }, then: 2 },
                                { case: { $eq: ["$priority", "Low"] }, then: 1 }
                            ],
                            default: 0
                        }
                    }
                }
            },
            {
                $sort: {
                    isOverdue: -1,       // Overdue first (true > false)
                    priorityScore: -1,   // Higher priority first
                    createdAt: 1         // Oldest first (FIFO)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" }, // Populate User
            {
                $lookup: {
                    from: "users",
                    localField: "assignedTo",
                    foreignField: "_id",
                    as: "assignedTo"
                }
            },
            { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } } // Populate AssignedTo
        ]);

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/service-requests/:id/assign
// @desc    Assign request to staff
// @access  Private (Admin/Receptionist)
router.put('/:id/assign', protect, authorize('admin', 'receptionist'), async (req, res) => {
    try {
        const { staffId, priority } = req.body;
        const request = await ServiceRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.assignedTo = staffId;
        request.status = 'Assigned';
        if (priority) request.priority = priority;
        await request.save();

        // Notify Staff
        await createNotification(
            staffId,
            `New Task Assigned: ${request.type} for ${request.roomNumber}`,
            'service',
            `REQUEST_ASSIGNED:${request._id}:${staffId}`
        );

        await AuditLog.create({
            user: req.user.email,
            action: 'Assign Request',
            details: `Assigned Request ${request._id} to ${staffId}`,
            ipAddress: req.ip
        });

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/service-requests/:id/status
// @desc    Update Status (Start, Complete)
// @access  Private (Assigned Staff or Admin)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;
        const request = await ServiceRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Not Found' });

        // Authorization Check: Must be Admin OR Assigned Staff
        if (req.user.role !== 'admin' && req.user.role !== 'receptionist' &&
            request.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this request' });
        }

        request.status = status;
        if (resolutionNotes) request.resolutionNotes = resolutionNotes;
        await request.save();

        // Notify Guest if Completed
        if (status === 'Completed') {
            await createNotification(
                request.user,
                `Your request for ${request.type} is completed`,
                'service',
                `REQUEST_COMPLETED:${request._id}`
            );

            // EXTERNAL ALERT
            await sendExternalAlert(
                await (await import('../models/User.js')).default.findById(request.user),
                `Service Update: Your request for ${request.type} has been marked as COMPLETED.`,
                'info'
            );
        }

        await AuditLog.create({
            user: req.user.email,
            action: 'Update Request Status',
            details: `Updated Request ${request._id} to ${status}`,
            ipAddress: req.ip
        });

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/service-requests/:id/accept
// @desc    Accept and start working on a task (atomic operation)
// @access  Private (Staff)
router.patch('/:id/accept', protect, async (req, res) => {
    try {
        // Atomic update: Only update if assignedTo is null or the task is unassigned
        const result = await ServiceRequest.findOneAndUpdate(
            {
                _id: req.params.id,
                status: { $in: ['New', 'Assigned'] },
                $or: [
                    { assignedTo: null },
                    { assignedTo: { $exists: false } },
                    { assignedTo: req.user._id } // Allow if already assigned to this user
                ]
            },
            {
                $set: {
                    assignedTo: req.user._id,
                    status: 'In Progress',
                    startedAt: new Date()
                }
            },
            { new: true }
        ).populate('user', 'name email').populate('assignedTo', 'name email');

        if (!result) {
            // Check if task exists and why it failed
            const existingTask = await ServiceRequest.findById(req.params.id);
            if (!existingTask) {
                return res.status(404).json({ message: 'Task not found', code: 'NOT_FOUND' });
            }
            if (existingTask.assignedTo && existingTask.assignedTo.toString() !== req.user._id.toString()) {
                return res.status(409).json({
                    message: 'Task already accepted by another staff member',
                    code: 'ALREADY_TAKEN'
                });
            }
            if (!['New', 'Assigned'].includes(existingTask.status)) {
                return res.status(400).json({
                    message: `Cannot accept task with status: ${existingTask.status}`,
                    code: 'INVALID_STATUS'
                });
            }
        }

        await AuditLog.create({
            user: req.user.email,
            action: 'Accept Task',
            details: `Accepted and started task ${result._id} (${result.type})`,
            ipAddress: req.ip
        });

        res.json({
            message: 'Task accepted successfully',
            reason: `You are now working on ${result.type} for Room ${result.roomNumber}`,
            request: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/service-requests/:id/complete
// @desc    Mark task as completed (only by assigned staff)
// @access  Private (Assigned Staff or Admin)
router.patch('/:id/complete', protect, async (req, res) => {
    try {
        const { resolutionNotes } = req.body;
        const request = await ServiceRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Task not found', code: 'NOT_FOUND' });
        }

        // Authorization: Only assigned staff or admin can complete
        const isAdmin = ['admin', 'receptionist'].includes(req.user.role);
        const isAssignedStaff = request.assignedTo?.toString() === req.user._id.toString();

        if (!isAdmin && !isAssignedStaff) {
            return res.status(403).json({
                message: 'You can only complete tasks assigned to you',
                code: 'NOT_ASSIGNED'
            });
        }

        // Validate current status
        if (request.status !== 'In Progress') {
            return res.status(400).json({
                message: `Cannot complete task with status: ${request.status}. Must be "In Progress".`,
                code: 'INVALID_STATUS'
            });
        }

        request.status = 'Completed';
        request.completedAt = new Date();
        if (resolutionNotes) request.resolutionNotes = resolutionNotes;
        await request.save();

        // Notify Guest
        await createNotification(
            request.user,
            `Your ${request.type} request has been completed`,
            'service',
            `REQUEST_COMPLETED:${request._id}`
        );

        await AuditLog.create({
            user: req.user.email,
            action: 'Complete Task',
            details: `Completed task ${request._id} (${request.type})`,
            ipAddress: req.ip
        });

        res.json({
            message: 'Task completed successfully',
            reason: `${request.type} for Room ${request.roomNumber} marked as done.`,
            request
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/service-requests/schedule-daily
// @desc    Auto-generate daily cleaning tasks for all occupied rooms
// @access  Private (Admin/Housekeeping Manager)
router.post('/schedule-daily', protect, authorize('admin', 'receptionist'), async (req, res) => {
    try {
        // 1. Find all currently occupied rooms (Confirmed & Checked In)
        // actually only CHECKED_IN needs daily cleaning.
        const occupiedBookings = await Booking.find({
            status: 'CHECKED_IN'
        });

        if (occupiedBookings.length === 0) {
            return res.json({ message: 'No occupied rooms found. No tasks generated.', count: 0 });
        }

        let taskCount = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const booking of occupiedBookings) {
            const roomNum = booking.assignedRoom || booking.roomName;

            // Check if task already exists for today
            const existingTask = await ServiceRequest.findOne({
                roomNumber: roomNum,
                type: 'Cleaning',
                createdAt: { $gte: today }
            });

            if (!existingTask) {
                await ServiceRequest.create({
                    user: req.user._id, // Initiated by Admin/System
                    booking: booking._id,
                    type: 'Cleaning',
                    details: 'Daily Housekeeping Service',
                    priority: 'Medium',
                    status: 'New',
                    roomNumber: roomNum,
                    department: 'Housekeeping'
                });
                taskCount++;
            }
        }

        res.json({
            message: `Daily schedule generated. Created ${taskCount} new cleaning tasks.`,
            count: taskCount,
            totalOccupied: occupiedBookings.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
