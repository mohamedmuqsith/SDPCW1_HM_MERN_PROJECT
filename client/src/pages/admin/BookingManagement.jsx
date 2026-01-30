import { useState, useEffect } from 'react';
import { Loader2, Trash2, CheckCircle, XCircle, Edit2 } from 'lucide-react';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBooking, setEditingBooking] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchBookings = async () => {
        try {
            // For admin, we fetch all bookings
            const response = await fetch('http://localhost:5000/api/bookings?role=admin');
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Refresh list or update local state
                fetchBookings();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const deleteBooking = async (id) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchBookings();
            }
        } catch (error) {
            console.error('Failed to delete booking:', error);
        }
    };

    const handleEditClick = (booking) => {
        setEditingBooking({ ...booking });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${editingBooking._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingBooking)
            });

            if (response.ok) {
                fetchBookings();
                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error('Failed to update booking:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Booking Management</h3>
                <div className="flex gap-2">
                    <button onClick={fetchBookings} className="text-slate-500 hover:text-slate-700 text-sm font-medium">Refresh</button>
                    <button className="text-slate-500 hover:text-slate-700 text-sm font-medium">Export</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Booking ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    No bookings found.
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                                        {booking._id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{booking.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">{booking.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {booking.roomName} <span className="text-xs text-slate-400">({booking.roomType})</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(booking.checkIn).toLocaleDateString('en-GB')} - {new Date(booking.checkOut).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-2">
                                            {booking.status === 'Pending' && (
                                                <button
                                                    onClick={() => updateStatus(booking._id, 'Confirmed')}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Confirm"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {booking.status !== 'Cancelled' && (
                                                <button
                                                    onClick={() => updateStatus(booking._id, 'Cancelled')}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Cancel"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditClick(booking)}
                                                className="text-blue-600 hover:text-blue-900 ml-2"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteBooking(booking._id)}
                                                className="text-red-400 hover:text-red-600 ml-2"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Booking</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Room Name</label>
                                <input
                                    type="text"
                                    value={editingBooking.roomName}
                                    onChange={(e) => setEditingBooking({ ...editingBooking, roomName: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Total Price ($)</label>
                                <input
                                    type="number"
                                    value={editingBooking.totalPrice}
                                    onChange={(e) => setEditingBooking({ ...editingBooking, totalPrice: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">Update manually if you change dates.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Check-in</label>
                                    <input
                                        type="date"
                                        value={editingBooking.checkIn.split('T')[0]}
                                        onChange={(e) => setEditingBooking({ ...editingBooking, checkIn: e.target.value })}
                                        className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Check-out</label>
                                    <input
                                        type="date"
                                        value={editingBooking.checkOut.split('T')[0]}
                                        onChange={(e) => setEditingBooking({ ...editingBooking, checkOut: e.target.value })}
                                        className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={editingBooking.status}
                                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Checked In">Checked In</option>
                                    <option value="Checked Out">Checked Out</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

console.log("Component loaded");
export default BookingManagement;
