import express from 'express';
import Room from '../models/Room.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms (Public) - Optional Availability Filter
router.get('/', async (req, res) => {
    try {
        const { checkIn, checkOut, hotel, type } = req.query;
        let query = {};

        // 1. Basic Filters
        if (type && type !== 'All') {
            query.type = type;
        }
        // Note: 'hotel' filter might need 'hotelId' or 'hotelName' on Room model.
        // Assuming 'hotelName' exists or we filter post-fetch if mapped dynamically.

        // 2. Availability Filter
        let unavailableRoomIds = [];
        if (checkIn && checkOut) {
            const Booking = (await import('../models/Booking.js')).default;

            // Find bookings that overlap with requested dates
            // STATUS: Exclude Cancelled, Rejected, Checked Out? 
            // Actually, Checked Out rooms are available, but strictly speaking looking at *future* overlap.
            // A 'Checked Out' booking is in the past relative to its dates usually, but let's just check overlap logic.
            // Overlap: (StartA < EndB) && (EndA > StartB)

            const start = new Date(checkIn);
            const end = new Date(checkOut);

            const busyBookings = await Booking.find({
                status: { $nin: ['CANCELLED', 'REJECTED'] },
                $or: [
                    {
                        checkIn: { $lt: end },
                        checkOut: { $gt: start }
                    }
                ]
            }).select('roomName');

            // Extract room numbers/names from busy bookings
            // Optimization: If Room model has 'number' and Booking has 'roomName' = "Room " + number
            // We need to match them.
            unavailableRoomIds = busyBookings.map(b => b.roomName);
            // This is a string matching strategy. Ideally we'd use IDs. 
            // Existing 'Room' model uses 'number'. 'Booking' uses 'roomName' (e.g. "Room 101").
            // We'll filter via the 'number' field on the Room model.
        }

        const rooms = await Room.find(query).sort({ number: 1 });

        // Filter availability in memory if dates provided
        const availableRooms = rooms.filter(room => {
            if (unavailableRoomIds.length > 0) {
                const roomName = `Room ${room.number}`;
                // If this room name is in the busy list, it's unavailable
                if (unavailableRoomIds.includes(roomName)) return false;
            }
            // Also filter by hotel if provided and strictly matching property
            if (hotel && room.hotelName && room.hotelName !== hotel) return false;

            return true;
        });

        res.json(availableRooms);
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
