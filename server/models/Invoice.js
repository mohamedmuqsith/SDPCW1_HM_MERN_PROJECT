import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    type: {
        type: String,
        enum: ['Proforma', 'Final'],
        required: true
    },
    items: [{
        description: String,
        amount: Number,
        quantity: {
            type: Number,
            default: 1
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    // Payment & Status Tracking
    status: {
        type: String,
        enum: ['Draft', 'Issued', 'Paid', 'Cancelled'],
        default: 'Draft'
    },
    paidAt: {
        type: Date
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  // Receptionist who processed payment
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    taxRate: {
        type: Number,
        default: 0.08  // 8% default tax rate
    },
    issueDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
