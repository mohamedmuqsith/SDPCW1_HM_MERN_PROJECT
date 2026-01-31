
import { X, Wifi, Coffee, Tv, Wind, Check } from 'lucide-react';

const RoomDetailsModal = ({ room, isOpen, onClose, onBook }) => {
    if (!isOpen || !room) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">

                {/* Image Header */}
                <div className="relative h-64">
                    <img
                        src={room.image.startsWith('http') ? room.image : `http://localhost:5000${room.image}`}
                        alt={room.name}
                        className="w-full h-full object-cover"
                    />
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-colors text-white">
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-4">
                        <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide border border-white/20">
                            {room.hotelName}
                        </span>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">{room.name}</h2>
                            <p className="text-slate-500 mt-1">{room.type} Suite</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-primary-600">${room.price}</p>
                            <p className="text-sm text-slate-400">/ night</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Description</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {room.description || "Experience standard-setting luxury. This room features varied amenities, breathtaking views, and the comfort you deserve. Perfect for both business travelers and leisure seekers."}
                        </p>
                    </div>

                    {/* Amenities */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Amenities</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {room.amenities && room.amenities.map((amenity, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {amenity === 'Wifi' && <Wifi size={18} className="text-primary-500" />}
                                    {amenity === 'Coffee' && <Coffee size={18} className="text-primary-500" />}
                                    {amenity === 'TV' && <Tv size={18} className="text-primary-500" />}
                                    {amenity === 'AC' && <Wind size={18} className="text-primary-500" />}
                                    {!['Wifi', 'Coffee', 'TV', 'AC'].includes(amenity) && <Check size={18} className="text-primary-500" />}
                                    <span className="text-sm font-medium">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Policies */}
                    <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <h3 className="text-base font-bold text-orange-800 mb-2">Cancellation Policy</h3>
                        <p className="text-sm text-orange-700">
                            Free cancellation until 24 hours before check-in. Cancellations made after that time will be charged one night's room rate.
                        </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={onBook}
                            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Book Now
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RoomDetailsModal;
