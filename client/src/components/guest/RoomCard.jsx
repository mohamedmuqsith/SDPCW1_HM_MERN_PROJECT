import { Star, Wifi, Coffee, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

const RoomCard = ({ room, onBookClick }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="relative h-64 overflow-hidden">
                <img
                    src={room.image.startsWith('/uploads') ? `http://localhost:5000${room.image}` : room.image}
                    alt={room.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary-700 uppercase tracking-wide shadow-sm">
                    {room.type}
                </div>
                <div className="absolute bottom-4 left-4 flex gap-2">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                        <div key={idx} className="bg-slate-900/60 backdrop-blur-md p-1.5 rounded-lg text-white" title={amenity}>
                            {amenity === 'Wifi' && <Wifi size={14} />}
                            {amenity === 'Coffee' && <Coffee size={14} />}
                            {amenity === 'TV' && <Tv size={14} />}
                            {/* Fallback for others */}
                            {!['Wifi', 'Coffee', 'TV'].includes(amenity) && <Star size={14} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{room.name}</h3>
                        <div className="flex items-center text-yellow-500 text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="ml-1 font-medium text-slate-700">{room.rating}</span>
                            <span className="mx-1 text-slate-300">•</span>
                            <span className="text-slate-500">{room.reviews} reviews</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">${room.price}</p>
                        <p className="text-sm text-slate-400">/ night</p>
                    </div>
                </div>

                <p className="text-slate-500 text-sm mb-6 line-clamp-2">
                    {room.description}
                </p>

                <button
                    onClick={onBookClick} // This now triggers Details View
                    className="block w-full text-center bg-slate-900 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                    View Details
                </button>
            </div>
        </div>
    );
};

export default RoomCard;
