import express from 'express';
import Booking from '../models/Booking.js';

const router = express.Router();

// @route   GET /api/stats
// @desc    Get dashboard statistics
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find();

        // 1. Calculate Total Revenue
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

        // 2. Calculate Total Bookings
        const totalBookings = bookings.length;

        // 3. Calculate "Occupancy Rate" (Proxy: Confirmed Bookings count)
        // In a real app, this would be (Occupied Rooms / Total Rooms) * 100
        const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Checked In').length;
        const occupancyRate = (confirmedBookings / 50) * 100; // Assuming 50 rooms total for demo

        // 4. Monthly Revenue (Mock breakdown for chart) - In real app, aggregate by createdAt month
        // We will just distribute the total revenue for demo visualization if not enough data
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = [0, 0, 0, 0, 0, 0]; // Last 6 months

        bookings.forEach(booking => {
            const date = new Date(booking.createdAt);
            const monthDiff = currentMonth - date.getMonth();
            if (monthDiff >= 0 && monthDiff < 6) {
                monthlyRevenue[5 - monthDiff] += booking.totalPrice || 0;
            }
        });

        res.json({
            revenue: totalRevenue,
            bookings: totalBookings,
            occupancy: occupancyRate,
            confirmed: confirmedBookings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
