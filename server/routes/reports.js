import express from 'express';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// @route   GET /api/reports/revenue
// @desc    Get revenue analytics (last 6 months)
router.get('/revenue', async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenue = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    status: { $nin: ['Cancelled'] }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$totalPrice" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json(revenue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/reports/occupancy
// @desc    Get occupancy analytics
router.get('/occupancy', async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const occupiedRooms = await Booking.countDocuments({
            status: { $in: ['Checked In', 'Confirmed'] } // Assuming these are active
        });

        const rate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

        res.json({
            rate,
            occupied: occupiedRooms,
            total: totalRooms,
            available: totalRooms - occupiedRooms
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/reports/logs
// @desc    Get security audit logs
router.get('/logs', async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/reports/log
// @desc    Create a manual log entry (for frontend actions)
router.post('/log', async (req, res) => {
    try {
        const { user, action, details, status } = req.body;
        await AuditLog.create({
            user: user || 'Unknown',
            action,
            details,
            status
        });
        res.status(201).json({ message: 'Log created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
