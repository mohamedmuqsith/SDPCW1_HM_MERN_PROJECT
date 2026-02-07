import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import ServiceRequest from './models/ServiceRequest.js';

dotenv.config();

const verifyStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const totalBookings = await Booking.countDocuments();
        const byStatus = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const checkInsToday = await Booking.find({
            checkIn: { $gte: today, $lt: tomorrow }
        }).select('status checkIn user roomName');

        const checkOutsToday = await Booking.find({
            checkOut: { $gte: today, $lt: tomorrow }
        }).select('status checkOut user roomName');

        const serviceRequests = await ServiceRequest.countDocuments({ status: 'New' });

        console.log('--- DIAGNOSTIC REPORT ---');
        console.log(`Total Bookings: ${totalBookings}`);
        console.log('By Status:', byStatus);
        console.log(`Today (${today.toISOString()}) to Tomorrow (${tomorrow.toISOString()})`);
        console.log(`Bookings checking in today (ALL statuses): ${checkInsToday.length}`);
        checkInsToday.forEach(b => console.log(` - [${b.status}] ${b.roomName} (User: ${b.user})`));

        console.log(`Bookings checking out today (ALL statuses): ${checkOutsToday.length}`);
        checkOutsToday.forEach(b => console.log(` - [${b.status}] ${b.roomName}`));

        console.log(`New Service Requests: ${serviceRequests}`);
        console.log('-------------------------');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyStatus();
