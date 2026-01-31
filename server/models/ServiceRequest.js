import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Staff Member
    },
    type: {
        type: String, // 'Cleaning', 'Room Service', 'Tech Support', 'Transport', 'Other Inquiry'
        required: true
    },
    department: {
        type: String,
        enum: ['Front Desk', 'Housekeeping', 'Maintenance', 'Kitchen', 'Management'],
        default: 'Front Desk'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Emergency'],
        default: 'Medium'
    },
    details: {
        type: String,
        required: true
    },
    preferredTime: {
        type: String // e.g., "10:30 AM"
    },
    status: {
        type: String,
        enum: ['New', 'Assigned', 'In Progress', 'Completed', 'Cancelled'],
        default: 'New'
    },
    roomNumber: {
        type: String
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dueAt: {
        type: Date
    },
    notes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    resolutionNotes: String,
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Pre-save hook to set Department and Due Date
serviceRequestSchema.pre('save', function (next) {
    // Auto-assign Department based on Type
    if (this.isModified('type')) {
        switch (this.type) {
            case 'Room Service': this.department = 'Kitchen'; break;
            case 'Housekeeping':
            case 'Cleaning': this.department = 'Housekeeping'; break;
            case 'Tech Support': this.department = 'Maintenance'; break;
            default: this.department = 'Front Desk';
        }
    }

    // Auto-calculate SLA (Due Date)
    if (this.isNew || this.isModified('priority')) {
        const now = new Date();
        let minutesToAdd = 60; // Default Standard

        switch (this.priority) {
            case 'Emergency': minutesToAdd = 10; break;
            case 'High': minutesToAdd = 30; break;
            case 'Medium': minutesToAdd = 60; break;
            case 'Low': minutesToAdd = 120; break;
        }
        this.dueAt = new Date(now.getTime() + minutesToAdd * 60000);
    }

    next();
});

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export default ServiceRequest;
