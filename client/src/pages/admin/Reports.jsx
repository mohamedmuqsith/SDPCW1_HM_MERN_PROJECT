import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Download, ShieldCheck, TrendingUp, Users } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Reports = () => {
    const { token } = useAuth();
    const [revenueData, setRevenueData] = useState([]);
    const [hotelRevenueData, setHotelRevenueData] = useState([]);
    const [occupancyData, setOccupancyData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('all'); // all, today, month, year
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [hotels, setHotels] = useState([]);

    const formatLKR = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const fetchFilteredHotelRevenue = async (filter, hotel = selectedHotel) => {
        let start = '';
        let end = new Date().toISOString();

        if (filter === 'today') {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            start = d.toISOString();
        } else if (filter === 'month') {
            const d = new Date();
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            start = d.toISOString();
        } else if (filter === 'year') {
            const d = new Date();
            d.setMonth(0, 1);
            d.setHours(0, 0, 0, 0);
            start = d.toISOString();
        }

        try {
            const hotelParam = hotel !== 'all' ? `&hotel=${encodeURIComponent(hotel)}` : '';
            const url = `http://localhost:5000/api/reports/hotel-revenue?startDate=${start}&endDate=${end}${hotelParam}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setHotelRevenueData(await res.json());
        } catch (error) {
            console.error("Error fetching filtered revenue", error);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [revRes, occRes, logRes, hotelRes, hotelsRes] = await Promise.all([
                    fetch('http://localhost:5000/api/reports/revenue', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:5000/api/reports/occupancy', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:5000/api/reports/logs', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:5000/api/reports/hotel-revenue', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:5000/api/hotels', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (revRes.ok) setRevenueData(await revRes.json());
                if (occRes.ok) setOccupancyData(await occRes.json());
                if (logRes.ok) setLogs(await logRes.json());
                if (hotelRes.ok) setHotelRevenueData(await hotelRes.json());
                if (hotelsRes.ok) setHotels(await hotelsRes.json());

            } catch (error) {
                console.error("Error fetching reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [token]);

    const handleFilterChange = (filter) => {
        setDateFilter(filter);
        fetchFilteredHotelRevenue(filter);
    };

    const handleHotelChange = (hotel) => {
        setSelectedHotel(hotel);
        fetchFilteredHotelRevenue(dateFilter, hotel);
    };

    // Chart Configs
    const lineChartData = {
        labels: revenueData.map(d => {
            const date = new Date();
            date.setMonth(d._id - 1);
            return date.toLocaleString('default', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Revenue Trend',
                data: revenueData.map(d => d.total),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                tension: 0.3
            }
        ]
    };

    const hotelBarData = {
        labels: hotelRevenueData.map(d => d.hotelType),
        datasets: [
            {
                label: 'Total Revenue (LKR)',
                data: hotelRevenueData.map(d => d.totalRevenue),
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderRadius: 8
            }
        ]
    };

    const doughnutData = {
        labels: ['Occupied', 'Available'],
        datasets: [
            {
                data: occupancyData ? [occupancyData.occupied, occupancyData.available] : [0, 100],
                backgroundColor: ['#2563eb', '#e2e8f0'],
                hoverOffset: 4
            }
        ]
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Generating analytics...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Reports & Analytics</h2>
                    <p className="text-slate-500 text-sm font-medium">Global and property-specific performance insights</p>
                </div>
                <div className="flex gap-4 items-center">
                    <select
                        value={selectedHotel}
                        onChange={(e) => handleHotelChange(e.target.value)}
                        className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    >
                        <option value="all">All Properties</option>
                        {hotels.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
                    </select>
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                        {['all', 'today', 'month', 'year'].map((f) => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-widest transition-all ${dateFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Revenue (Global)</p>
                            <h3 className="text-xl font-bold text-slate-900">
                                {formatLKR(hotelRevenueData.reduce((acc, curr) => acc + curr.totalRevenue, 0))}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Occupancy Rate</p>
                            <h3 className="text-xl font-bold text-slate-900">
                                {occupancyData?.rate}%
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Bookings</p>
                            <h3 className="text-xl font-bold text-slate-900">
                                {hotelRevenueData.reduce((acc, curr) => acc + curr.bookingCount, 0)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Hotel Type Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Revenue by Hotel Type</h3>
                        <p className="text-sm text-slate-500">Distribution across room categories in LKR</p>
                    </div>
                    <div className="h-80">
                        <Bar
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true } }
                            }}
                            data={hotelBarData}
                        />
                    </div>
                </div>

                {/* Revenue Trends */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Historical Revenue Trend</h3>
                    <div className="h-80">
                        <Line options={{ responsive: true, maintainAspectRatio: false }} data={lineChartData} />
                    </div>
                </div>
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900">Revenue Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hotel Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Bookings</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {hotelRevenueData.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{d.hotelType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{d.bookingCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-primary-600">{formatLKR(d.totalRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Occupancy Status</h3>
                    <div className="h-64 flex justify-center">
                        <Doughnut options={{ responsive: true, maintainAspectRatio: false }} data={doughnutData} />
                    </div>
                    <div className="mt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Occupied Rooms</span>
                            <span className="font-bold text-blue-600">{occupancyData?.occupied}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Available Rooms</span>
                            <span className="font-bold text-slate-400">{occupancyData?.available}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
