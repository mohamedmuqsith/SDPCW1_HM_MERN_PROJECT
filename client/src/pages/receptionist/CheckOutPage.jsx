import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Calendar, DollarSign, CreditCard, Banknote, Receipt } from 'lucide-react';

const CheckOutPage = () => {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [billPreview, setBillPreview] = useState(null);

    const fetchCheckedInBookings = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/receptionist/bookings?status=Checked In', {
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
        if (token) fetchCheckedInBookings();
    }, [token]);

    const calculateBill = (booking) => {
        const checkInDate = new Date(booking.actualCheckIn || booking.checkIn);
        const checkOutDate = new Date();
        const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

        const originalNights = Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)));
        const roomRate = booking.totalPrice / originalNights;
        const roomTotal = roomRate * nights;
        const servicesTotal = booking.charges ? booking.charges.reduce((sum, c) => sum + c.amount, 0) : 0;
        const subtotal = roomTotal + servicesTotal;
        const taxRate = 0.08;
        const taxAmount = subtotal * taxRate;
        const totalBill = subtotal + taxAmount;
        const advancePaid = booking.advanceDeposit || 0;
        const payableAmount = totalBill - advancePaid;

        return {
            nights,
            roomRate: roomRate.toFixed(2),
            roomTotal: roomTotal.toFixed(2),
            servicesTotal: servicesTotal.toFixed(2),
            subtotal: subtotal.toFixed(2),
            taxRate: (taxRate * 100).toFixed(0),
            taxAmount: taxAmount.toFixed(2),
            totalBill: totalBill.toFixed(2),
            advancePaid: advancePaid.toFixed(2),
            payableAmount: payableAmount.toFixed(2),
            charges: booking.charges || []
        };
    };

    const processCheckOut = async (bookingId, paymentMethod) => {
        if (!billPreview) return;

        setProcessing(bookingId);
        try {
            const response = await fetch(`http://localhost:5000/api/receptionist/bookings/${bookingId}/checkout`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paymentMethod,
                    paidAmount: parseFloat(billPreview.payableAmount)
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`✅ ${data.message}\n\n${data.reason}\n\nInvoice: ${data.invoice._id}`);
                setSelectedBooking(null);
                setBillPreview(null);
                fetchCheckedInBookings();
            } else {
                alert(`❌ ${data.message}\n${data.reason || ''}`);
            }
        } catch (error) {
            alert('Failed to process check-out');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                    <LogOut className="w-8 h-8 mr-3 text-purple-600" />
                    Guest Check-Out
                </h1>
                <p className="text-slate-500">Process departures and generate final invoices</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Checked-In Guests List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-purple-50">
                        <h3 className="text-lg font-bold text-slate-900">In-House Guests</h3>
                        <p className="text-sm text-slate-500">Select a guest to process check-out</p>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Loading...</div>
                        ) : bookings.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic">
                                No guests currently checked in.
                            </div>
                        ) : (
                            bookings.map((booking) => (
                                <div
                                    key={booking._id}
                                    onClick={() => {
                                        setSelectedBooking(booking);
                                        setBillPreview(calculateBill(booking));
                                    }}
                                    className={`p-4 cursor-pointer transition-colors ${selectedBooking?._id === booking._id
                                            ? 'bg-purple-50 border-l-4 border-purple-500'
                                            : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="font-bold text-slate-900">{booking.user?.name || 'Guest'}</div>
                                    <div className="text-sm text-slate-500">
                                        {booking.assignedRoom || booking.roomName} • Since {new Date(booking.actualCheckIn).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Bill Preview & Payment */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-green-50">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center">
                            <Receipt className="w-5 h-5 mr-2" />
                            Final Invoice Preview
                        </h3>
                    </div>

                    {!selectedBooking ? (
                        <div className="p-8 text-center text-slate-400 italic">
                            Select a guest from the list to preview their bill.
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="mb-4 pb-4 border-b border-slate-100">
                                <h4 className="font-bold text-lg">{selectedBooking.user?.name}</h4>
                                <p className="text-slate-500">{selectedBooking.assignedRoom || selectedBooking.roomName}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Room ({billPreview.nights} nights @ ${billPreview.roomRate})</span>
                                    <span>${billPreview.roomTotal}</span>
                                </div>

                                {billPreview.charges.map((charge, i) => (
                                    <div key={i} className="flex justify-between text-slate-600">
                                        <span>{charge.description}</span>
                                        <span>${charge.amount.toFixed(2)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between border-t pt-2 mt-2">
                                    <span>Subtotal</span>
                                    <span>${billPreview.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Tax ({billPreview.taxRate}%)</span>
                                    <span>${billPreview.taxAmount}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                    <span>Total</span>
                                    <span>${billPreview.totalBill}</span>
                                </div>

                                {parseFloat(billPreview.advancePaid) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Advance Paid</span>
                                        <span>- ${billPreview.advancePaid}</span>
                                    </div>
                                )}

                                <div className="flex justify-between font-bold text-xl text-purple-700 border-t pt-2 mt-2">
                                    <span>Amount Due</span>
                                    <span>${billPreview.payableAmount}</span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <p className="text-sm text-slate-500 font-medium">Payment Method:</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => processCheckOut(selectedBooking._id, 'cash')}
                                        disabled={processing}
                                        className="py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        <Banknote size={18} className="mr-2" />
                                        Cash
                                    </button>
                                    <button
                                        onClick={() => processCheckOut(selectedBooking._id, 'card')}
                                        disabled={processing}
                                        className="py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        <CreditCard size={18} className="mr-2" />
                                        Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckOutPage;
