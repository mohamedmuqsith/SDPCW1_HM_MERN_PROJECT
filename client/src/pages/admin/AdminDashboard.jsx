import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Users, DollarSign, Bed, Calendar, Smile } from 'lucide-react';
import { useState, useEffect } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        revenue: 0,
        bookings: 0,
        occupancy: 0,
        confirmed: 0
    });
    const [pendingBookings, setPendingBookings] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsRes = await fetch('http://localhost:5000/api/stats');
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setDashboardData(data);
                }

                // Fetch Pending Bookings
                // Assuming /api/bookings gets all, we filter or use specific query if supported
                const bookingsRes = await fetch('http://localhost:5000/api/bookings?role=admin');
                if (bookingsRes.ok) {
                    const allBookings = await bookingsRes.json();
                    setPendingBookings(allBookings.filter(b => b.status === 'PENDING_APPROVAL'));
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };

        fetchStats();
    }, []);

    const handleAction = async (bookingId, action) => {
        if (!confirm(`Are you sure you want to ${action} this booking?`)) return;

        setActionLoading(bookingId);
        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/${action}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                // Remove from local state
                setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
                // Update stats locally (simple increment)
                if (action === 'approve') {
                    setDashboardData(prev => ({
                        ...prev,
                        confirmed: prev.confirmed + 1
                    }));
                }
            } else {
                alert('Action failed');
            }
        } catch (error) {
            console.error(error);
            alert('Network Error');
        } finally {
            setActionLoading(null);
        }
    };

    const stats = [
        {
            title: 'Total Revenue',
            value: `$${dashboardData.revenue.toLocaleString()}`,
            sub: 'Lifetime revenue',
            icon: <DollarSign size={20} />,
            iconColor: 'text-primary-600',
        },
        {
            title: 'Occupancy Rate',
            value: `${dashboardData.occupancy.toFixed(1)}%`,
            sub: `${dashboardData.confirmed} Confirmed Bookings`,
            icon: <Bed size={20} />,
            iconColor: 'text-blue-600',
        },
        {
            title: 'Total Bookings',
            value: dashboardData.bookings,
            sub: 'All time bookings',
            icon: <Calendar size={20} />,
            iconColor: 'text-orange-600',
        },
        {
            title: 'Guest Satisfaction',
            value: '9.2/10',
            sub: 'Based on 124 reviews',
            icon: <Smile size={20} />,
            iconColor: 'text-green-600',
        },
    ];

    const barData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Revenue',
                data: [25000, 48000, 35000, 42000, 30000, 32000],
                backgroundColor: '#6366f1',
                borderRadius: 4,
            },
        ],
    };

    const lineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Occupancy',
                data: [75, 78, 80, 82, 85, 87, 85, 80, 82, 88, 92, 95],
                borderColor: '#818cf8',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                tension: 0.4,
                fill: false,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    return (
        <div className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                {stat.icon}
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                        <p className="text-xs text-slate-400">{stat.sub}</p>
                    </div>
                ))}
            </div>



            {/* Admin Actions - Pending Bookings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 font-serif">Pending Approvals</h3>
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                        {pendingBookings.length} Pending
                    </span>
                </div>

                {pendingBookings.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <p>No pending bookings found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Guest</th>
                                    <th className="px-6 py-4">Room</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{booking.user?.name || 'Guest'}</td>
                                        <td className="px-6 py-4">{booking.roomName}</td>
                                        <td className="px-6 py-4">
                                            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 font-bold">${booking.totalPrice}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleAction(booking._id, 'approve')}
                                                disabled={actionLoading === booking._id}
                                                className="text-green-600 hover:text-green-800 font-bold hover:bg-green-50 px-3 py-1 rounded-lg transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(booking._id, 'reject')}
                                                disabled={actionLoading === booking._id}
                                                className="text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 font-serif">Revenue Overview</h3>
                    <div className="h-80">
                        <Bar data={barData} options={chartOptions} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 font-serif">Occupancy Trend</h3>
                    <p className="text-sm text-slate-400 mb-6">You made 265 sales this month.</p>
                    <div className="h-80">
                        <Line data={lineData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AdminDashboard;
