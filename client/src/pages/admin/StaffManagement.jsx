import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Phone, Mail, DollarSign } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const StaffManagement = () => {
    const { token } = useAuth();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        department: '',
        email: '',
        phone: '',
        salary: '',
        status: 'Active'
    });

    const fetchStaff = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/staff', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStaffList(data);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingStaff
                ? `http://localhost:5000/api/staff/${editingStaff._id}`
                : 'http://localhost:5000/api/staff';

            const method = editingStaff ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchStaff();
                closeModal();
            } else {
                alert('Failed to save staff member');
            }
        } catch (error) {
            console.error('Error saving staff:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await fetch(`http://localhost:5000/api/staff/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchStaff();
        } catch (error) {
            console.error('Error removing staff:', error);
        }
    };

    const openModal = (staff = null) => {
        if (staff) {
            setEditingStaff(staff);
            setFormData({
                name: staff.name,
                position: staff.position,
                department: staff.department,
                email: staff.email,
                phone: staff.phone,
                salary: staff.salary,
                status: staff.status
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: '',
                position: '',
                department: '',
                email: '',
                phone: '',
                salary: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Staff Management</h3>
                <button
                    onClick={() => openModal()}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
                >
                    <Plus size={16} /> Add Staff
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name/Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dept</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {staffList.map((staff) => (
                            <tr key={staff._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-slate-900">{staff.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10} /> {staff.email}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10} /> {staff.phone}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{staff.position}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{staff.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {staff.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(staff)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(staff._id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {staffList.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No staff members found. Hire someone!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative h-[80vh] overflow-y-auto">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                    <select
                                        className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option value="">Select Dept</option>
                                        <option value="Front Desk">Front Desk</option>
                                        <option value="Housekeeping">Housekeeping</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Kitchen">Kitchen</option>
                                        <option value="Management">Management</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary ($)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.salary}
                                        onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Terminated">Terminated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
