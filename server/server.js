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
        origin: "http://localhost:5173", // URL of your frontend
        methods: ["GET", "POST"]
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

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Security Headers (COOP/COEP) for Firebase/OAuth
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

// Make io accessible to routes
app.set('io', io);


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
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/cleaner', cleanerRoutes);

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
