import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, MapPin, Phone, Mail, Star, Edit, Trash2, Plus, X } from 'lucide-react';

const HotelManagement = () => {
    const { token } = useAuth();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentHotel, setCurrentHotel] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        description: '',
        phone: '',
        email: '',
        starRating: 4
    });

    const fetchHotels = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hotels', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setHotels(await res.json());
        } catch (error) {
            console.error('Fetch Hotels Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchHotels();
    }, [token]);

    const handleEdit = (hotel) => {
        setCurrentHotel(hotel);
        setFormData({
            name: hotel.name,
            address: hotel.address,
            description: hotel.description,
            phone: hotel.phone,
            email: hotel.email,
            starRating: hotel.starRating
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This may affect rooms linked to this hotel.')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/hotels/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchHotels();
        } catch (error) {
            console.error('Delete Hotel Error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = currentHotel
            ? `http://localhost:5000/api/hotels/${currentHotel._id}`
            : 'http://localhost:5000/api/hotels';
        const method = currentHotel ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setCurrentHotel(null);
                setFormData({ name: '', address: '', description: '', phone: '', email: '', starRating: 4 });
                fetchHotels();
            }
        } catch (error) {
            console.error('Save Hotel Error:', error);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Loading hotel data...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hotel Registry</h2>
                    <p className="text-slate-500 font-medium">Manage properties and global settings</p>
                </div>
                <button
                    onClick={() => { setCurrentHotel(null); setFormData({ name: '', address: '', description: '', phone: '', email: '', starRating: 4 }); setIsModalOpen(true); }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-200 active:scale-95"
                >
                    <Plus size={20} /> Add New Hotel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                    <div key={hotel._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleEdit(hotel)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(hotel._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                        </div>

                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-4 bg-primary-100 text-primary-600 rounded-2xl">
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{hotel.name}</h3>
                                <div className="flex text-yellow-500">
                                    {[...Array(hotel.starRating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm font-medium">
                            <div className="flex items-center gap-3 text-slate-600">
                                <MapPin size={18} className="text-slate-400" />
                                <span>{hotel.address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone size={18} className="text-slate-400" />
                                <span>{hotel.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail size={18} className="text-slate-400" />
                                <span>{hotel.email}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50">
                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 italic">
                                "{hotel.description}"
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-900 font-serif">{currentHotel ? 'Update Property' : 'New Property'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-white rounded-full"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Hotel Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Grand Hilton Metropolis"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Address</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-primary-500 focus:border-primary-500 transition-all font-bold"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Star Rating</label>
                                    <select
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-primary-500 focus:border-primary-500 transition-all font-bold"
                                        value={formData.starRating}
                                        onChange={(e) => setFormData({ ...formData, starRating: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} Star</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Description</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium h-24"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
                                >
                                    {currentHotel ? 'Update Property' : 'Save Property'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelManagement;
