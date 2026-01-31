import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true
    },
    hotelName: {
        type: String,
        default: 'Central Hotel'
    },
    address: {
        type: String,
        default: '123 Main St, Metropolis'
    },
    category: {
        type: String, // e.g., 'Luxury', 'Standard', 'Budget' or Hotel Category
        default: 'Standard'
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Maintenance', 'Cleaning'],
        default: 'Available'
    },
    description: {
        type: String,
        default: 'A comfortable room with all modern amenities.'
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80'
    },
    amenities: [{
        type: String
    }]
}, {
    timestamps: true
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
