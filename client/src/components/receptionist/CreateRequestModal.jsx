import { useState } from 'react';
import { X, Play, AlertTriangle } from 'lucide-react';

const CreateRequestModal = ({ isOpen, onClose, onCreate }) => {
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        roomNumber: '',
        type: 'Housekeeping',
        priority: 'Medium',
        details: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onCreate(formData);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="text-indigo-500" /> Create Service Request
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                        <input
                            name="roomNumber"
                            value={formData.roomNumber}
                            onChange={handleChange}
                            placeholder="e.g. 101"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Housekeeping">Housekeeping</option>
                                <option value="Room Service">Room Service</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Tech Support">Tech Support</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                        <textarea
                            name="details"
                            value={formData.details}
                            onChange={handleChange}
                            required
                            rows="3"
                            placeholder="Describe the request..."
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        ></textarea>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Creating...' : <><Play size={16} /> Create Request</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRequestModal;
