import { useState, useEffect } from 'react';
import { BedDouble, CheckCircle, AlertTriangle, PenTool } from 'lucide-react';

const StaffRoomStatus = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/rooms');
            if (response.ok) {
                const data = await response.json();
                setRooms(data);
            }
        } catch (error) {
            console.error("Failed to fetch rooms", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await fetch(`http://localhost:5000/api/rooms/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchRooms(); // Refresh
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-700 border-green-200';
            case 'Occupied': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Cleaning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Maintenance': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading rooms...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Room Status Management</h1>
                <p className="text-slate-500">View and update housekeeping status.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rooms.map((room) => (
                    <div key={room._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 flex justify-between items-start border-b border-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Room {room.number}</h3>
                                <p className="text-xs text-slate-500">{room.type}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(room.status)}`}>
                                {room.status}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Change Status To:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateStatus(room._id, 'Cleaning')}
                                    className="flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 text-xs font-medium transition-colors"
                                >
                                    <PenTool size={14} className="mr-1" /> Cleaning
                                </button>
                                <button
                                    onClick={() => updateStatus(room._id, 'Available')}
                                    className="flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:bg-green-50 hover:text-green-600 text-xs font-medium transition-colors"
                                >
                                    <CheckCircle size={14} className="mr-1" /> Available
                                </button>
                                <button
                                    onClick={() => updateStatus(room._id, 'Maintenance')}
                                    className="flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 text-xs font-medium transition-colors"
                                >
                                    <AlertTriangle size={14} className="mr-1" /> Maint.
                                </button>
                                <button
                                    onClick={() => updateStatus(room._id, 'Occupied')}
                                    className="flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-xs font-medium transition-colors"
                                >
                                    <BedDouble size={14} className="mr-1" /> Occupied
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StaffRoomStatus;
