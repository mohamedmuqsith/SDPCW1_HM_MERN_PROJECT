import mongoose from 'mongoose';

const roomInventorySchema = new mongoose.Schema({
    hotelName: {
        type: String,
        required: true,
        default: 'Central Hotel'
    },
    roomNumber: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'],
        required: true
    }
}, {
    timestamps: true
});

// CRITICAL: Unique index to prevent 2 bookings for the same room in the same hotel on the same date
roomInventorySchema.index({ hotelName: 1, roomNumber: 1, date: 1 }, { unique: true });

const RoomInventory = mongoose.model('RoomInventory', roomInventorySchema);
export default RoomInventory;
