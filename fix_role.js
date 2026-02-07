import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';

dotenv.config({ path: './server/.env' });

const fixUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ name: 'Mohamed Mukshith' });
        if (user) {
            console.log(`Found user: ${user.name}, Role: ${user.role}, Email: ${user.email}`);
            user.role = 'GUEST';
            await user.save();
            console.log(`UPDATED user ${user.name} to role: GUEST`);
        } else {
            console.log('User Mohamed Mukshith not found.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

fixUser();
