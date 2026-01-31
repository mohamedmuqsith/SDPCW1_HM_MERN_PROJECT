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
        type: Date, // Planned Check-in
        required: true
    },
    checkOut: {
        type: Date, // Planned Check-out
        required: true
    },
    actualCheckIn: {
        type: Date // Set at Check-In time
    },
    actualCheckOut: {
        type: Date // Set at Check-Out time
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending Approval', 'Confirmed', 'Checked In', 'Checked Out', 'Rejected', 'Cancelled'],
        default: 'Pending Approval'
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    invoices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    }],
    charges: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now }
    }],
    // Receptionist Workflow Fields
    assignedRoom: {
        type: String  // Physical room number assigned at check-in
    },
    idVerified: {
        type: Boolean,
        default: false
    },
    idVerifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  // Receptionist who verified
    },
    advanceDeposit: {
        type: Number,
        default: 0
    },
    checkInSlipGenerated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
