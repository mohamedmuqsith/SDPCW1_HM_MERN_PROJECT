
import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight } from 'lucide-react';

const cities = {
    'Metropolis': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop',
    'Seaside': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop',
    'City Center': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop',
    'Highlands': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop',
    'Watertown': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop'
};

const hotels = [
    { id: 1, name: 'Central Hotel', address: '123 Main St, Metropolis', city: 'Metropolis', rating: 4.5, image: cities['Metropolis'] },
    { id: 2, name: 'Grand Plaza Resort', address: '456 Ocean Dr, Seaside', city: 'Seaside', rating: 5.0, image: cities['Seaside'] },
    { id: 3, name: 'Urban Inn', address: '789 Downtown Ave, City Center', city: 'City Center', rating: 4.2, image: cities['City Center'] },
    { id: 4, name: 'Mountain View Lodge', address: '101 Hilltop Rd, Highlands', city: 'Highlands', rating: 4.7, image: cities['Highlands'] },
    { id: 5, name: 'Lakeside Retreat', address: '202 Lake Ln, Watertown', city: 'Watertown', rating: 4.8, image: cities['Watertown'] }
];

const HotelsList = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Discover Our Luxury Hotels
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Experience world-class hospitality across our five exclusive locations.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {hotels.map((hotel) => (
                        <div key={hotel.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={hotel.image}
                                    alt={hotel.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold text-slate-900 shadow-sm">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    {hotel.rating}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{hotel.name}</h3>
                                <div className="flex items-center text-slate-500 mb-6 text-sm">
                                    <MapPin className="w-4 h-4 mr-1 text-primary-500" />
                                    {hotel.address}
                                </div>
                                <Link
                                    to={`/rooms?hotel=${encodeURIComponent(hotel.name)}`}
                                    className="w-full text-center bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 group-hover:gap-3"
                                >
                                    View Rooms <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HotelsList;
