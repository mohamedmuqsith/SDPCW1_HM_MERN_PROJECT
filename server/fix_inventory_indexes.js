import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RoomInventory from './models/RoomInventory.js';

dotenv.config();

const updateIndexes = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);

        const collection = mongoose.connection.collection('roominventories');

        console.log('Dropping old indexes...');
        try {
            // Attempt to drop the old unique index if it exists
            await collection.dropIndex('roomNumber_1_date_1');
            console.log('✅ Old index dropped.');
        } catch (e) {
            console.log('ℹ️ Old index not found or already gone.');
        }

        console.log('Creating new "Hotel-Aware" index...');
        await collection.createIndex({ hotelName: 1, roomNumber: 1, date: 1 }, { unique: true });
        console.log('✅ New index created: { hotelName: 1, roomNumber: 1, date: 1 }');

        console.log('Database state verified.');
    } catch (error) {
        console.error('❌ Error updating indexes:', error);
    } finally {
        await mongoose.disconnect();
    }
};

updateIndexes();
