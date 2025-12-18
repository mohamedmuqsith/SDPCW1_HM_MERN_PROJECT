import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import statsRoutes from './routes/stats.js';
import roomRoutes from './routes/rooms.js';
import staffRoutes from './routes/staff.js';
import reportRoutes from './routes/reports.js';
import serviceRoutes from './routes/services.js';
import serviceRequestRoutes from './routes/serviceRequests.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/notifications', notificationRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.send('Hotel Management System API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
