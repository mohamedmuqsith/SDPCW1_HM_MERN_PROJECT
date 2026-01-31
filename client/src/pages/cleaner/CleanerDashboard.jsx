import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, CheckCircle2, Play, AlertTriangle, RefreshCw, Filter, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import socket from '../../socket'; // Import socket

const CleanerDashboard = () => {
    const { logout, token, user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ new: 0, inProgress: 0, completed: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [newNotification, setNewNotification] = useState(null); // Local notification state
    const [showReportModal, setShowReportModal] = useState(false);
    const [fetchError, setFetchError] = useState(null); // Track fetch errors

    // Handle logout
    const handleLogout = () => {
        logout();
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Helper: Calculate time ago
    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return '1 day+ ago';
    };

    // Helper: Format request time
    const formatRequestTime = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            ago: getTimeAgo(dateString)
        };
    };

    const fetchTasks = async () => {
        try {
            setFetchError(null);
            // Use token from AuthContext, fallback to localStorage
            const authToken = token || localStorage.getItem('token');

            if (!authToken) {
                setFetchError('No authentication token. Please log in again.');
                setLoading(false);
                return;
            }

            console.log('Fetching cleaner tasks...', { userRole: user?.role });

            const statusParam = filter !== 'all' ? `?status=${filter}` : '';
            const res = await fetch(`http://localhost:5000/api/cleaner/tasks${statusParam}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const data = await res.json();

            if (res.ok) {
                console.log('Tasks fetched successfully:', data.tasks?.length, 'tasks');
                setTasks(data.tasks || []);
                setStats(data.stats || {});
            } else {
                console.error('Cleaner tasks fetch failed:', res.status, data);
                setFetchError(data.message || `Access denied (${res.status}). Make sure you're logged in as a cleaner/housekeeping role.`);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            setFetchError('Network error. Could not connect to server.');
        } finally {
            setLoading(false);
        }
    };

    // Socket.io Real-time Listener
    useEffect(() => {
        socket.on('housekeeping:new_task', (newTask) => {
            console.log('Real-time Task Received:', newTask);

            // 1. Add to List (Prepend)
            setTasks(prev => {
                // Prevent duplicates
                if (prev.find(t => t._id === newTask._id)) return prev;
                // Add properties expected by UI if missing
                const formattedTask = {
                    ...newTask,
                    allowedReason: 'Recently Requested', // Default for real-time
                    isOverdue: false,
                    timeRemaining: 60 // Default SLA
                };
                return [formattedTask, ...prev];
            });

            // 2. Update Stats
            setStats(prev => ({ ...prev, new: prev.new + 1, total: prev.total + 1 }));

            // 3. Show Notification
            setNewNotification(`New Request: Room ${newTask.roomNumber} - ${newTask.type}`);

            // Audio Alert (Optional)
            // const audio = new Audio('/notification.mp3');
            // audio.play().catch(e => console.log('Audio play failed'));

            // Clear notification after 5s
            setTimeout(() => setNewNotification(null), 5000);
        });

        return () => {
            socket.off('housekeeping:new_task');
        };
    }, []);

    useEffect(() => {
        if (token) {
            fetchTasks();
            // Poll every 15 seconds as fallback
            const interval = setInterval(fetchTasks, 15000);
            return () => clearInterval(interval);
        }
    }, [filter, token]);

    const handleStart = async (taskId) => {
        setActionLoading(taskId);
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/cleaner/tasks/${taskId}/start`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✓ ${data.reason}`);
                fetchTasks();
            } else {
                alert(`✗ ${data.reason}`);
            }
        } catch (error) {
            alert('Failed to start task');
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (taskId) => {
        setActionLoading(taskId);
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/cleaner/tasks/${taskId}/complete`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: 'Room cleaned and inspected' })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✓ ${data.reason}`);
                fetchTasks();
            } else {
                alert(`✗ ${data.reason}`);
            }
        } catch (error) {
            alert('Failed to complete task');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status, isOverdue) => {
        if (isOverdue && status !== 'Completed') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">⚠ Overdue</span>;
        }
        switch (status) {
            case 'New':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">New</span>;
            case 'In Progress':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">In Progress</span>;
            case 'Completed':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Completed</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            'Emergency': 'bg-red-500 text-white',
            'High': 'bg-orange-500 text-white',
            'Medium': 'bg-yellow-500 text-white',
            'Low': 'bg-green-500 text-white'
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[priority] || 'bg-gray-500 text-white'}`}>{priority}</span>;
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        setActionLoading('report');
        const formData = new FormData(e.target);
        const reportData = {
            roomNumber: formData.get('roomNumber'),
            details: formData.get('details'),
            priority: formData.get('priority')
        };

        try {
            const authToken = token || localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/cleaner/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify(reportData)
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✓ ${data.reason}`);
                setShowReportModal(false);
            } else {
                alert(`✗ ${data.reason}`);
            }
        } catch (error) {
            alert('Failed to submit report');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="text-blue-500" />
                        Housekeeping Dashboard
                    </h1>
                    <p className="text-slate-500">Manage cleaning & housekeeping tasks • Service Hours: 8 AM - 6 PM</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md"
                    >
                        <AlertTriangle size={16} /> Report Issue
                    </button>
                    <button
                        onClick={fetchTasks}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {fetchError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle size={18} />
                        <span>Error Loading Tasks</span>
                    </div>
                    <p className="text-sm mt-1">{fetchError}</p>
                    <p className="text-xs mt-2 text-red-500">Current role: {user?.role || 'Unknown'} | Required: cleaner, housekeeping, or admin</p>
                </div>
            )}

            {/* Real-time Notification Toast */}
            {newNotification && (
                <div className="fixed top-24 right-6 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-in flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Bell className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">New Task Received!</p>
                        <p className="text-blue-100 text-sm">{newNotification}</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.new || 0}</p>
                            <p className="text-xs text-slate-500">New Tasks</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Play className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.inProgress || 0}</p>
                            <p className="text-xs text-slate-500">In Progress</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.completed || 0}</p>
                            <p className="text-xs text-slate-500">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.overdue || 0}</p>
                            <p className="text-xs text-slate-500">Overdue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="flex items-center gap-4">
                    <Filter size={18} className="text-slate-400" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Tasks</option>
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <span className="text-sm text-slate-500">
                        Showing {tasks.length} task(s)
                    </span>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                        <Sparkles className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500">No cleaning tasks found</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Task Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-blue-600">
                                        Room {task.roomNumber || 'N/A'}
                                    </span>
                                    {getStatusBadge(task.status, task.isOverdue)}
                                    {getPriorityBadge(task.priority)}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {task.dueAt && (
                                        <span className={task.isOverdue ? 'text-red-600 font-medium' : ''}>
                                            Due: {new Date(task.dueAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* WHY ALLOWED Section */}
                            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                                <p className="text-sm text-green-800 font-medium">
                                    {task.allowedReason}
                                </p>
                            </div>

                            {/* Task Details */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                                        {task.type}
                                    </span>
                                    {task.booking?.roomName && (
                                        <span className="text-xs text-slate-400">
                                            Booked Room: {task.booking.roomName}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mb-3">
                                    <strong>Details:</strong> {task.details || 'Regular cleaning'}
                                </p>

                                {/* Request Time - Prominent Display */}
                                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">🕐</span>
                                            <div>
                                                <span className="text-sm font-medium text-slate-700">
                                                    Request Time: {formatRequestTime(task.createdAt).time}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-2">
                                                    ({formatRequestTime(task.createdAt).date})
                                                </span>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                            {formatRequestTime(task.createdAt).ago}
                                        </span>
                                    </div>
                                </div>

                                {/* Preferred Time Display */}
                                {task.preferredTime && (
                                    <div className="bg-purple-50 rounded-lg p-3 mb-3 border border-purple-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-600">🔔</span>
                                            <div>
                                                <span className="text-sm font-bold text-purple-700">
                                                    Guest Preferred Time: {task.preferredTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                    {task.user && (
                                        <span>👤 Guest: {task.user.name || task.user.email}</span>
                                    )}
                                    {task.timeRemaining !== null && task.status !== 'Completed' && (
                                        <span className={task.timeRemaining < 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
                                            ⏱ {task.timeRemaining < 0
                                                ? `Overdue by ${Math.abs(task.timeRemaining)} min`
                                                : `${task.timeRemaining} min remaining`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                {task.status === 'New' && (
                                    <button
                                        onClick={() => handleStart(task._id)}
                                        disabled={actionLoading === task._id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {actionLoading === task._id ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            <Play size={16} />
                                        )}
                                        Start Task
                                    </button>
                                )}
                                {task.status === 'In Progress' && (
                                    <button
                                        onClick={() => handleComplete(task._id)}
                                        disabled={actionLoading === task._id}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                    >
                                        {actionLoading === task._id ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={16} />
                                        )}
                                        Mark Complete
                                    </button>
                                )}
                                {task.status === 'Completed' && (
                                    <span className="flex items-center gap-2 px-4 py-2 text-green-600">
                                        <CheckCircle2 size={16} /> Completed
                                        {task.completedAt && ` at ${new Date(task.completedAt).toLocaleTimeString()}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Maintenance Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <AlertTriangle className="text-orange-500" /> Report Issue
                            </h2>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                <input
                                    name="roomNumber"
                                    required
                                    placeholder="e.g. 101"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    name="priority"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Emergency">Emergency</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Details</label>
                                <textarea
                                    name="details"
                                    required
                                    rows="3"
                                    placeholder="Describe the maintenance issue..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading === 'report'}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {actionLoading === 'report' ? (
                                    <RefreshCw className="animate-spin" size={20} />
                                ) : (
                                    <>Submit Report <Play size={16} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CleanerDashboard;
