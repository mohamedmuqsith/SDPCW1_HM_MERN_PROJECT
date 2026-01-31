import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Clock, AlertCircle, AlertTriangle, RefreshCcw, Filter } from 'lucide-react';

const StaffDashboard = () => {
    const { token } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, my, unassigned
    const [now, setNow] = useState(Date.now()); // For real-time 'time ago' updates

    const fetchTasks = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/service-requests?role=staff', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (error) {
            console.error("Failed to fetch staff tasks", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch & Polling (15s)
    useEffect(() => {
        if (token) {
            fetchTasks();
            const interval = setInterval(fetchTasks, 15000); // Poll every 15s
            return () => clearInterval(interval);
        }
    }, [token]);

    // Update 'Time Ago' every 30s locally without fetching
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(interval);
    }, []);

    // Accept and Start a Task
    const acceptTask = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/service-requests/${id}/accept`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || 'Failed to accept task');
                return;
            }
            fetchTasks(); // Immediate refresh
        } catch (error) {
            console.error(error);
            alert('Network error. Please try again.');
        }
    };

    // Complete a Task
    const completeTask = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/service-requests/${id}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || 'Failed to complete task');
                return;
            }
            fetchTasks(); // Immediate refresh
        } catch (error) {
            console.error(error);
            alert('Network error. Please try again.');
        }
    };

    // Client-side Filter
    const filteredTasks = tasks.filter(task => {
        if (filter === 'my') return task.assignedTo?._id === task.user?._id; // Logic depends on populate, assuming current user ID match? 
        // We don't have current user ID easily here without decoding token or AuthContext user.
        // Let's stick to Server Side filtering usually, but here:
        // We will just show all for now, or assume 'all' is default.
        return true;
    });

    const pendingCount = tasks.filter(t => t.status === 'New' || t.status === 'Assigned').length;
    const progressCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    // Time Ago Helper
    const getTimeAgo = (dateStr) => {
        const diff = Math.floor((now - new Date(dateStr).getTime()) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff} min ago`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
    };

    // SLA Helper
    const getSLAStatus = (dueAt) => {
        if (!dueAt) return null;
        const diff = Math.floor((new Date(dueAt).getTime() - now) / 60000);
        if (diff < 0) return { text: `Overdue ${Math.abs(diff)}m`, color: 'text-red-600 font-bold' };
        if (diff < 15) return { text: `Due in ${diff}m`, color: 'text-orange-600 font-bold' };
        return { text: `Due in ${diff}m`, color: 'text-slate-500' };
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'Emergency': return 'bg-red-100 text-red-800 border-red-200';
            case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Staff Dashboard</h1>
                    <p className="text-slate-500">Real-time Operations Console</p>
                </div>
                <div className="flex items-center text-xs text-slate-400">
                    <RefreshCcw size={12} className="mr-1 animate-spin-slow" /> Auto-updates every 15s
                </div>
            </header>

            {/* Stats overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-4">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                        <p className="text-sm text-slate-500">New / Assigned</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{progressCount}</p>
                        <p className="text-sm text-slate-500">In Progress</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
                        <p className="text-sm text-slate-500">Completed</p>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <Filter className="w-5 h-5 mr-2 text-slate-500" />
                        Active Tasks
                    </h3>
                    {/* Filter Controls could go here */}
                </div>
                <div className="divide-y divide-slate-100">
                    {tasks.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic">No active tasks. All clear!</div>
                    ) : (
                        tasks.map((task) => {
                            const sla = getSLAStatus(task.dueAt);
                            return (
                                <div key={task._id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start space-x-4">
                                        <div className={`mt-1 font-bold text-lg p-3 rounded-lg flex flex-col items-center justify-center w-16 h-16 border ${getPriorityColor(task.priority)}`}>
                                            <span>{task.roomNumber || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-900 text-lg">{task.type}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getPriorityColor(task.priority)}`}>
                                                    {task.priority || 'Medium'}
                                                </span>
                                            </div>

                                            <p className="text-slate-600 mb-2">{task.details}</p>

                                            {/* Metadata Row */}
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-slate-400 flex items-center" title={new Date(task.createdAt).toLocaleString()}>
                                                    <Clock size={12} className="mr-1" />
                                                    {getTimeAgo(task.createdAt)}
                                                </span>

                                                {sla && (
                                                    <span className={`flex items-center ${sla.color}`}>
                                                        <AlertTriangle size={12} className="mr-1" />
                                                        {sla.text}
                                                    </span>
                                                )}

                                                <span className={`px-2 py-0.5 rounded-full font-medium ${['New', 'Assigned'].includes(task.status) ? 'bg-red-100 text-red-700' :
                                                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {(task.status === 'New' || task.status === 'Assigned') && (
                                            <button
                                                onClick={() => acceptTask(task._id)}
                                                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 shadow-sm transition-all whitespace-nowrap">
                                                Accept & Start
                                            </button>
                                        )}
                                        {task.status === 'In Progress' && (
                                            <button
                                                onClick={() => completeTask(task._id)}
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-sm transition-all whitespace-nowrap">
                                                Mark Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
