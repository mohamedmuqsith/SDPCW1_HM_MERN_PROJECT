import express from 'express';
import Shift from '../models/Shift.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/shifts
// @desc    Get all shifts (Admin) or My Shifts (Staff)
// @access  Protected
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        // Staff can only see their own shifts unless they are admin/receptionist
        if (req.user.role === 'staff' || req.user.role === 'housekeeping' || req.user.role === 'maintenance') {
            query.staffId = req.user._id;
        }

        const shifts = await Shift.find(query).sort({ startTime: 1 });
        res.json(shifts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/shifts
// @desc    Create a new shift
// @access  Admin, Receptionist
router.post('/', protect, authorize('admin', 'receptionist'), async (req, res) => {
    try {
        const { staffId, startTime, endTime, location, notes } = req.body;

        const staff = await User.findById(staffId);
        if (!staff) return res.status(404).json({ message: 'Staff not found' });

        const shift = await Shift.create({
            staffId,
            staffName: staff.name,
            role: staff.role,
            startTime,
            endTime,
            location,
            notes
        });

        res.status(201).json(shift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/shifts/:id
// @desc    Delete a shift
// @access  Admin, Receptionist
router.delete('/:id', protect, authorize('admin', 'receptionist'), async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: 'Shift not found' });

        await shift.deleteOne();
        res.json({ message: 'Shift removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
