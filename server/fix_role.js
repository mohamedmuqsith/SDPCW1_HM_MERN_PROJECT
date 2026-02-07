import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const fixUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Fix logic: Find by name OR email if unsure
        const user = await User.findOne({
            $or: [
                { name: 'Mohamed Mukshith' },
                { email: { $regex: 'mukshith', $options: 'i' } } // Fallback broad search
            ]
        });

        if (user) {
            console.log(`Found user: ${user.name}, Role: ${user.role}, Email: ${user.email}`);

            // Force update to GUEST
            // Using updateOne to bypass any potential schema validation issues temporarily if needed, but save() is better
            user.role = 'GUEST';
            await user.save();

            console.log(`SUCCESS: Updated user ${user.name} to role: GUEST`);
        } else {
            console.log('User Mohamed Mukshith not found.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

fixUser();
