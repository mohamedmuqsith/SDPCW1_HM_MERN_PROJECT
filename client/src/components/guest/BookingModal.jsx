import { useState, useEffect } from 'react';
import { X, Calendar, User, CreditCard, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BookingModal = ({ room, isOpen, onClose }) => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Dates
    const today = new Date().toISOString().split('T')[0];
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');

    // Payment Form
    const [payment, setPayment] = useState({
        cardNumber: '',
        expiry: '',
        cvc: '',
        name: ''
    });

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setStep(1);
            setLoading(false);
            setError(null);

            // Default dates: tomorrow and day after
            const tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            const da = new Date();
            da.setDate(da.getDate() + 2);

            setCheckIn(tmr.toISOString().split('T')[0]);
            setCheckOut(da.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    if (!isOpen || !room) return null;

    const calculateTotal = () => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights * room.price : 0;
    };

    const total = calculateTotal();
    const nights = total / room.price;

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        // Basic formatting logic (simplified for modal)
        let formatted = value;
        if (name === 'cardNumber') formatted = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
        if (name === 'expiry') formatted = value.replace(/\D/g, '').replace(/^(\d{2})(\d{0,2})/, '$1/$2').slice(0, 5);
        if (name === 'cvc') formatted = value.replace(/\D/g, '').slice(0, 4);

        setPayment(prev => ({ ...prev, [name]: formatted }));
    };

    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Validate Dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0); // Normalize today to start of day

        if (checkInDate < todayDate) {
            setError('Check-in date cannot be in the past.');
            return;
        }

        if (checkOutDate <= checkInDate) {
            setError('Check-out date must be after check-in date.');
            return;
        }

        if (!payment.cardNumber || !payment.expiry || !payment.cvc || !payment.name) {
            setError('Please complete payment details');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    roomName: room.name, // Use name directly as number might be missing in mapped object
                    roomType: room.type,
                    hotelName: room.hotelName || 'Central Hotel', // Include hotel name
                    checkIn,
                    checkOut,
                    totalPrice: total
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStep(2); // Success step
                // Auto close after 2s
                setTimeout(() => {
                    onClose();
                    navigate('/dashboard'); // Go to active reservations
                }, 2000);
            } else if (res.status === 409) {
                setError('This room is already reserved for the selected dates. Please try different dates or another room.');
            } else {
                setError(data.message || 'Booking failed');
            }
        } catch (err) {
            console.error(err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-900">Book {room.name}</h3>
                        <p className="text-xs text-slate-500">{room.hotelName} • {room.type}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <>
                            {/* Room Summary */}
                            <div className="flex gap-4 mb-6">
                                <img
                                    src={room.image.startsWith('http') ? room.image : `http://localhost:5000${room.image}`}
                                    className="w-20 h-20 rounded-lg object-cover"
                                    alt="Room"
                                />
                                <div>
                                    <div className="text-2xl font-bold text-primary-600">${room.price} <span className="text-sm text-slate-400 font-normal">/ night</span></div>
                                    <div className="flex gap-2 mt-2">
                                        {room.amenities?.slice(0, 3).map((a, i) => (
                                            <span key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600">{a}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Check In</label>
                                    <input
                                        type="date"
                                        value={checkIn}
                                        min={today}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Check Out</label>
                                    <input
                                        type="date"
                                        value={checkOut}
                                        min={checkIn}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Total Calculation */}
                            <div className="bg-blue-50 p-4 rounded-xl mb-6 flex justify-between items-center text-blue-900">
                                <span className="text-sm font-medium">{nights} Nights Stay</span>
                                <span className="text-xl font-bold">${total}</span>
                            </div>

                            {/* Payment Form (Simplified) */}
                            <div className="space-y-4 mb-6">
                                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <CreditCard size={16} /> Payment Details
                                </p>
                                <input
                                    name="cardNumber"
                                    placeholder="Card Number"
                                    value={payment.cardNumber}
                                    onChange={handlePaymentChange}
                                    className="w-full text-sm border-slate-200 rounded-lg"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        name="expiry"
                                        placeholder="MM/YY"
                                        value={payment.expiry}
                                        onChange={handlePaymentChange}
                                        className="w-full text-sm border-slate-200 rounded-lg"
                                    />
                                    <input
                                        name="cvc"
                                        placeholder="CVC"
                                        value={payment.cvc}
                                        onChange={handlePaymentChange}
                                        className="w-full text-sm border-slate-200 rounded-lg"
                                    />
                                </div>
                                <input
                                    name="name"
                                    placeholder="Cardholder Name"
                                    value={payment.name}
                                    onChange={handlePaymentChange}
                                    className="w-full text-sm border-slate-200 rounded-lg"
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <Shield size={16} /> {error}
                                </div>
                            )}

                            <button
                                onClick={handleBooking}
                                disabled={loading || total <= 0}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : `Pay $${total} & Book`}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Request Sent!</h3>
                            <p className="text-slate-500">
                                Your reservation has been <strong>instantly received</strong>.
                                <br />We will notify you immediately once it is approved.
                            </p>
                            <p className="text-xs text-slate-400 mt-4">Redirecting to your dashboard...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
