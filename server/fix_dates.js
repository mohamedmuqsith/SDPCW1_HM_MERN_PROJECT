
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const fixDates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const bookings = await Booking.find();
        console.log(`Found ${bookings.length} bookings to check/update.`);

        let updatedCount = 0;

        for (const booking of bookings) {
            let changed = false;

            // Check In Date
            const checkIn = new Date(booking.checkIn);
            if (checkIn.getFullYear() !== 2026) {
                checkIn.setFullYear(2026);
                booking.checkIn = checkIn;
                changed = true;
            }

            // Check Out Date
            const checkOut = new Date(booking.checkOut);
            if (checkOut.getFullYear() !== 2026) {
                checkOut.setFullYear(2026);
                booking.checkOut = checkOut;
                changed = true;
            }

            if (changed) {
                await booking.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} bookings to 2026.`);
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixDates();
