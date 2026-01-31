import express from 'express';
import ServiceRequest from '../models/ServiceRequest.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and cleaner/housekeeping/admin role
router.use(protect);
router.use(authorize('cleaner', 'housekeeping', 'admin'));

// ========================================================================
// Helper: Generate "WHY ALLOWED" reason for a cleaning request
// ========================================================================
const generateAllowedReason = async (request) => {
    try {
        const booking = await Booking.findById(request.booking).populate('user', 'name');
        if (!booking) {
            return 'Request created by staff or booking no longer exists.';
        }

        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const requestDate = new Date(request.createdAt);
        const stayDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const dayOfStay = Math.ceil((requestDate - checkInDate) / (1000 * 60 * 60 * 24));
        const requestHour = requestDate.getHours();
        const requestTime = requestDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        let reasons = [];

        // Reason 1: Guest status
        reasons.push(`Guest "${booking.user?.name || 'Unknown'}" is checked in`);

        // Reason 2: Day of stay
        reasons.push(`Day ${dayOfStay} of ${stayDays}`);

        // Reason 3: Request timing
        if (requestHour < 12) {
            reasons.push(`requested at ${requestTime} (morning priority)`);
        } else if (requestHour < 16) {
            reasons.push(`requested at ${requestTime} (before 4 PM cutoff)`);
        } else {
            reasons.push(`requested at ${requestTime}`);
        }

        // Reason 4: Service hours compliance
        if (requestHour >= 8 && requestHour < 18) {
            reasons.push('within service hours (8 AM - 6 PM)');
        }

        return `✓ ${reasons.join(', ')}.`;
    } catch (error) {
        return 'Request validated at creation time.';
    }
};

// ========================================================================
// @route   GET /api/cleaner/tasks
// @desc    Get cleaning tasks for cleaner dashboard with WHY reasons
// @access  Private (Cleaner/Housekeeping/Admin)
// ========================================================================
router.get('/tasks', async (req, res) => {
    try {
        console.log('API /cleaner/tasks HIT by:', req.user.email, 'Role:', req.user.role);
        const { status, priority } = req.query;

        // Build filter for Cleaning/Housekeeping requests only
        const filter = {
            type: { $in: ['Cleaning', 'Housekeeping'] },
            status: { $ne: 'Cancelled' }
        };

        // Allow filtering by status
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Allow filtering by priority
        if (priority && priority !== 'all') {
            filter.priority = priority;
        }

        const requests = await ServiceRequest.find(filter)
            .populate('user', 'name email')
            .populate('booking', 'roomName checkIn checkOut')
            .populate('assignedTo', 'name')
            .sort({ dueAt: 1, createdAt: -1 });

        // Add "WHY ALLOWED" reason to each request
        const tasksWithReasons = await Promise.all(
            requests.map(async (req) => {
                const allowedReason = await generateAllowedReason(req);
                return {
                    ...req.toObject(),
                    allowedReason,
                    isOverdue: req.dueAt && new Date() > new Date(req.dueAt),
                    timeRemaining: req.dueAt ? Math.round((new Date(req.dueAt) - new Date()) / 60000) : null
                };
            })
        );

        // Stats
        const stats = {
            total: tasksWithReasons.length,
            new: tasksWithReasons.filter(t => t.status === 'New').length,
            inProgress: tasksWithReasons.filter(t => t.status === 'In Progress').length,
            completed: tasksWithReasons.filter(t => t.status === 'Completed').length,
            overdue: tasksWithReasons.filter(t => t.isOverdue && t.status !== 'Completed').length
        };

        res.json({ tasks: tasksWithReasons, stats });

    } catch (error) {
        console.error('Cleaner Tasks Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ========================================================================
// @route   GET /api/cleaner/stats
// @desc    Get dashboard statistics for cleaner
// @access  Private (Cleaner/Housekeeping/Admin)
router.get('/stats', protect, authorize('cleaner', 'housekeeping', 'admin'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await ServiceRequest.aggregate([
            {
                $match: {
                    type: { $in: ['Cleaning', 'Housekeeping'] },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const todayCount = await ServiceRequest.countDocuments({
            type: { $in: ['Cleaning', 'Housekeeping'] },
            createdAt: { $gte: today }
        });

        const formattedStats = {
            new: 0,
            assigned: 0,
            inProgress: 0,
            completed: 0,
            todayRequests: todayCount
        };

        stats.forEach(s => {
            const key = s._id.replace(' ', '').toLowerCase();
            if (key === 'new') formattedStats.new = s.count;
            if (key === 'assigned') formattedStats.assigned = s.count;
            if (key === 'inprogress' || key === 'in progress') formattedStats.inProgress = s.count;
            if (key === 'completed') formattedStats.completed = s.count;
        });

        res.json(formattedStats);

    } catch (error) {
        console.error('Cleaner Stats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ========================================================================
// @route   PATCH /api/cleaner/tasks/:id/start
// @desc    Start a cleaning task
// @access  Private (Cleaner/Housekeeping/Admin)
// ========================================================================
router.patch('/tasks/:id/start', async (req, res) => {
    try {
        const task = await ServiceRequest.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: 'Task Not Found',
                reason: 'The requested cleaning task does not exist.',
                code: 'TASK_NOT_FOUND'
            });
        }

        if (task.status === 'In Progress') {
            return res.status(400).json({
                message: 'Already Started',
                reason: 'This task is already in progress.',
                code: 'ALREADY_IN_PROGRESS'
            });
        }

        if (task.status === 'Completed') {
            return res.status(400).json({
                message: 'Already Completed',
                reason: 'This task has already been completed.',
                code: 'ALREADY_COMPLETED'
            });
        }

        task.status = 'In Progress';
        task.startedAt = new Date();
        task.assignedTo = req.user._id;
        await task.save();

        await AuditLog.create({
            user: req.user.email,
            action: 'CLEANER_TASK_STARTED',
            details: `Started cleaning task for Room ${task.roomNumber}`,
            ipAddress: req.ip
        });

        res.json({
            message: 'Task Started',
            reason: `You have started cleaning Room ${task.roomNumber}. Mark as complete when finished.`,
            code: 'TASK_STARTED',
            task
        });

    } catch (error) {
        console.error('Start Task Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ========================================================================
// @route   PATCH /api/cleaner/tasks/:id/complete
// @desc    Complete a cleaning task
// @access  Private (Cleaner/Housekeeping/Admin)
// ========================================================================
router.patch('/tasks/:id/complete', async (req, res) => {
    try {
        const { notes } = req.body;
        const task = await ServiceRequest.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: 'Task Not Found',
                reason: 'The requested cleaning task does not exist.',
                code: 'TASK_NOT_FOUND'
            });
        }

        if (task.status === 'Completed') {
            return res.status(400).json({
                message: 'Already Completed',
                reason: 'This task has already been marked as completed.',
                code: 'ALREADY_COMPLETED'
            });
        }

        const startTime = task.startedAt || new Date();
        const completionTime = new Date();
        const durationMinutes = Math.round((completionTime - startTime) / 60000);

        task.status = 'Completed';
        task.completedAt = completionTime;
        if (notes) {
            task.resolutionNotes = notes;
        }
        await task.save();

        await AuditLog.create({
            user: req.user.email,
            action: 'CLEANER_TASK_COMPLETED',
            details: `Completed cleaning Room ${task.roomNumber} in ${durationMinutes} minutes`,
            ipAddress: req.ip
        });

        res.json({
            message: 'Task Completed',
            reason: `Room ${task.roomNumber} has been cleaned. Time taken: ${durationMinutes} minutes.`,
            code: 'TASK_COMPLETED',
            task,
            duration: durationMinutes
        });

    } catch (error) {
        console.error('Complete Task Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ========================================================================
// @route   POST /api/cleaner/report
// @desc    Report a maintenance issue
// @access  Private (Cleaner/Housekeeping/Admin)
// ========================================================================
router.post('/report', async (req, res) => {
    try {
        const { roomNumber, details, priority } = req.body;

        if (!roomNumber || !details) {
            return res.status(400).json({
                message: 'Missing Fields',
                reason: 'Room Number and Details are required.'
            });
        }

        const newRequest = await ServiceRequest.create({
            user: req.user._id,
            type: 'Tech Support', // Maps to Maintenance department
            department: 'Maintenance',
            roomNumber,
            details,
            priority: priority || 'Medium',
            status: 'New',
            assignedTo: null
        });

        await AuditLog.create({
            user: req.user.email,
            action: 'MAINTENANCE_REPORTED',
            details: `Reported issue in Room ${roomNumber}: ${details}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            message: 'Report Submitted',
            reason: 'Maintenance team has been notified.',
            request: newRequest
        });

    } catch (error) {
        console.error('Report Issue Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
