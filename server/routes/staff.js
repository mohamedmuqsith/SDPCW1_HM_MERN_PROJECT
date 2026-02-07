import express from 'express';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// @route   GET /api/staff
// @desc    Get all staff members
router.get('/', async (req, res) => {
    try {
        const staff = await Staff.find().sort({ createdAt: -1 });
        res.json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/staff
// @desc    Add a new staff member
router.post('/', async (req, res) => {
    try {
        const { name, position, department, email, phone, salary, status } = req.body;

        const staffExists = await Staff.findOne({ email });
        if (staffExists) {
            return res.status(400).json({ message: 'Staff with this email already exists' });
        }

        const staff = await Staff.create({
            name,
            position,
            department,
            email,
            phone,
            salary,
            status
        });

        // AUTO-CREATE USER ACCOUNT FOR LOGIN
        // Check if user account already exists (linked to this email)
        const userExists = await User.findOne({ email });

        if (!userExists) {
            await User.create({
                name,
                email,
                password: 'Staff123!', // Default password for new staff
                role: 'STAFF'        // Explicitly set role to staff
            });
        } else {
            // If user exists (e.g. was guest), upgrade role to staff
            userExists.role = 'STAFF';
            await userExists.save();
        }

        await AuditLog.create({
            user: 'Admin',
            action: 'Staff Hired & Account Created',
            details: `Hired ${name} and created login account (Pass: Staff123!)`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.status(201).json({ staff, message: 'Staff created and User account generated with password "Staff123!"' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/staff/:id
// @desc    Update staff details
router.put('/:id', async (req, res) => {
    try {
        const { name, position, department, email, phone, salary, status } = req.body;
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        staff.name = name || staff.name;
        staff.position = position || staff.position;
        staff.department = department || staff.department;
        staff.email = email || staff.email;
        staff.phone = phone || staff.phone;
        staff.salary = salary || staff.salary;
        staff.status = status || staff.status;

        const updatedStaff = await staff.save();
        res.json(updatedStaff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/staff/:id
// @desc    Remove a staff member
router.delete('/:id', async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        await staff.deleteOne();
        res.json({ message: 'Staff member removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
