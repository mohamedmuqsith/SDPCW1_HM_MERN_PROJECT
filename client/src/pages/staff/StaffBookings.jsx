import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, LogIn, LogOut, Calendar, User, AlertCircle } from 'lucide-react';

const StaffBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // Track which booking is being actioned
    const { user } = useAuth();

    const fetchBookings = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/bookings?role=staff');
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

    const handleCheckIn = async (bookingId) => {
        setActionLoading(bookingId);
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/checkin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffEmail: user?.email || 'Staff' })
            });

            if (response.ok) {
                fetchBookings(); // Refresh list
            } else {
                const data = await response.json();
                alert(data.message || 'Check-in failed.');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            alert('Something went wrong during check-in.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckOut = async (bookingId) => {
        setActionLoading(bookingId);
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/checkout`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffEmail: user?.email || 'Staff' })
            });

            if (response.ok) {
                fetchBookings(); // Refresh list
            } else {
                const data = await response.json();
                alert(data.message || 'Check-out failed.');
            }
        } catch (error) {
            console.error('Check-out error:', error);
            alert('Something went wrong during check-out.');
        } finally {
            setActionLoading(null);
        }
    };

    // Helper to check if check-in is allowed
    // Simplified: any Confirmed booking can be checked in (no date restriction for flexibility)
    const canCheckIn = (booking) => {
        return booking.status === 'Confirmed';
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Confirmed': 'bg-blue-100 text-blue-800',
            'Checked In': 'bg-green-100 text-green-800',
            'Checked Out': 'bg-slate-100 text-slate-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        return styles[status] || 'bg-slate-100 text-slate-800';
    };

    // Filter to show only actionable bookings (Confirmed or Checked In)
    const actionableBookings = bookings.filter(b =>
        b.status === 'Confirmed' || b.status === 'Checked In'
    );
    const otherBookings = bookings.filter(b =>
        b.status !== 'Confirmed' && b.status !== 'Checked In'
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Guest Check-In / Check-Out</h1>
                <p className="text-slate-500">Manage guest arrivals and departures.</p>
            </header>

            {/* Actionable Bookings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Arrivals & Departures</h3>
                    <button onClick={fetchBookings} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Refresh</button>
                </div>

                {actionableBookings.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                        <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
                        No guests pending check-in or check-out at this time.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {actionableBookings.map((booking) => (
                            <div key={booking._id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-primary-50 text-primary-600 rounded-lg font-bold text-lg">
                                        {booking.roomName?.replace('Room ', '') || '?'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                            <User size={16} className="text-slate-400" />
                                            {booking.user?.name || 'Unknown Guest'}
                                        </h4>
                                        <p className="text-sm text-slate-500">{booking.user?.email}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(booking.checkIn).toLocaleDateString('en-GB')} - {new Date(booking.checkOut).toLocaleDateString('en-GB')}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusBadge(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    {/* Check-In Button */}
                                    {booking.status === 'Confirmed' && (
                                        <button
                                            onClick={() => handleCheckIn(booking._id)}
                                            disabled={actionLoading === booking._id || !canCheckIn(booking)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${canCheckIn(booking)
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                            title={!canCheckIn(booking) ? `Check-in available from ${new Date(booking.checkIn).toLocaleDateString()}` : 'Check-in guest'}
                                        >
                                            {actionLoading === booking._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <LogIn size={16} />
                                            )}
                                            Check-In
                                        </button>
                                    )}

                                    {/* Check-Out Button */}
                                    {booking.status === 'Checked In' && (
                                        <button
                                            onClick={() => handleCheckOut(booking._id)}
                                            disabled={actionLoading === booking._id}
                                            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                        >
                                            {actionLoading === booking._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <LogOut size={16} />
                                            )}
                                            Check-Out
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past/Cancelled Bookings */}
            {otherBookings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden opacity-70">
                    <div className="p-4 border-b border-slate-100">
                        <h4 className="text-sm font-medium text-slate-500">Other Bookings (Pending, Checked Out, Cancelled)</h4>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {otherBookings.map((booking) => (
                            <div key={booking._id} className="p-4 flex items-center justify-between text-sm">
                                <div>
                                    <span className="font-medium text-slate-700">{booking.user?.name || 'Unknown'}</span>
                                    <span className="text-slate-400 mx-2">•</span>
                                    <span className="text-slate-500">{booking.roomName}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffBookings;
