import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import RoomInventory from './models/RoomInventory.js';

dotenv.config();

const reset = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('Clearing all Bookings...');
        await Booking.deleteMany({});

        console.log('Clearing all Room Inventory records...');
        await RoomInventory.deleteMany({});

        console.log('✅ System Reset Successful. All booking data cleared.');
    } catch (error) {
        console.error('❌ Reset Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

reset();
