import { useState, useEffect } from 'react';
import { Loader2, Trash2, CheckCircle, XCircle, Edit2 } from 'lucide-react';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBooking, setEditingBooking] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Checkout Modal State
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [checkoutBooking, setCheckoutBooking] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState('');

    // Service Charge Modal
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceBooking, setServiceBooking] = useState(null);
    const [serviceDesc, setServiceDesc] = useState('');
    const [serviceAmount, setServiceAmount] = useState('');



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

    const handleApprove = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                fetchBookings();
            } else {
                alert('Failed to approve booking');
            }
        } catch (error) {
            console.error('Approval Error:', error);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this booking?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${id}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                fetchBookings();
            } else {
                alert('Failed to reject booking');
            }
        } catch (error) {
            console.error('Rejection Error:', error);
        }
    };

    const handleCheckIn = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${id}/checkin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                fetchBookings();
            } else {
                alert('Failed to check in guest');
            }
        } catch (error) {
            console.error('Check-in Error:', error);
        }
    };

    const handleCheckOutClick = (booking) => {
        setCheckoutBooking(booking);
        // Default to remaining balance
        const advance = booking.payment?.advanceAmount || 0;
        const due = booking.totalPrice - advance;
        setPaidAmount(due > 0 ? due.toString() : '0');
        setIsCheckoutModalOpen(true);
    };

    const submitCheckOut = async () => {
        if (!checkoutBooking) return;

        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${checkoutBooking._id}/checkout`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethod,
                    paidAmount: Number(paidAmount)
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Check-out Complete!\nReceipt Generated.\nPaid: $${data.receipt.amountPaid}`);
                setIsCheckoutModalOpen(false);
                setCheckoutBooking(null);
                fetchBookings();
            } else {
                alert(`Check-out Failed: ${data.message}\n(${data.financials ? 'Balance: $' + data.financials.remainingBalance : ''})`);
            }
        } catch (error) {
            console.error('Check-out Error:', error);
            alert('Server Error during checkout.');
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
                                            ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'PENDING_APPROVAL' ? 'bg-blue-100 text-blue-800' :
                                                    booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-slate-100 text-slate-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-2">
                                            {/* APPROVAL WORKFLOW ACTIONS */}
                                            {booking.status === 'PENDING_APPROVAL' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(booking._id)}
                                                        className="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 mr-1"
                                                        title="Confirm Booking"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(booking._id)}
                                                        className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"
                                                        title="Reject Booking"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {/* CHECK-IN ACTION */}
                                            {booking.status === 'CONFIRMED' && (
                                                <button
                                                    onClick={() => handleCheckIn(booking._id)}
                                                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 mr-1"
                                                    title="Mark as Checked In"
                                                >
                                                    Check In
                                                </button>
                                            )}

                                            {/* CHECK-OUT ACTION */}
                                            {booking.status === 'CHECKED_IN' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAddServiceClick(booking)}
                                                        className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 mr-1"
                                                        title="Add Extra Charge"
                                                    >
                                                        + Charge
                                                    </button>
                                                    <button
                                                        onClick={() => handleCheckOutClick(booking)}
                                                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 mr-1"
                                                        title="Check Out & Bill"
                                                    >
                                                        Check Out
                                                    </button>
                                                </>
                                            )}

                                            {/* EXISTING EDIT/DELETE ACTIONS */}
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
                                    <option value="PENDING_APPROVAL">Pending Approval</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="CHECKED_IN">Checked In</option>
                                    <option value="CHECKED_OUT">Checked Out</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="CANCELLED">Cancelled</option>
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

            {/* CHECKOUT MODAL */}
            {isCheckoutModalOpen && checkoutBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Final Breakdown & Payment</h3>

                        <div className="bg-slate-50 p-4 rounded-lg mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Room Charge:</span>
                                <span className="font-medium">${checkoutBooking.totalPrice}</span>
                            </div>
                            {/* Show Services Breakdown */}
                            {checkoutBooking.charges && checkoutBooking.charges.map((charge, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-600 pl-2 border-l-2 border-slate-200">
                                    <span>{charge.description}</span>
                                    <span>+${charge.amount}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-1 mt-1">
                                <span>Total Bill:</span>
                                <span>${
                                    checkoutBooking.totalPrice +
                                    (checkoutBooking.charges ? checkoutBooking.charges.reduce((sum, item) => sum + item.amount, 0) : 0)
                                }</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Advance Paid:</span>
                                <span className="font-medium text-green-600">-${checkoutBooking.payment?.advanceAmount || 0}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-lg">
                                <span>Balance Due:</span>
                                <span>${
                                    (checkoutBooking.totalPrice +
                                        (checkoutBooking.charges ? checkoutBooking.charges.reduce((sum, item) => sum + item.amount, 0) : 0)) -
                                    (checkoutBooking.payment?.advanceAmount || 0)
                                }</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card_machine">Card Machine (POS)</option>
                                    <option value="online_transfer">Online Transfer</option>
                                    <option value="card_on_file">Authorized Card (On File)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount Collecting Now</label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    className="w-full border rounded-lg p-2 text-right font-mono"
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <button
                                onClick={submitCheckOut}
                                disabled={
                                    (checkoutBooking.totalPrice +
                                        (checkoutBooking.charges ? checkoutBooking.charges.reduce((sum, item) => sum + item.amount, 0) : 0)) -
                                    (checkoutBooking.payment?.advanceAmount || 0) - Number(paidAmount) > 0
                                }
                                className={`w-full py-3 rounded-lg font-bold text-white
                                    ${(checkoutBooking.totalPrice + (checkoutBooking.charges ? checkoutBooking.charges.reduce((sum, item) => sum + item.amount, 0) : 0)) - (checkoutBooking.payment?.advanceAmount || 0) - Number(paidAmount) > 0
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {(checkoutBooking.totalPrice + (checkoutBooking.charges ? checkoutBooking.charges.reduce((sum, item) => sum + item.amount, 0) : 0)) - (checkoutBooking.payment?.advanceAmount || 0) - Number(paidAmount) > 0
                                    ? `Balance Remaining`
                                    : 'Complete Check-Out'
                                }
                            </button>
                            <button
                                onClick={() => setIsCheckoutModalOpen(false)}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* SERVICE CHARGE MODAL */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-xl font-bold mb-4">Add Service Charge</h3>
                        <form onSubmit={submitServiceCharge} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={serviceDesc}
                                    onChange={(e) => setServiceDesc(e.target.value)}
                                    placeholder="e.g., Room Service, Laundry"
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    value={serviceAmount}
                                    onChange={(e) => setServiceAmount(e.target.value)}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold"
                                >
                                    Add Charge
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsServiceModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* SERVICE CHARGE MODAL */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-xl font-bold mb-4">Add Service Charge</h3>
                        <form onSubmit={submitServiceCharge} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={serviceDesc}
                                    onChange={(e) => setServiceDesc(e.target.value)}
                                    placeholder="e.g., Room Service, Laundry"
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    value={serviceAmount}
                                    onChange={(e) => setServiceAmount(e.target.value)}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold"
                                >
                                    Add Charge
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsServiceModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg"
                                >
                                    Cancel
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
