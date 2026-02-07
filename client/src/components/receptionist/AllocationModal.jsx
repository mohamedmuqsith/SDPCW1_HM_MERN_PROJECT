import { useState } from 'react';
import { X, Check, BedDouble } from 'lucide-react';

const AllocationModal = ({ isOpen, onClose, booking, onAllocate }) => {
    const [roomNumber, setRoomNumber] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !booking) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onAllocate(booking._id, roomNumber);
        setLoading(false);
        setRoomNumber('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <BedDouble className="text-blue-500" /> Allocate Room
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-800 font-medium">Booking Details</p>
                        <p className="text-gray-700 font-bold mt-1">{booking.user?.name || 'Guest'}</p>
                        <p className="text-gray-500 text-sm">{booking.roomType} • {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>
                        <p className="text-gray-500 text-sm mt-1">Current: <span className="font-semibold text-gray-800">{booking.assignedRoom || booking.roomName}</span></p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Room Number</label>
                            <input
                                type="text"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                placeholder="e.g. 101, 205..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">Enter the room number to assign to this guest.</p>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {loading ? 'Allocating...' : <><Check size={16} /> Allocate Room</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AllocationModal;
