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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/stats');
                if (response.ok) {
                    const data = await response.json();
                    setDashboardData(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };

        fetchStats();
    }, []);

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
        </div>
    );
};

export default AdminDashboard;
