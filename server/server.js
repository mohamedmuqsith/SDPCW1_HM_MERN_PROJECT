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
import receptionistRoutes from './routes/receptionist.js';
import cleanerRoutes from './routes/cleaner.js';
import shiftRoutes from './routes/shifts.js';
import hotelRoutes from './routes/hotels.js';
import './models/Payment.js'; // Ensure Payment model is registered


import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Allow both localhost variants
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    // console.log('New client connected:', socket.id); // Reduced log noise

    socket.on('disconnect', (reason) => {
        // console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ... (socket setup)

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false, // Disable COEP to allow external resources (maps, firebase) without CORP issues
}));

// Rate Limiting (Prevent Brute Force)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for development
    message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Make io accessible to routes
app.set('io', io);


import { protect, authorize } from './middleware/authMiddleware.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hotels', hotelRoutes);

// Protected Staff/Admin Routes
app.use('/api/staff', protect, authorize('ADMIN'), staffRoutes);
app.use('/api/stats', protect, authorize('ADMIN', 'RECEPTIONIST'), statsRoutes);
app.use('/api/reports', protect, authorize('ADMIN'), reportRoutes);
app.use('/api/receptionist', protect, authorize('ADMIN', 'RECEPTIONIST'), receptionistRoutes);
app.use('/api/cleaner', protect, authorize('ADMIN', 'CLEANER', 'HOUSEKEEPING'), cleanerRoutes);
app.use('/api/shifts', protect, authorize('ADMIN', 'RECEPTIONIST'), shiftRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.send('Hotel Management System API is running...');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
