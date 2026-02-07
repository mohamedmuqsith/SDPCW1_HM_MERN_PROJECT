import express from 'express';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import Room from '../models/Room.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get monthly revenue for last 6 months
// @route   GET /api/reports/revenue
// @access  Private/Admin/Manager
router.get('/revenue', protect, authorize('admin', 'manager'), async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenue = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    status: { $in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$totalPrice" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json(revenue);
    } catch (error) {
        console.error('Revenue Report Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get current occupancy rate
// @route   GET /api/reports/occupancy
// @access  Private/Admin/Manager
router.get('/occupancy', protect, authorize('admin', 'manager'), async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();

        // Count bookings that are actively checked in OR confirmed for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const occupiedCount = await Booking.countDocuments({
            status: { $in: ['CHECKED_IN'] }
        });

        // Or calculate occupancy based on date ranges overlapping today
        // Simpler approach for now: 'CHECKED_IN' status

        const rate = totalRooms > 0 ? ((occupiedCount / totalRooms) * 100).toFixed(1) : 0;

        res.json({
            rate,
            occupied: occupiedCount,
            available: totalRooms - occupiedCount,
            total: totalRooms
        });
    } catch (error) {
        console.error('Occupancy Report Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get recent security audit logs
// @route   GET /api/reports/logs
// @access  Private/Admin
router.get('/logs', protect, authorize('admin'), async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(logs);
    } catch (error) {
        console.error('Audit Log Report Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get revenue by hotel type with date filter
// @route   GET /api/reports/hotel-revenue
// @access  Private/Admin/Manager
router.get('/hotel-revenue', protect, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { startDate, endDate, hotel } = req.query;
        let match = {
            status: { $in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }
        };

        if (startDate && endDate && startDate !== '' && endDate !== '') {
            match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (hotel && hotel !== 'all') {
            match.hotelName = hotel;
        }

        const report = await Booking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        hotel: "$hotelName",
                        type: "$roomType"
                    },
                    totalRevenue: { $sum: "$totalPrice" },
                    bookingCount: { $count: {} }
                }
            },
            {
                $project: {
                    _id: 0,
                    hotelType: {
                        $concat: [
                            { $ifNull: ["$_id.hotel", "Central Hotel"] },
                            " . ",
                            { $ifNull: ["$_id.type", "Unknown"] }
                        ]
                    },
                    totalRevenue: 1,
                    bookingCount: 1
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.json(report);
    } catch (error) {
        console.error('Hotel Revenue Report Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
