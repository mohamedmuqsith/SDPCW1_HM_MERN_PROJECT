import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Tag, DollarSign, CheckCircle } from 'lucide-react';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Dining',
        price: '',
        description: '',
        available: true
    });

    const fetchServices = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/services');
            if (response.ok) {
                const data = await response.json();
                setServices(data);
            }
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingService
                ? `http://localhost:5000/api/services/${editingService._id}`
                : 'http://localhost:5000/api/services';

            const method = editingService ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchServices();
                closeModal();
            } else {
                alert('Failed to save service');
            }
        } catch (error) {
            console.error('Error saving service:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            await fetch(`http://localhost:5000/api/services/${id}`, { method: 'DELETE' });
            fetchServices();
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const openModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                category: service.category,
                price: service.price,
                description: service.description,
                available: service.available
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                category: 'Dining',
                price: '',
                description: '',
                available: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Service Management</h3>
                <button
                    onClick={() => openModal()}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
                >
                    <Plus size={16} /> Add Service
                </button>
            </div>

            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {services.map((service) => (
                        <tr key={service._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-slate-900">{service.name}</div>
                                <div className="text-xs text-slate-500 truncate max-w-xs">{service.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    <Tag size={12} /> {service.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">${service.price}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${service.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {service.available ? 'Available' : 'Unavailable'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => openModal(service)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(service._id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                    {services.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No services found. create one!</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Dining">Dining</option>
                                    <option value="Wellness">Wellness (Spa/Gym)</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Housekeeping">Housekeeping</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="available"
                                    className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                                    checked={formData.available}
                                    onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                />
                                <label htmlFor="available" className="ml-2 block text-sm text-slate-700">Available for booking</label>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Service</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceManagement;
