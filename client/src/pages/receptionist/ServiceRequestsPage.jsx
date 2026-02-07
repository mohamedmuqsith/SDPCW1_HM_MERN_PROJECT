import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, User, Clock, CheckCircle, AlertTriangle, UserPlus, Plus } from 'lucide-react';
import CreateRequestModal from '../../components/receptionist/CreateRequestModal';

const ServiceRequestsPage = () => {
    const { token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchRequests = async () => {
        try {
            const url = filter === 'all'
                ? 'http://localhost:5000/api/receptionist/service-requests'
                : `http://localhost:5000/api/receptionist/service-requests?status=${filter}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/receptionist/staff', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStaff(data);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchRequests();
            fetchStaff();
        }
    }, [token, filter]);

    const handleCreateRequest = async (requestData) => {
        try {
            const response = await fetch('http://localhost:5000/api/service-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });
            const data = await response.json();
            if (response.ok) {
                alert(`✅ Request Created Successfully!`);
                setIsCreateModalOpen(false);
                fetchRequests();
            } else {
                alert(`✗ ${data.message || data.reason}`);
            }
        } catch (error) {
            alert('Failed to create request');
        }
    };

    const assignToStaff = async (requestId) => {
        const staffOptions = staff.map(s => `${s.name} (${s.department || s.role})`).join('\n');
        const staffName = prompt(`Select staff member:\n\n${staffOptions}\n\nEnter staff name:`);

        if (!staffName) return;

        const selectedStaff = staff.find(s => s.name.toLowerCase().includes(staffName.toLowerCase()));
        if (!selectedStaff) {
            alert('Staff member not found');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/receptionist/service-requests/${requestId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ staffId: selectedStaff._id })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`✅ ${data.message}\n${data.reason}`);
                fetchRequests();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to assign request');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-red-100 text-red-700';
            case 'Assigned': return 'bg-yellow-100 text-yellow-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Completed': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Emergency': return 'text-red-600 font-bold';
            case 'High': return 'text-orange-600 font-semibold';
            case 'Medium': return 'text-yellow-600';
            case 'Low': return 'text-slate-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <ClipboardList className="w-8 h-8 mr-3 text-indigo-600" />
                        Service Requests
                    </h1>
                    <p className="text-slate-500">View and assign guest service requests to staff</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all"
                >
                    <Plus size={20} />
                    New Request
                </button>
            </header>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', 'New', 'Assigned', 'In Progress', 'Completed'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {status === 'all' ? 'All' : status}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">
                            No service requests found.
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request._id} className="p-6 hover:bg-slate-50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-lg text-slate-900">
                                                {request.type}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                                                {request.status}
                                            </span>
                                            <span className={`text-xs ${getPriorityColor(request.priority)}`}>
                                                {request.priority}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm mb-2">{request.details}</p>
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                            <span className="flex items-center">
                                                <User size={12} className="mr-1" />
                                                Room {request.roomNumber || 'N/A'}
                                            </span>
                                            <span className="flex items-center">
                                                <Clock size={12} className="mr-1" />
                                                {new Date(request.createdAt).toLocaleString()}
                                            </span>
                                            {request.assignedTo && (
                                                <span className="flex items-center text-blue-600">
                                                    <UserPlus size={12} className="mr-1" />
                                                    {request.assignedTo.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {(request.status === 'New' || request.status === 'Assigned') && (
                                        <button
                                            onClick={() => assignToStaff(request._id)}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center"
                                        >
                                            <UserPlus size={16} className="mr-2" />
                                            Assign Staff
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <CreateRequestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateRequest}
            />
        </div>
    );
};

export default ServiceRequestsPage;

