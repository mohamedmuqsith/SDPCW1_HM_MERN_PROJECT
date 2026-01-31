import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Calendar, DollarSign, Check, X, AlertCircle } from 'lucide-react';

const CheckInPage = () => {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    const fetchConfirmedBookings = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/receptionist/bookings?status=Confirmed', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchConfirmedBookings();
    }, [token]);

    const processCheckIn = async (bookingId) => {
        const idVerified = window.confirm('Have you verified the guest ID?');
        if (!idVerified) {
            alert('Guest ID must be verified before check-in.');
            return;
        }

        const assignedRoom = prompt('Assign Room Number:');
        const depositStr = prompt('Advance Deposit Amount (0 if none):');
        const advanceDeposit = parseFloat(depositStr) || 0;

        setProcessing(bookingId);
        try {
            const response = await fetch(`http://localhost:5000/api/receptionist/bookings/${bookingId}/checkin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    idVerified: true,
                    assignedRoom,
                    advanceDeposit
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`✅ ${data.message}\n\nCheck-In Slip: ${data.checkInSlip?.slipNumber}\nRoom: ${data.checkInSlip?.roomNumber}\nDeposit: $${data.checkInSlip?.depositCollected}`);
                fetchConfirmedBookings();
            } else {
                alert(`❌ ${data.message}\n${data.reason || ''}`);
            }
        } catch (error) {
            alert('Failed to process check-in');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                    <UserCheck className="w-8 h-8 mr-3 text-blue-600" />
                    Guest Check-In
                </h1>
                <p className="text-slate-500">Process arrivals for confirmed bookings</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-blue-50">
                    <h3 className="text-lg font-bold text-slate-900">Ready for Check-In</h3>
                    <p className="text-sm text-slate-500">Bookings with 'Confirmed' status</p>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading...</div>
                    ) : bookings.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">
                            No confirmed bookings awaiting check-in.
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <div key={booking._id} className="p-6 hover:bg-slate-50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-lg text-slate-900">
                                                {booking.user?.name || 'Guest'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${new Date(booking.checkIn).toDateString() === new Date().toDateString()
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {new Date(booking.checkIn).toDateString() === new Date().toDateString()
                                                    ? 'Today'
                                                    : new Date(booking.checkIn).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                            <span className="flex items-center">
                                                <Calendar size={14} className="mr-1" />
                                                {new Date(booking.checkIn).toLocaleDateString()} → {new Date(booking.checkOut).toLocaleDateString()}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                {booking.roomName} {booking.roomType && `(${booking.roomType})`}
                                            </span>
                                            <span className="flex items-center text-green-600 font-medium">
                                                <DollarSign size={14} />
                                                {booking.totalPrice}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => processCheckIn(booking._id)}
                                        disabled={processing === booking._id}
                                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center"
                                    >
                                        <UserCheck size={18} className="mr-2" />
                                        {processing === booking._id ? 'Processing...' : 'Check-In'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Check-In Checklist */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h4 className="font-bold text-amber-800 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Check-In Checklist
                </h4>
                <ul className="space-y-2 text-sm text-amber-700">
                    <li className="flex items-center"><Check size={16} className="mr-2 text-green-600" /> Verify guest photo ID</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-green-600" /> Confirm booking dates</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-green-600" /> Collect advance deposit (if applicable)</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-green-600" /> Provide WiFi password & room key</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-green-600" /> Explain check-out time & hotel policies</li>
                </ul>
            </div>
        </div>
    );
};

export default CheckInPage;
