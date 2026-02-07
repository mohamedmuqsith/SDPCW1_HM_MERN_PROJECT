import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import BookingModal from '../../components/guest/BookingModal';

const EventHalls = () => {
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHall, setSelectedHall] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchHalls();
    }, []);

    const fetchHalls = async () => {
        try {
            // Fetch rooms where category is 'Hall'
            const res = await axios.get('http://localhost:5000/api/rooms?category=Hall');
            setHalls(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching halls:', error);
            setLoading(false);
        }
    };

    const handleBookClick = (hall) => {
        setSelectedHall(hall);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedHall(null);
    };

    if (loading) return <div className="text-center p-10">Loading Event Spaces...</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2">Event Halls & Conference Rooms</h1>
            <p className="text-gray-600 mb-8">Book strictly for your meetings, parties, and corporate events.</p>

            {halls.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                    <p>No event halls are currently listed. Please contact reception.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {halls.map((hall) => (
                        <div key={hall._id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                            <img
                                src={hall.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'}
                                alt={hall.type}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-800">{hall.type}</h3>
                                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full uppercase font-medium tracking-wide">
                                        Max {hall.capacity || 50}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hall.description}</p>

                                <div className="flex justify-between items-center mt-4">
                                    <div>
                                        <p className="text-gray-900 font-bold text-lg">${hall.price}</p>
                                        <p className="text-gray-500 text-xs">/ hour</p>
                                    </div>
                                    <button
                                        onClick={() => handleBookClick(hall)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                                    >
                                        Book Space
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && selectedHall && (
                <BookingModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    room={selectedHall}
                    isEvent={true} // Passed flag for logic
                />
            )}
        </div>
    );
};

export default EventHalls;
