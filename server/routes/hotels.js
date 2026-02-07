import express from 'express';
import Hotel from '../models/Hotel.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
router.get('/', async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
        res.json(hotel);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a hotel
// @route   POST /api/hotels
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        res.status(201).json(hotel);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Hotel name already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update a hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
        res.json(hotel);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
        await hotel.deleteOne();
        res.json({ message: 'Hotel removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
