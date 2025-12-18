import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard, Bell } from 'lucide-react';

const GuestDashboard = () => {
    const { user } = useAuth();
    const [activeBookings, setActiveBookings] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user?._id || user?.id) {
                try {
                    const userId = user._id || user.id;

                    // Fetch Bookings
                    const bookingsRes = await fetch(`http://localhost:5000/api/bookings?userId=${userId}`);
                    if (bookingsRes.ok) {
                        const data = await bookingsRes.json();
                        setActiveBookings(data.map(b => ({
                            id: b._id,
                            room: b.roomName,
                            checkIn: new Date(b.checkIn).toLocaleDateString(),
                            checkOut: new Date(b.checkOut).toLocaleDateString(),
                            status: b.status,
                            image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80'
                        })));
                    }

                    // Fetch Service Requests
                    const requestsRes = await fetch(`http://localhost:5000/api/service-requests?userId=${userId}`);
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
    }, [user]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Hello, {user?.name || 'Guest'} 👋</h1>
                <p className="text-slate-500 mt-2">Here's what's happening with your stay.</p>
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
                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full">
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
                                                Room 304, 3rd Floor (Ocean Wing)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button className="flex-1 bg-primary-50 text-primary-700 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors text-sm">
                                            Manage Booking
                                        </button>
                                        <Link
                                            to="/dashboard/services"
                                            className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm flex items-center justify-center"
                                        >
                                            Request Service
                                        </Link>
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

                    <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
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
        </div>
    );
};

export default GuestDashboard;
