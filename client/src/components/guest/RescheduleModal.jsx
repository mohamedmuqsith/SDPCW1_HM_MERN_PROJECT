import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const RescheduleModal = ({ isOpen, onClose, booking, onUpdate }) => {
    // Ensure we have valid dates for input value (YYYY-MM-DD)
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().split('T')[0];
    };

    const [checkIn, setCheckIn] = useState(formatDate(booking.checkInRaw || booking.checkIn));
    const [checkOut, setCheckOut] = useState(formatDate(booking.checkOutRaw || booking.checkOut));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token, user } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const bookingId = booking._id || booking.id;
            await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/dates`, {
                checkIn,
                checkOut,
                userId: user._id || user.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Booking Rescheduled Successfully!');
            onUpdate(); // Refresh parent
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reschedule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Reschedule Booking</h2>
                <p className="text-sm text-gray-600 mb-4">Current: {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>

                {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Check-In</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Check-Out</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Confirm Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RescheduleModal;
