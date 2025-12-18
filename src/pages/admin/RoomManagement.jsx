import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';

const RoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        number: '',
        type: 'Standard',
        price: '',
        status: 'Available'
    });

    const fetchRooms = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/rooms');
            if (response.ok) {
                const data = await response.json();
                setRooms(data);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingRoom
                ? `http://localhost:5000/api/rooms/${editingRoom._id}`
                : 'http://localhost:5000/api/rooms';

            const method = editingRoom ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchRooms();
                closeModal();
            } else {
                alert('Failed to save room');
            }
        } catch (error) {
            console.error('Error saving room:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this room?')) return;
        try {
            await fetch(`http://localhost:5000/api/rooms/${id}`, { method: 'DELETE' });
            fetchRooms();
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    };

    const openModal = (room = null) => {
        if (room) {
            setEditingRoom(room);
            setFormData({
                number: room.number,
                type: room.type,
                price: room.price,
                status: room.status
            });
        } else {
            setEditingRoom(null);
            setFormData({
                number: '',
                type: 'Standard',
                price: '',
                status: 'Available'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Room Management</h3>
                <button
                    onClick={() => openModal()}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
                >
                    <Plus size={16} /> Add Room
                </button>
            </div>

            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price/Night</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {rooms.map((room) => (
                        <tr key={room._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{room.number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{room.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${room.price}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${room.status === 'Available' ? 'bg-green-100 text-green-800' :
                                        room.status === 'Occupied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {room.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => openModal(room)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(room._id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                    {rooms.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No rooms found. Add one to get started.</td>
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
                        <h3 className="text-xl font-bold text-slate-900 mb-4">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-slate-300 rounded-lg"
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    className="w-full border-slate-300 rounded-lg"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Suite">Suite</option>
                                    <option value="Deluxe">Deluxe</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price per Night ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border-slate-300 rounded-lg"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    className="w-full border-slate-300 rounded-lg"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Cleaning">Cleaning</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomManagement;
