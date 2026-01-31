import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please upload a valid email address']
    },
    password: {
        type: String,
        required: false // Optional for Google Login users
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['guest', 'receptionist', 'housekeeping', 'maintenance', 'cleaner', 'staff', 'admin'],
        default: 'guest'
    },
    department: {
        type: String,
        enum: ['Front Desk', 'Housekeeping', 'Maintenance', 'Kitchen', 'Management', 'None'],
        default: 'None'
    },
    avatar: {
        type: String,
        default: function () {
            return `https://ui-avatars.com/api/?name=${this.name}&background=random`;
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
