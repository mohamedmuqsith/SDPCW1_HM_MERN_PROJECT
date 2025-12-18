import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomName: {
        type: String,
        required: true
    },
    roomType: {
        type: String,
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Checked In', 'Checked Out'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
