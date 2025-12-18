import { useState, useEffect } from 'react';
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
    const [revenueData, setRevenueData] = useState([]);
    const [occupancyData, setOccupancyData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [revRes, occRes, logRes] = await Promise.all([
                    fetch('http://localhost:5000/api/reports/revenue'),
                    fetch('http://localhost:5000/api/reports/occupancy'),
                    fetch('http://localhost:5000/api/reports/logs')
                ]);

                if (revRes.ok) setRevenueData(await revRes.json());
                if (occRes.ok) setOccupancyData(await occRes.json());
                if (logRes.ok) setLogs(await logRes.json());

            } catch (error) {
                console.error("Error fetching reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Chart Configs
    const lineChartData = {
        labels: revenueData.map(d => {
            const date = new Date();
            date.setMonth(d._id - 1);
            return date.toLocaleString('default', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Revenue ($)',
                data: revenueData.map(d => d.total),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                tension: 0.3
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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                    <Download size={18} /> Export Report (PDF)
                </button>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Revenue (6 Mo)</p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                ${revenueData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
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
                            <h3 className="text-2xl font-bold text-slate-900">
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
                            <p className="text-sm text-slate-500">Security Events</p>
                            <h3 className="text-2xl font-bold text-slate-900">{logs.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Trends</h3>
                    <div className="h-64">
                        <Line options={{ responsive: true, maintainAspectRatio: false }} data={lineChartData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Occupancy Split</h3>
                    <div className="h-64 flex justify-center">
                        <Doughnut options={{ responsive: true, maintainAspectRatio: false }} data={doughnutData} />
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Security Audit Log (GDPR Compliance)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">IP Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {logs.map((log) => (
                                <tr key={log._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {log.user}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {log.details || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            {log.ipAddress}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No security events recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
