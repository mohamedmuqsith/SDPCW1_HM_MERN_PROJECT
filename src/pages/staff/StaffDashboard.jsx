import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const StaffDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            // In a real app, 'staff' role would see all requests
            const response = await fetch('http://localhost:5000/api/service-requests?role=staff');
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

    useEffect(() => {
        fetchTasks();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await fetch(`http://localhost:5000/api/service-requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchTasks(); // Refresh list
        } catch (error) {
            console.error(error);
        }
    };

    const pendingCount = tasks.filter(t => t.status === 'Pending').length;
    const progressCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Staff Dashboard</h1>
                <p className="text-slate-500">You have {pendingCount} new requests needing attention.</p>
            </header>

            {/* Stats overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-4">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                        <p className="text-sm text-slate-500">Pending</p>
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
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Guest Service Requests</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {tasks.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No active tasks found. Good job!</div>
                    ) : (
                        tasks.map((task) => (
                            <div key={task._id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start space-x-4">
                                    <div className={`mt-1 font-bold text-lg p-3 rounded-lg ${task.type.includes('Housekeeping') ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                        {task.roomNumber || '101'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{task.type}</h4>
                                        <p className="text-sm text-slate-500 mb-1">{task.details}</p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-slate-400 flex items-center">
                                                <Clock size={12} className="mr-1" />
                                                {new Date(task.createdAt).toLocaleTimeString()}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${task.status === 'Pending' ? 'bg-red-100 text-red-700' :
                                                    task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {task.status === 'Pending' && (
                                        <button
                                            onClick={() => updateStatus(task._id, 'In Progress')}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                            Start Task
                                        </button>
                                    )}
                                    {task.status === 'In Progress' && (
                                        <button
                                            onClick={() => updateStatus(task._id, 'Completed')}
                                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                                            Mark Done
                                        </button>
                                    )}
                                </div>
                            </div>
                        )))}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
