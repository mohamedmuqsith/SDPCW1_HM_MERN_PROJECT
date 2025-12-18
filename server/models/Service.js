import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Dining', 'Wellness', 'Transport', 'Housekeeping', 'Other'],
        default: 'Other'
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    available: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
    }
}, {
    timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;
