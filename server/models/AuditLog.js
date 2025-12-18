import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    status: {
        type: String, // 'Success', 'Failed'
        default: 'Success'
    },
    ipAddress: {
        type: String,
        default: '127.0.0.1'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
