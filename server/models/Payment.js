import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    amount: {
        type: Number, // Total estimated amount
        required: true
    },
    advanceAmount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Not Started', 'Authorized', 'Captured', 'Voided', 'Refunded', 'Failed'],
        default: 'Not Started'
    },
    transactionId: {
        type: String
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentMethod: {
        type: String, // e.g., 'credit_card'
        default: 'credit_card'
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
