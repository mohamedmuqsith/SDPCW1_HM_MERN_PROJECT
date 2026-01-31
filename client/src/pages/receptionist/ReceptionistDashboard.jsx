import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Users, Calendar, Clock, CheckCircle, AlertCircle,
    UserCheck, LogOut, ClipboardList, RefreshCcw
} from 'lucide-react';

const ReceptionistDashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        todayCheckIns: 0,
        todayCheckOuts: 0,
        currentlyCheckedIn: 0,
        newServiceRequests: 0
    });
    const [pendingBookings, setPendingBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/receptionist/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchPendingBookings = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/receptionist/bookings/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPendingBookings(data);
            }
        } catch (error) {
            console.error('Failed to fetch pending bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchPendingBookings();
            // Auto-refresh every 30 seconds
            const interval = setInterval(() => {
                fetchStats();
                fetchPendingBookings();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const approveBooking = async (id, assignedRoom) => {
        try {
            const response = await fetch(`http://localhost:5000/api/receptionist/bookings/${id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ assignedRoom })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message + '\n' + data.reason);
                fetchStats();
                fetchPendingBookings();
            } else {
                alert(data.message + '\n' + (data.reason || ''));
            }
        } catch (error) {
            alert('Failed to approve booking');
        }
    };

    const rejectBooking = async (id) => {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;

        try {
            const response = await fetch(`http://localhost:5000/api/receptionist/bookings/${id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                fetchStats();
                fetchPendingBookings();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to reject booking');
        }
    };

    const statCards = [
        { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'orange' },
        { label: 'Today Check-Ins', value: stats.todayCheckIns, icon: UserCheck, color: 'blue' },
        { label: 'Today Check-Outs', value: stats.todayCheckOuts, icon: LogOut, color: 'purple' },
        { label: 'Currently In-House', value: stats.currentlyCheckedIn, icon: Users, color: 'green' },
        { label: 'New Service Requests', value: stats.newServiceRequests, icon: ClipboardList, color: 'red' }
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Receptionist Dashboard</h1>
                    <p className="text-slate-500">Front Desk Operations</p>
                </div>
                <div className="flex items-center text-xs text-slate-400">
                    <RefreshCcw size={12} className="mr-1" /> Auto-updates every 30s
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className={`p-2 bg-${stat.color}-100 text-${stat.color}-600 rounded-lg w-fit mb-2`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-orange-500" />
                        Pending Booking Approvals
                    </h3>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                        {pendingBookings.length} Pending
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading...</div>
                    ) : pendingBookings.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                            No pending approvals. All caught up!
                        </div>
                    ) : (
                        pendingBookings.map((booking) => (
                            <div key={booking._id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-lg text-slate-900">
                                                {booking.user?.name || 'Guest'}
                                            </span>
                                            <span className="text-slate-500 text-sm">
                                                {booking.user?.email}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                            <span className="flex items-center">
                                                <Calendar size={14} className="mr-1" />
                                                {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                {booking.roomName}
                                            </span>
                                            <span className="font-medium text-green-600">
                                                ${booking.totalPrice}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const room = prompt('Assign Room Number (optional):', booking.roomName.replace('Room ', ''));
                                                approveBooking(booking._id, room);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => rejectBooking(booking._id)}
                                            className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;
