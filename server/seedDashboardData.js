import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import User from './models/User.js';
import Room from './models/Room.js';
import ServiceRequest from './models/ServiceRequest.js';

dotenv.config();

const seedDashboard = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Get a test user and room
        const user = await User.findOne({ role: 'guest' });
        const rooms = await Room.find();

        if (!user || rooms.length < 3) {
            console.error('Need at least 1 guest and 3 rooms in DB');
            process.exit(1);
        }

        const today = new Date();
        today.setHours(14, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        console.log('Seeding Data...');

        // 2. Pending Approval (Future Booking)
        await Booking.create({
            user: user._id,
            roomName: rooms[0].title || `Room ${rooms[0].number}`,
            roomType: rooms[0].category,
            hotelId: rooms[0].hotelId,
            checkIn: new Date(today.getTime() + 86400000 * 5), // 5 days from now
            checkOut: new Date(today.getTime() + 86400000 * 7),
            totalPrice: 450,
            status: 'PENDING_APPROVAL',
            paymentStatus: 'Pending'
        });
        console.log('✅ Created Pending Booking');

        // 3. Arriving Today (Confirmed)
        await Booking.create({
            user: user._id,
            roomName: rooms[1].title || `Room ${rooms[1].number}`,
            roomType: rooms[1].category,
            hotelId: rooms[1].hotelId,
            checkIn: today, // TODAY
            checkOut: tomorrow,
            totalPrice: 200,
            status: 'CONFIRMED',
            paymentStatus: 'Paid'
        });
        console.log('✅ Created Today\'s Check-In');

        // 4. Leaving Today (Checked In)
        await Booking.create({
            user: user._id,
            roomName: rooms[2].title || `Room ${rooms[2].number}`,
            roomType: rooms[2].category,
            hotelId: rooms[2].hotelId,
            assignedRoom: rooms[2].number,
            checkIn: yesterday,
            checkOut: today, // TODAY
            actualCheckIn: yesterday,
            totalPrice: 300,
            status: 'CHECKED_IN', // Currently in-house, leaving today
            paymentStatus: 'Paid'
        });
        console.log('✅ Created Today\'s Check-Out');

        // 5. Service Request
        // Find the booking we just created for "Leaving Today" or existing one
        const activeBooking = await Booking.findOne({ status: 'CHECKED_IN' });
        if (activeBooking) {
            await ServiceRequest.create({
                user: user._id,
                booking: activeBooking._id,
                roomNumber: activeBooking.assignedRoom || '101',
                type: 'Room Service',
                details: 'Requesting extra pillows please.',
                priority: 'Medium',
                status: 'New'
            });
            console.log('✅ Created New Service Request');
        }

        console.log('DONE! Refresh dashboard.');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedDashboard();
