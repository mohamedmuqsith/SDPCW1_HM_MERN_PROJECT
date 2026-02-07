import { useState, useEffect } from 'react';
import { Search, Calendar, Users, Loader2, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import RoomDetailsModal from '../../components/guest/RoomDetailsModal';
import BookingModal from '../../components/guest/BookingModal';
import RoomCard from '../../components/guest/RoomCard';

const RoomSearch = () => {
    const [searchParams] = useSearchParams();
    const urlHotel = searchParams.get('hotel');

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [dates, setDates] = useState({ checkIn: '', checkOut: '' });

    // Modal States
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Helper to get tomorrow's date format YYYY-MM-DD
    const getTomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            try {
                // Construct Query Params
                const params = new URLSearchParams();
                if (dates.checkIn && dates.checkOut) {
                    params.append('checkIn', dates.checkIn);
                    params.append('checkOut', dates.checkOut);
                }
                if (filterType !== 'All') params.append('type', filterType);
                if (urlHotel) params.append('hotel', urlHotel);

                // Simulate fetch delay for realism
                // await new Promise(r => setTimeout(r, 500)); 

                const response = await fetch(`http://localhost:5000/api/rooms?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();

                    // Format Data & Map fake hotel info if missing
                    const formattedRooms = data.map((room, index) => ({
                        id: room._id,
                        number: room.number,
                        name: `Room ${room.number}`,
                        type: room.type,
                        price: room.price,
                        rating: 4.8,
                        reviews: 24,
                        image: room.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80',
                        description: room.description,
                        amenities: room.amenities || ['Wifi', 'TV', 'AC'],
                        hotelName: room.hotelName || (index % 2 === 0 ? 'Central Hotel' : 'Grand Plaza Resort'),
                        address: room.address || (index % 2 === 0 ? '123 Main St, Metropolis' : '456 Ocean Dr, Seaside')
                    }));
                    setRooms(formattedRooms);
                }
            } catch (error) {
                console.error("Failed to fetch rooms", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchRooms, 300); // 300ms debounce
        return () => clearTimeout(timeout);
    }, [urlHotel, filterType, dates]);

    const filteredRooms = rooms.filter(room => {
        // Client-side text search (Backend handles dates/types)
        return room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.hotelName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Group by Hotel
    const roomsByHotel = filteredRooms.reduce((acc, room) => {
        const hotel = room.hotelName;
        if (!acc[hotel]) acc[hotel] = { address: room.address, rooms: [] };
        acc[hotel].rooms.push(room);
        return acc;
    }, {});

    const handleViewDetails = (room) => {
        setSelectedRoom(room);
        setIsDetailsOpen(true);
    };

    const handleProceedToBook = () => {
        setIsDetailsOpen(false);
        setIsBookingOpen(true);
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Search Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative grow">
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

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                        <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-full">
                            <Calendar className="w-4 h-4 mr-2" />
                            <input
                                type="date"
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-600 w-28"
                                value={dates.checkIn}
                                onChange={(e) => setDates({ ...dates, checkIn: e.target.value })}
                            />
                            <span className="mx-2">—</span>
                            <input
                                type="date"
                                className="bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-600 w-28"
                                value={dates.checkOut}
                                onChange={(e) => setDates({ ...dates, checkOut: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-full">
                            <Users className="w-4 h-4 mr-2" />
                            <span>1-4 Guests</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600 h-8 w-8" /></div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(roomsByHotel).map(([hotelName, data]) => (
                            <div key={hotelName} className="animate-fade-in">
                                <div className="flex items-end justify-between mb-6 border-b border-slate-200 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{hotelName}</h2>
                                        <div className="flex items-center text-slate-500 mt-1 text-sm">
                                            <MapPin size={16} className="mr-1" />
                                            {data.address}
                                        </div>
                                    </div>
                                    <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                        {data.rooms.length} Rooms Available
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {data.rooms.map((room) => (
                                        <div key={room.id} className="relative group">
                                            {/* Pass handleBookClick to RoomCard or handle internal? 
                                                Plan: RoomCard "View Details" -> RoomDetailsModal -> "Book" -> BookingModal.
                                            */}
                                            <RoomCard room={room} onBookClick={() => handleViewDetails(room)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
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


            <RoomDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                room={selectedRoom}
                onBook={handleProceedToBook}
            />

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                room={selectedRoom}
            />
        </div >
    );
};

export default RoomSearch;
