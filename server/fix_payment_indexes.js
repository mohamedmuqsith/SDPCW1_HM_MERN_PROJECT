import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('payments');

        console.log('Dropping idempotencyKey_1 index...');
        try {
            await collection.dropIndex('idempotencyKey_1');
            console.log('Index dropped successfully');
        } catch (err) {
            console.log('Index might not exist or already dropped:', err.message);
        }

        console.log('Closing connection...');
        await mongoose.disconnect();
        console.log('Done');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixIndexes();
