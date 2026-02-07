import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RoomInventory from './models/RoomInventory.js';

dotenv.config();

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const inventory = await RoomInventory.find().sort({ roomNumber: 1, date: 1 });
        console.log('--- Room Inventory State ---');
        inventory.forEach(item => {
            console.log(`${item.roomNumber} | ${item.date.toISOString().split('T')[0]} | ${item.status} | Booking: ${item.bookingId}`);
        });
        console.log('Total Records:', inventory.length);
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

inspect();
