import express from 'express';
import Room from '../models/Room.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms (Public)
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.find().sort({ number: 1 });
        res.json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/rooms/:id
// @desc    Get single room
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/rooms
// @desc    Add a new room (Admin)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { number, type, price, status, description } = req.body;

        const roomExists = await Room.findOne({ number });
        if (roomExists) {
            return res.status(400).json({ message: 'Room number already exists' });
        }


        const image = req.file ? `/uploads/rooms/${req.file.filename}` : req.body.image;

        const room = await Room.create({
            number,
            type,
            price,
            status,
            description,
            image
        });

        res.status(201).json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/rooms/:id
// @desc    Update a room (Admin)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { number, type, price, status, description } = req.body;
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        room.number = number || room.number;
        room.type = type || room.type;
        room.price = price || room.price;
        room.status = status || room.status;
        room.description = description || room.description;
        if (req.file) {
            room.image = `/uploads/rooms/${req.file.filename}`;
        } else {
            room.image = req.body.image || room.image;
        }

        const updatedRoom = await room.save();
        res.json(updatedRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        await room.deleteOne();
        res.json({ message: 'Room removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
