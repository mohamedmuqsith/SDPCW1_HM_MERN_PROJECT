
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const roomSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['Available', 'Occupied', 'Maintenance', 'Cleaning'], default: 'Available' },
    description: { type: String },
    image: { type: String },
    amenities: [{ type: String }],
    hotelName: { type: String },
    address: { type: String },
    category: { type: String }
});

const Room = mongoose.model('Room', roomSchema);

// Seed 5 Hotels with distinct data
const hotels = [
    { name: 'Central Hotel', address: '123 Main St, Metropolis', city: 'Metropolis', rating: 4.5 },
    { name: 'Grand Plaza Resort', address: '456 Ocean Dr, Seaside', city: 'Seaside', rating: 5.0 },
    { name: 'Urban Inn', address: '789 Downtown Ave, City Center', city: 'City Center', rating: 4.2 },
    { name: 'Mountain View Lodge', address: '101 Hilltop Rd, Highlands', city: 'Highlands', rating: 4.7 },
    { name: 'Lakeside Retreat', address: '202 Lake Ln, Watertown', city: 'Watertown', rating: 4.8 }
];

const roomTypes = [
    { type: 'Single', price: 100, amenities: ['Wifi', 'TV'] },
    { type: 'Double', price: 150, amenities: ['Wifi', 'TV', 'Coffee'] },
    { type: 'Deluxe', price: 250, amenities: ['Wifi', 'TV', 'Coffee', 'AC', 'Mini-bar'] },
    { type: 'Suite', price: 400, amenities: ['Wifi', 'TV', 'Coffee', 'AC', 'Mini-bar', 'Jacuzzi'] }
];

const seedHotels = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected via seedHotels');

        // Optional: Clear existing rooms to avoid duplicates/confusion
        await Room.deleteMany({});
        console.log('Cleared existing rooms.');

        let createdCount = 0;

        for (const hotel of hotels) {
            // Create 3-5 rooms per hotel
            const numRooms = 4;
            for (let i = 1; i <= numRooms; i++) {
                const roomType = roomTypes[i - 1] || roomTypes[0]; // Rotate types

                // Generate room number: 101, 102... 201, 202... based on hotel index
                const hotelPrefix = (hotels.indexOf(hotel) + 1) * 100;
                const roomNum = hotelPrefix + i;

                const newRoom = new Room({
                    number: roomNum.toString(),
                    type: roomType.type,
                    price: roomType.price,
                    status: 'Available',
                    description: `A beautiful ${roomType.type} room at ${hotel.name}.`,
                    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop',
                    amenities: roomType.amenities,
                    hotelName: hotel.name,
                    address: hotel.address,
                    category: 'Standard' // or map from type
                });

                await newRoom.save();
                createdCount++;
            }
        }

        console.log(`Successfully seeded ${createdCount} rooms across ${hotels.length} hotels.`);
        process.exit();
    } catch (error) {
        console.error('Error seeding hotels:', error);
        process.exit(1);
    }
};

seedHotels();
