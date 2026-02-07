import express from 'express';
import Booking from '../models/Booking.js';
import ServiceRequest from '../models/ServiceRequest.js';

const router = express.Router();

// @route   GET /api/stats
// @desc    Get dashboard statistics
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find();
        const serviceRequests = await ServiceRequest.find();

        // 1. Calculate Total Revenue
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

        // 2. Calculate Total Bookings
        const totalBookings = bookings.length;

        // 3. Occupancy Rate (Active Bookings)
        const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN').length;
        const occupancyRate = (confirmedBookings / 50) * 100;

        // 4. Guest Preferences (By Room Type)
        const roomTypes = {};
        bookings.forEach(b => {
            const type = b.roomType || 'Standard';
            roomTypes[type] = (roomTypes[type] || 0) + 1;
        });
        const guestPreferences = {
            labels: Object.keys(roomTypes),
            data: Object.values(roomTypes)
        };

        // 5. Service Performance (By Request Type)
        const requestTypes = {
            'Room Service': 0,
            'Transport': 0,
            'Cleaning': 0
        };
        serviceRequests.forEach(sr => {
            if (requestTypes.hasOwnProperty(sr.type)) {
                requestTypes[sr.type]++;
            } else if (sr.type === 'Housekeeping') {
                requestTypes['Cleaning']++;
            }
        });
        const servicePerformance = {
            labels: Object.keys(requestTypes),
            data: Object.values(requestTypes)
        };

        res.json({
            revenue: totalRevenue,
            bookings: totalBookings,
            occupancy: occupancyRate,
            confirmed: confirmedBookings,
            guestPreferences,
            servicePerformance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
