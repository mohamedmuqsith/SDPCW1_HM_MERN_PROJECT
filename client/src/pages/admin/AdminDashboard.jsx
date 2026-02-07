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
import { Pie, Bar } from 'react-chartjs-2';
import { DollarSign, TrendingUp, CheckCircle2, XCircle, Users, Layout } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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
    const { token } = useAuth();
    const [stats, setStats] = useState({
        revenue: 0,
        bookings: 0,
        occupancy: 0,
        confirmed: 0,
        guestPreferences: { labels: [], data: [] },
        servicePerformance: { labels: [], data: [] }
    });
    const [pendingBookings, setPendingBookings] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;
            try {
                const [statsRes, bookingsRes] = await Promise.all([
                    fetch('http://localhost:5000/api/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:5000/api/bookings?role=admin', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (bookingsRes.ok) {
                    const allBookings = await bookingsRes.json();
                    setPendingBookings(allBookings.filter(b => b.status === 'PENDING_APPROVAL'));
                }
            } catch (error) {
                console.error('Failed to sync dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [token]);

    const handleAction = async (bookingId, action) => {
        if (!confirm(`Are you sure you want to ${action} this booking?`)) return;
        setActionLoading(bookingId);
        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/${action}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const pieData = {
        labels: stats.guestPreferences.labels.length > 0 ? stats.guestPreferences.labels : ['Standard Rooms', 'Suites'],
        datasets: [{
            data: stats.guestPreferences.data.length > 0 ? stats.guestPreferences.data : [65, 35],
            backgroundColor: ['#6366f1', '#10b981'],
            borderWidth: 0,
        }]
    };

    const barData = {
        labels: stats.servicePerformance.labels.length > 0 ? stats.servicePerformance.labels : ['Room Service', 'Transport', 'Cleaning'],
        datasets: [{
            label: 'Requests',
            data: stats.servicePerformance.data.length > 0 ? stats.servicePerformance.data : [42, 28, 55],
            backgroundColor: '#818cf8',
            borderRadius: 6,
        }]
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <Users size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Total Bookings</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.bookings}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 text-emerald-600 mb-2">
                        <Layout size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Occupancy Rate</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.occupancy.toFixed(0)}%</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 bg-indigo-600 text-white">
                    <div className="flex items-center gap-3 mb-2 opacity-80 font-black text-xs uppercase tracking-widest">
                        <DollarSign size={20} />
                        <span>System Revenue</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-4xl font-black">${stats.revenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-emerald-300 text-xs font-bold">
                            <TrendingUp size={16} />
                            <span>+12% Trend</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Guest Preferences */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Guest Preferences</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Room Type Distribution</p>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-full max-w-[200px]">
                            <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                    </div>
                </div>

                {/* Service Performance */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Service Performance</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Request Volume</p>
                    </div>
                    <div className="h-64">
                        <Bar data={barData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { y: { display: false }, x: { grid: { display: false } } },
                            plugins: { legend: { display: false } }
                        }} />
                    </div>
                </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Awaiting Approval</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pendingBookings.length} Requests</span>
                </div>
                {pendingBookings.length === 0 ? (
                    <div className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">Clear Queue</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm font-bold text-slate-600">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Guest</th>
                                    <th className="px-8 py-4">Facility</th>
                                    <th className="px-8 py-4">Revenue</th>
                                    <th className="px-8 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pendingBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6 text-slate-900 font-black">{booking.user?.name || 'Guest'}</td>
                                        <td className="px-8 py-6 text-slate-500">{booking.roomName}</td>
                                        <td className="px-8 py-6 text-slate-900 font-black">${booking.totalPrice}</td>
                                        <td className="px-8 py-6 text-right space-x-4">
                                            <button onClick={() => handleAction(booking._id, 'approve')} className="text-emerald-500 hover:text-emerald-600"><CheckCircle2 size={24} /></button>
                                            <button onClick={() => handleAction(booking._id, 'reject')} className="text-rose-400 hover:text-rose-500"><XCircle size={24} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
