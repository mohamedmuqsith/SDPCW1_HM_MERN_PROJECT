import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard, Bell } from 'lucide-react';
import RescheduleModal from '../../components/guest/RescheduleModal';

const GuestDashboard = () => {
    const { user, token } = useAuth();
    const [activeBookings, setActiveBookings] = useState([]);
    const [myRequests, setMyRequests] = useState([]);

    const [loading, setLoading] = useState(true);
    // Inline Service Request State
    const [serviceType, setServiceType] = useState({}); // keyed by booking ID
    const [serviceDetails, setServiceDetails] = useState({}); // keyed by booking ID
    const [requestLoading, setRequestLoading] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user?._id || user?.id) {
                try {
                    const userId = user._id || user.id;

                    // Fetch Bookings
                    const bookingsRes = await fetch(`http://localhost:5000/api/bookings?userId=${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (bookingsRes.ok) {
                        const data = await bookingsRes.json();
                        setActiveBookings(data.map(b => ({
                            id: b._id,
                            room: b.roomName,
                            hotelName: b.hotelName || 'Central Hotel', // Fallback
                            address: b.address || '123 Main St, Metropolis', // Fallback
                            checkIn: new Date(b.checkIn).toLocaleDateString(),
                            checkOut: new Date(b.checkOut).toLocaleDateString(),
                            checkInRaw: b.checkIn, // ISO String for editing
                            checkOutRaw: b.checkOut, // ISO String for editing
                            status: b.status,
                            image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80'
                        })));
                    }

                    // Fetch Service Requests
                    const requestsRes = await fetch(`http://localhost:5000/api/service-requests?userId=${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (requestsRes.ok) {
                        const data = await requestsRes.json();
                        setMyRequests(data);
                    }

                } catch (error) {
                    console.error("Failed to load dashboard data", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user, token]);

    const handleServiceRequest = async (bookingId) => {
        const type = serviceType[bookingId];
        const details = serviceDetails[bookingId];

        if (!type || !details) {
            alert('Please select a service and provide details.');
            return;
        }

        setRequestLoading(bookingId);
        try {
            // NOTE: In a real app, we might need a mapping for 'type' string if backend expects specific enums
            const res = await fetch('http://localhost:5000/api/service-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    bookingId: bookingId, // Link request to specific booking
                    type: type,
                    details: details,
                    priority: 'Medium'
                })
            });

            if (res.ok) {
                alert('Service Request Sent!');
                // Clear inputs
                setServiceType(prev => ({ ...prev, [bookingId]: '' }));
                setServiceDetails(prev => ({ ...prev, [bookingId]: '' }));
            } else {
                const errData = await res.json();
                alert(`Request Failed: ${errData.reason || errData.message || 'Unknown Error'}`);
            }
        } catch (error) {
            console.error(error);
            alert(`Network Error: ${error.message}`);
        } finally {
            setRequestLoading(null);
        }
    };

    // Modal State
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user.id || user._id })
            });

            if (res.ok) {
                alert('Booking Cancelled');
                // Refresh list logic here or force reload
                window.location.reload();
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to cancel booking');
        }
    };

    const openReschedule = (booking) => {
        // Parse date strings back to YYYY-MM-DD for input
        // booking.checkIn is "M/D/YYYY" from locale string options
        // We need pure date object or ISO string. 
        // Ideally we should store raw ISO in state and format in UI only.
        // For now, let's just pass the booking object and let Modal handle or re-fetch activeBookings with raw data.
        // Actually activeBookings maps dates to localeString. We should probably keep raw too.
        // Lets fix the activeBookings map in useEffect to keep raw dates.
        setSelectedBooking(booking);
        setRescheduleModalOpen(true);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CHECKED_IN': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CHECKED_OUT': return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Hello, {user?.name || 'Guest'} 👋</h1>
                    <p className="text-slate-500 mt-2">Here's what's happening with your stay.</p>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Bookings */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Active Bookings */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                            Active Bookings
                        </h2>

                        {activeBookings.map((booking) => (
                            <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                                <div className="md:w-1/3 h-48 md:h-auto">
                                    <img src={booking.image} alt={booking.room} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-slate-900">{booking.room}</h3>
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusStyle(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-600">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                {booking.checkIn} — {booking.checkOut}
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                                {booking.hotelName}
                                            </div>
                                            <div className="text-xs text-slate-400 pl-6">
                                                {booking.address}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Service Request - Restricted to Confirmed/Checked In */}
                                    {(booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') ? (
                                        <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Request Services</p>
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    className="text-sm border-slate-200 rounded-lg py-1.5 focus:ring-primary-500"
                                                    value={serviceType[booking.id] || ''}
                                                    onChange={(e) => setServiceType(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                                >
                                                    <option value="">Select Service...</option>
                                                    <option value="Housekeeping">Housekeeping</option>
                                                    <option value="Room Service">Room Service</option>
                                                    <option value="Transport">Transport</option>
                                                    <option value="Tech Support">Tech Support</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder="Details (e.g. Extra Towels, Burger)"
                                                    className="text-sm border-slate-200 rounded-lg py-1.5 focus:ring-primary-500"
                                                    value={serviceDetails[booking.id] || ''}
                                                    onChange={(e) => setServiceDetails(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                                />
                                                <button
                                                    onClick={() => handleServiceRequest(booking.id)}
                                                    disabled={requestLoading === booking.id}
                                                    className="bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors"
                                                >
                                                    {requestLoading === booking.id ? 'Sending...' : 'Submit Request'}
                                                </button>
                                                <p className="text-[10px] text-slate-400 italic text-center">*Charges may apply for Dining/Transport</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-3 bg-slate-50 text-slate-400 text-xs italic rounded-lg text-center border border-slate-100">
                                            Services available after booking confirmation.
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                        {(booking.status === 'PENDING_APPROVAL' || booking.status === 'CONFIRMED') && (
                                            <>
                                                <button
                                                    onClick={() => openReschedule(booking)}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                                >
                                                    Modify Dates
                                                </button>
                                                <button
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                                                >
                                                    Cancel Booking
                                                </button>
                                            </>
                                        )}
                                        {booking.status === 'CONFIRMED' && (
                                            <button
                                                onClick={() => alert("Online Check-in initiated! Please arrive at reception for key collection.")}
                                                className="text-xs font-bold text-green-700 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 flex items-center"
                                            >
                                                <Clock className="w-3 h-3 mr-1" /> Online Check-in
                                            </button>
                                        )}
                                        {(booking.status === 'CHECKED_IN' || booking.status === 'CHECKED_OUT') && (
                                            <button
                                                onClick={() => alert("Opening Invoice... (This would open a PDF or Modal)")}
                                                className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center"
                                            >
                                                <CreditCard className="w-3 h-3 mr-1" /> View Bill
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Quick Actions */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Room Service', icon: '🍽️', type: 'room_service' },
                                { label: 'Housekeeping', icon: '🧹', type: 'housekeeping' },
                                { label: 'Transport', icon: '🚕', type: 'transport' },
                                { label: 'Concierge', icon: '🛎️', type: 'other' }
                            ].map((action, idx) => (
                                <Link
                                    key={idx}
                                    to="/dashboard/services"
                                    state={{ type: action.type }}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all text-center group block"
                                >
                                    <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{action.icon}</span>
                                    <span className="text-sm font-medium text-slate-700">{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Sidebar - Notifications & Profile */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                            Notifications
                        </h3>
                        <div className="space-y-4">
                            {[
                                { title: 'Check-in Reminder', time: '2 hours ago', desc: 'Your room is ready for check-in!' },
                                { title: 'Welcome Drink', time: '30 mins ago', desc: 'Enjoy a complimentary drink at the Sky Bar.' }
                            ].map((notif, idx) => (
                                <div key={idx} className="flex gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-primary-900 to-primary-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                        <h3 className="text-lg font-bold mb-1">Loyalty Member</h3>
                        <p className="text-primary-200 text-sm mb-6">Gold Tier</p>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs text-primary-300 uppercase tracking-wider mb-1">Points Balance</p>
                                <p className="text-3xl font-bold">12,450</p>
                            </div>
                            <CreditCard className="w-8 h-8 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {rescheduleModalOpen && selectedBooking && (
                <RescheduleModal
                    isOpen={rescheduleModalOpen}
                    onClose={() => setRescheduleModalOpen(false)}
                    booking={selectedBooking}
                    onUpdate={() => window.location.reload()}
                />
            )}
        </div>
    );
};

export default GuestDashboard;
