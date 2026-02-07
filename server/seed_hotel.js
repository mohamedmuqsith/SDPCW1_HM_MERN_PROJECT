import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from './models/Hotel.js';

dotenv.config();

const seedHotel = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');

        const existing = await Hotel.findOne({ name: 'Central Hotel' });
        if (existing) {
            console.log('Central Hotel already exists in registry.');
        } else {
            const hotel = new Hotel({
                name: 'Central Hotel',
                address: '123 Main St, Metropolis',
                description: 'The flagship property centrally located for business and leisure.',
                phone: '+94 11 000 0000',
                email: 'central@smartstay.com',
                starRating: 5
            });
            await hotel.save();
            console.log('Central Hotel seeded successfully!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Seeding failed:', error);
    }
};

seedHotel();
