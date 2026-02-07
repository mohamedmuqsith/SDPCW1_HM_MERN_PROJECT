import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// --- MOCK GATEWAY FOR SMS/EMAIL ---
export const sendExternalAlert = async (user, message, type = 'info') => {
    try {
        const timestamp = new Date().toISOString();
        const contact = user.email || user.phone || 'No Contact';

        // Simulate External API Delay
        // await new Promise(resolve => setTimeout(resolve, 100));

        console.log(`\n[EXTERNAL ALERT GATEWAY]`);
        console.log(`To: ${user.name} (${contact})`);
        console.log(`Channel: ${type.toUpperCase() === 'URGENT' ? 'SMS & Email' : 'Email'}`);
        console.log(`Message: "${message}"`);
        console.log(`Time: ${timestamp}`);
        console.log(`[STATUS: SENT]\n`);

        return true;
    } catch (error) {
        console.error('[EXTERNAL ALERT FAILED]', error);
        return false;
    }
};

// @route   GET /api/notifications
// @desc    Get user notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Not found' });

        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/notifications/process-queue
// @desc    Worker Simulation: Process PENDING notifications
router.post('/process-queue', async (req, res) => {
    try {
        const pending = await Notification.find({ status: 'PENDING' }).limit(10);
        const results = [];

        for (const notif of pending) {
            try {
                // SIMULATE SENDING (Email/SMS/Push)
                console.log(`[WORKER] Sending to User ${notif.user}: ${notif.message} (Event: ${notif.eventKey})`);

                notif.status = 'SENT';
                await notif.save();
                results.push({ id: notif._id, status: 'SENT' });
            } catch (err) {
                notif.status = 'FAILED';
                notif.retryCount += 1;
                await notif.save();
                results.push({ id: notif._id, status: 'FAILED', error: err.message });
            }
        }

        res.json({ processed: results.length, details: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Worker Error' });
    }
});

export default router;
