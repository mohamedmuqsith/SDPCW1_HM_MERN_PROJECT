import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Calendar, Users, Loader2 } from 'lucide-react';
import RoomCard from '../../components/guest/RoomCard';

const RoomSearch = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/rooms');
                if (response.ok) {
                    const data = await response.json();
                    // Map API data structure to UI component structure if needed
                    const formattedRooms = data.map(room => ({
                        id: room._id,
                        name: `Room ${room.number}`, // Or add a name field to backend
                        type: room.type,
                        price: room.price,
                        rating: 4.8, // Default rating 
                        reviews: 24, // Default reviews
                        image: room.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80',
                        description: room.description,
                        amenities: room.amenities || ['Wifi', 'TV', 'AC']
                    }));
                    setRooms(formattedRooms);
                }
            } catch (error) {
                console.error("Failed to fetch rooms", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || room.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Search Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0">
                            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                                {['All', 'Standard', 'Suite', 'Luxury', 'Deluxe'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterType === type
                                            ? 'bg-white text-primary-700 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-4 text-sm text-slate-500">
                        <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-full">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Check-in — Check-out</span>
                        </div>
                        <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-full">
                            <Users className="w-4 h-4 mr-2" />
                            <span>2 Guests</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600 h-8 w-8" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRooms.map((room) => (
                            <RoomCard key={room.id} room={room} />
                        ))}
                    </div>
                )}

                {!loading && filteredRooms.length === 0 && (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-medium text-slate-900">No rooms found</h3>
                        <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomSearch;
