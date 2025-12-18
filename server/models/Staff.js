import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true,
        default: 'General'
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'On Leave', 'Terminated'],
        default: 'Active'
    },
    joinDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
