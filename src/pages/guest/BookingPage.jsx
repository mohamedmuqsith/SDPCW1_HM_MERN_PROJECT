import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Calendar, User, Shield, CheckCircle } from 'lucide-react';

const BookingPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Mock room data (in a real app, fetch from API based on roomId)
    const room = {
        name: 'Deluxe Ocean View',
        price: 299,
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80',
        type: 'Suite'
    };

    const { user } = useAuth(); // Assuming AuthContext provides user info

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Calculate dates (Mock: Dec 20-22)
        const checkIn = new Date('2024-12-20');
        const checkOut = new Date('2024-12-22');

        try {
            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id || user._id, // Ensure we send the correct ID field
                    roomName: room.name,
                    roomType: room.type,
                    checkIn,
                    checkOut,
                    totalPrice: room.price * 2
                }),
            });

            if (response.ok) {
                setStep(3); // Success step
            } else {
                alert('Booking Failed. Please try again.');
            }
        } catch (error) {
            console.error('Booking Error:', error);
            alert('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-slate-500 mb-6">
                        Your payment was successful. A confirmation email has been sent to your inbox.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Booking Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Booking Summary</h3>
                            <div className="aspect-video rounded-lg overflow-hidden mb-4">
                                <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-3 pb-4 border-b border-slate-100">
                                <div>
                                    <p className="text-sm text-slate-500">Room Type</p>
                                    <p className="font-medium text-slate-900">{room.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Selected Room</p>
                                    <p className="font-medium text-slate-900">{room.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-sm text-slate-500">Check-in</p>
                                        <p className="font-medium text-slate-900">Dec 20, 2024</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Check-out</p>
                                        <p className="font-medium text-slate-900">Dec 22, 2024</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="text-xl font-bold text-primary-600">${room.price * 2}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center space-x-2 mb-6">
                                <CreditCard className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-slate-900">Secure Payment</h2>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4 p-4 border border-primary-200 bg-primary-50 rounded-lg">
                                        <div className="w-4 h-4 rounded-full border-[5px] border-primary-600 bg-white" />
                                        <span className="font-medium text-slate-900">Credit or Debit Card</span>
                                        <div className="flex-1 flex justify-end gap-2">
                                            {/* Fake Card Icons */}
                                            <div className="w-8 h-5 bg-slate-200 rounded" />
                                            <div className="w-8 h-5 bg-slate-200 rounded" />
                                            <div className="w-8 h-5 bg-slate-200 rounded" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Card Information</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Expiration Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM / YY"
                                                className="block w-full border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">CVC</label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    className="block w-full pl-9 border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Cardholder Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder="Full Name on Card"
                                                className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        `Pay $${room.price * 2}`
                                    )}
                                </button>

                                <p className="text-center text-xs text-slate-500 flex items-center justify-center">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Payments are secure and encrypted
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
