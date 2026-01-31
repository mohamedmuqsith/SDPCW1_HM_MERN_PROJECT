import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Calendar, User, Shield, CheckCircle } from 'lucide-react';

const BookingPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Initial Dates (Tomorrow and Day After)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const formatDate = (date) => date.toISOString().split('T')[0];

    // Booking State
    const [checkIn, setCheckIn] = useState(formatDate(tomorrow));
    const [checkOut, setCheckOut] = useState(formatDate(dayAfter));
    const [room, setRoom] = useState(null);
    const [fetchingRoom, setFetchingRoom] = useState(true);
    const [dateError, setDateError] = useState(''); // NEW: Date validation error

    // ============================================
    // BOOKING VALIDATION CONFIGURATION (must match backend)
    // ============================================
    const BOOKING_CONFIG = {
        MAX_BOOKING_DAYS: 30,
        MIN_BOOKING_DAYS: 1,
    };

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`);
                if (response.ok) {
                    const data = await response.json();
                    setRoom(data);
                } else {
                    console.error('Room not found');
                    // navigate('/'); // Optional: redirect if not found
                }
            } catch (error) {
                console.error('Error fetching room:', error);
            } finally {
                setFetchingRoom(false);
            }
        };

        if (roomId) {
            fetchRoom();
        }
    }, [roomId]);

    // Form State
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiry: '',
        cvc: '',
        name: ''
    });
    const [errors, setErrors] = useState({});

    const { user } = useAuth(); // Assuming AuthContext provides user info

    const validateForm = () => {
        const newErrors = {};
        const { cardNumber, expiry, cvc, name } = formData;

        // Card Number: 16 digits
        const cleanCardNum = cardNumber.replace(/\s/g, '');
        if (!/^\d{16}$/.test(cleanCardNum)) {
            newErrors.cardNumber = 'Card number must be 16 digits';
        }

        // Expiry: MM/YY
        if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
            newErrors.expiry = 'Invalid expiry date (MM/YY)';
        } else {
            // Check if future
            const [month, year] = expiry.split('/');
            // Assume 20xx
            const expiryDate = new Date(2000 + parseInt(year), parseInt(month));
            // expiryDate is first day of next month, so we check if now is before that
            const now = new Date();

            // If expiry is 01/25, it expires at end of Jan 2025.
            // simpler check:
            const currentYear = now.getFullYear() % 100;
            const currentMonth = now.getMonth() + 1;
            const expMonth = parseInt(month);
            const expYear = parseInt(year);

            if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
                newErrors.expiry = 'Card has expired';
            }
        }

        // CVC: 3 or 4 digits
        if (!/^\d{3,4}$/.test(cvc)) {
            newErrors.cvc = 'CVC must be 3 or 4 digits';
        }

        // Name: required
        if (!name.trim()) {
            newErrors.name = 'Cardholder name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cardNumber') {
            // Allow only digits and spaces, max 19 chars (16 digits + 3 spaces)
            const digits = value.replace(/\D/g, '').slice(0, 16);
            formattedValue = digits.replace(/(\d{4})/g, '$1 ').trim();
        } else if (name === 'expiry') {
            // MM/YY masking
            const digits = value.replace(/\D/g, '').slice(0, 4);
            if (digits.length >= 3) {
                formattedValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
            } else if (digits.length >= 1) {
                formattedValue = digits;
            }
        } else if (name === 'cvc') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const calculateNights = () => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // ============================================
    // DATE VALIDATION (Frontend - TIMEZONE-SAFE)
    // Must match backend validation logic exactly
    // ============================================
    const validateBookingDates = () => {
        // Parse as LOCAL time using noon to avoid DST edge cases
        const checkInDate = new Date(checkIn + 'T12:00:00');
        const checkOutDate = new Date(checkOut + 'T12:00:00');

        // Get today at start of day (LOCAL time)
        const now = new Date();
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get date portion only (ignores time)
        const checkInDateOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
        const todayStr = now.toISOString().split('T')[0];

        // 1. STRICT: Check-in cannot be in the past
        if (checkInDateOnly < todayDate) {
            return `Selected check-in date has already passed. You selected ${checkIn}, but today is ${todayStr}.`;
        }

        // 2. Check-out must be after check-in
        if (checkOutDate <= checkInDate) {
            return 'Check-out date must be after check-in date.';
        }

        // 3. Calculate duration
        const diffDays = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        // 4. Minimum stay
        if (diffDays < BOOKING_CONFIG.MIN_BOOKING_DAYS) {
            return `Minimum booking is ${BOOKING_CONFIG.MIN_BOOKING_DAYS} night(s).`;
        }

        // 5. Maximum duration
        if (diffDays > BOOKING_CONFIG.MAX_BOOKING_DAYS) {
            return `Maximum booking is ${BOOKING_CONFIG.MAX_BOOKING_DAYS} days. You selected ${diffDays} days.`;
        }

        return ''; // No error
    };

    const nights = calculateNights();
    // Safety check for pricing
    const pricePerNight = room ? room.price : 0;
    const totalPrice = nights * pricePerNight;

    const handlePayment = async (e) => {
        e.preventDefault();

        // Validate card form
        if (!validateForm()) {
            return;
        }

        // ==========================================
        // STRICT DATE VALIDATION (Frontend layer)
        // ==========================================
        const dateValidationError = validateBookingDates();
        if (dateValidationError) {
            setDateError(dateValidationError);
            return;
        }
        setDateError(''); // Clear any previous error

        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    roomName: `Room ${room.number}`,
                    roomType: room.type,
                    checkIn,
                    checkOut,
                    totalPrice
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep(3); // Success step
            } else {
                // Show server validation error (backend is the source of truth)
                setDateError(data.message || 'Booking failed. Please check your dates.');
            }
        } catch (error) {
            console.error('Booking Error:', error);
            setDateError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingRoom) {
        return <div className="min-h-screen flex items-center justify-center">Loading Room Details...</div>;
    }

    if (!room) {
        return <div className="min-h-screen flex items-center justify-center">Room not found.</div>;
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Request Sent</h2>
                    <p className="text-slate-500 mb-6">
                        Your payment has been authorized. Your booking is <strong>Pending Approval</strong>.
                        <br />
                        You will receive a confirmation email once the administrator approves your stay.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold"
                    >
                        Return Home
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
                                <img
                                    src={room.image?.startsWith('http') ? room.image : `http://localhost:5000${room.image}`}
                                    alt={room.number}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80'; }}
                                />
                            </div>
                            <div className="space-y-3 pb-4 border-b border-slate-100">
                                <div>
                                    <p className="text-sm text-slate-500">Room Type</p>
                                    <p className="font-medium text-slate-900">{room.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Selected Room</p>
                                    <p className="font-medium text-slate-900">Room {room.number}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Check-in</p>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            min={formatDate(new Date())}
                                            onChange={(e) => {
                                                setCheckIn(e.target.value);
                                                // Auto-adjust checkout if invalid
                                                if (e.target.value >= checkOut) {
                                                    const newStart = new Date(e.target.value);
                                                    newStart.setDate(newStart.getDate() + 1);
                                                    setCheckOut(formatDate(newStart));
                                                }
                                            }}
                                            className="w-full text-sm border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Check-out</p>
                                        <input
                                            type="date"
                                            value={checkOut}
                                            min={checkIn}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            className="w-full text-sm border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500 mt-2">
                                    <span>${room.price} x {nights} nights</span>
                                    <span>${totalPrice}</span>
                                </div>
                                {/* Warning if nights exceed max */}
                                {nights > BOOKING_CONFIG.MAX_BOOKING_DAYS && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-xs text-red-600 font-medium">
                                            ⚠️ Maximum {BOOKING_CONFIG.MAX_BOOKING_DAYS} days allowed. Please adjust dates.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="text-xl font-bold text-primary-600">${totalPrice}</span>
                            </div>
                            {/* Date Validation Error Display */}
                            {dateError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
                                    <p className="text-sm text-red-700 font-medium">❌ {dateError}</p>
                                </div>
                            )}
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
                                                name="cardNumber"
                                                value={formData.cardNumber}
                                                onChange={handleChange}
                                                placeholder="0000 0000 0000 0000"
                                                className={`block w-full pl-10 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${errors.cardNumber ? 'border-red-500' : 'border-slate-300'}`}
                                                maxLength={19}
                                            />
                                        </div>
                                        {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Expiration Date</label>
                                            <input
                                                type="text"
                                                name="expiry"
                                                value={formData.expiry}
                                                onChange={handleChange}
                                                placeholder="MM / YY"
                                                className={`block w-full border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${errors.expiry ? 'border-red-500' : 'border-slate-300'}`}
                                                maxLength={5}
                                            />
                                            {errors.expiry && <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">CVC</label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    name="cvc"
                                                    value={formData.cvc}
                                                    onChange={handleChange}
                                                    placeholder="123"
                                                    className={`block w-full pl-9 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${errors.cvc ? 'border-red-500' : 'border-slate-300'}`}
                                                    maxLength={4}
                                                />
                                            </div>
                                            {errors.cvc && <p className="text-red-500 text-sm mt-1">{errors.cvc}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Cardholder Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Full Name on Card"
                                                className={`block w-full pl-10 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                                            />
                                        </div>
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
                                        `Pay $${totalPrice}`
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
