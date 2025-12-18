import express from 'express';
import Service from '../models/Service.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// @route   GET /api/services
// @desc    Get all services
router.get('/', async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/services
// @desc    Add a new service
router.post('/', async (req, res) => {
    try {
        const { name, category, price, description, available } = req.body;

        const service = await Service.create({
            name,
            category,
            price,
            description,
            available
        });

        await AuditLog.create({
            user: 'Admin', // In real app, get from req.user
            action: 'Add Service',
            details: `Added service: ${name}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.status(201).json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/services/:id
// @desc    Update service details
router.put('/:id', async (req, res) => {
    try {
        const { name, category, price, description, available } = req.body;
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        service.name = name || service.name;
        service.category = category || service.category;
        service.price = price || service.price;
        service.description = description || service.description;
        service.available = available !== undefined ? available : service.available;

        const updatedService = await service.save();

        await AuditLog.create({
            user: 'Admin',
            action: 'Update Service',
            details: `Updated service: ${updatedService.name}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/services/:id
// @desc    Delete a service
router.delete('/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await service.deleteOne();

        await AuditLog.create({
            user: 'Admin',
            action: 'Delete Service',
            details: `Deleted service: ${service.name}`,
            ipAddress: req.ip || '127.0.0.1'
        });

        res.json({ message: 'Service removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
