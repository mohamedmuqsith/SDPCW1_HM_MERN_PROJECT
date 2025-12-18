import express from 'express';
import ServiceRequest from '../models/ServiceRequest.js';
import Notification from '../models/Notification.js'; // Auto-notify on request
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// @route   POST /api/service-requests
// @desc    Create a service request
router.post('/', async (req, res) => {
    try {
        const { userId, type, details, roomNumber } = req.body;

        const request = await ServiceRequest.create({
            user: userId,
            type,
            details,
            roomNumber
        });

        // Create System Notification
        await Notification.create({
            user: userId,
            message: `Service Request Received: ${type}`,
            type: 'service'
        });

        await AuditLog.create({
            user: userId || 'Guest',
            action: 'Service Request',
            details: `Requested ${type}: ${details}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/service-requests
// @desc    Get all requests (Admin) or User requests
router.get('/', async (req, res) => {
    try {
        const { userId, role } = req.query;

        let requests;
        if (role === 'admin' || role === 'staff') {
            requests = await ServiceRequest.find().populate('user', 'name email').sort({ createdAt: -1 });
        } else if (userId) {
            requests = await ServiceRequest.find({ user: userId }).sort({ createdAt: -1 });
        } else {
            return res.status(400).json({ message: 'User ID or Role required' });
        }

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/service-requests/:id
// @desc    Update status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await ServiceRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Not Found' });

        request.status = status;
        await request.save();

        if (status === 'Completed' || status === 'In Progress') {
            await Notification.create({
                user: request.user,
                message: `Your ${request.type} request is now ${status}`,
                type: 'service'
            });
        }

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
