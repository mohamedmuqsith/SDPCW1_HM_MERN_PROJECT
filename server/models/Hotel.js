import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: 'A premium hotel with state-of-the-art facilities.'
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: '+94 11 234 5678'
    },
    email: {
        type: String,
        default: 'contact@hotel.com'
    },
    starRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 4
    },
    amenities: [{
        type: String
    }],
    images: [{
        type: String
    }]
}, {
    timestamps: true
});

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;
