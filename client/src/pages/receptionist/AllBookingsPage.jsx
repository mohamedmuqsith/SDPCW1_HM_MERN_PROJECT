import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, DollarSign, Check, X, Clock, UserCheck, LogOut, BedDouble } from 'lucide-react';
import AllocationModal from '../../components/receptionist/AllocationModal';

const AllBookingsPage = () => {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

    const fetchBookings = async () => {
        try {
            const url = filter === 'all'
                ? 'http://localhost:5000/api/receptionist/bookings'
                : `http://localhost:5000/api/receptionist/bookings?status=${filter}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
        if (token) fetchBookings();
    }, [token, filter]);

    const handleAllocateClick = (booking) => {
        setSelectedBooking(booking);
        setIsAllocationModalOpen(true);
    };

    const handleAllocationSubmit = async (bookingId, roomNumber) => {
        try {
            const response = await fetch(`http://localhost:5000/api/receptionist/bookings/${bookingId}/allocate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roomNumber })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`✓ Room ${roomNumber} allocated successfully!`);
                setIsAllocationModalOpen(false);
                fetchBookings();
            } else {
                alert(`✗ Failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Allocation error:', error);
            alert('Failed to connect to server');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING_APPROVAL': return 'bg-orange-100 text-orange-700';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
            case 'CHECKED_IN': return 'bg-green-100 text-green-700';
            case 'CHECKED_OUT': return 'bg-slate-100 text-slate-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING_APPROVAL': return <Clock size={14} />;
            case 'CONFIRMED': return <Check size={14} />;
            case 'CHECKED_IN': return <UserCheck size={14} />;
            case 'CHECKED_OUT': return <LogOut size={14} />;
            case 'REJECTED': return <X size={14} />;
            default: return null;
        }
    };

    const statusFilters = [
        { value: 'all', label: 'All' },
        { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'CHECKED_IN', label: 'Checked In' },
        { value: 'CHECKED_OUT', label: 'Checked Out' },
        { value: 'REJECTED', label: 'Rejected' }
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                    <Calendar className="w-8 h-8 mr-3 text-slate-700" />
                    All Bookings
                </h1>
                <p className="text-slate-500">Complete booking history and management</p>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {statusFilters.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setFilter(s.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === s.value
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Guest</th>
                                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Room</th>
                                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Dates</th>
                                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">Loading...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">No bookings found.</td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                                    {booking.user?.name?.charAt(0) || 'G'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{booking.user?.name || 'Guest'}</p>
                                                    <p className="text-xs text-slate-400">{booking.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium">{booking.assignedRoom || booking.roomName}</span>
                                            <p className="text-xs text-slate-400">{booking.roomType}</p>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center text-slate-600">
                                                <Calendar size={14} className="mr-1" />
                                                {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-bold text-green-600">${booking.totalPrice}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {(booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
                                                <button
                                                    onClick={() => handleAllocateClick(booking)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Allocate Room"
                                                >
                                                    <BedDouble size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AllocationModal
                isOpen={isAllocationModalOpen}
                onClose={() => setIsAllocationModalOpen(false)}
                booking={selectedBooking}
                onAllocate={handleAllocationSubmit}
            />
        </div>
    );
};

export default AllBookingsPage;
