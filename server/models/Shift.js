import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    staffName: {
        type: String, // Denormalized for simpler queries
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: 'General' // e.g., 'Front Desk', 'Kitchen', 'Floor 3'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
