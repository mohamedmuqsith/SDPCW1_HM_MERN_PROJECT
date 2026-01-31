import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Utensils, SprayCan, Wifi, Truck, BellRing, Loader2 } from 'lucide-react';

const ServiceRequest = () => {
    const { user, token } = useAuth(); // Get user and token from context
    const location = useLocation();
    const [selectedService, setSelectedService] = useState(location.state?.type || 'room_service');
    const [details, setDetails] = useState('');
    const [preferredTime, setPreferredTime] = useState(''); // New State
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const services = [
        { id: 'room_service', name: 'Room Service', icon: <Utensils className="w-6 h-6" /> },
        { id: 'housekeeping', name: 'Housekeeping', icon: <SprayCan className="w-6 h-6" /> },
        { id: 'technical', name: 'Tech Support', icon: <Wifi className="w-6 h-6" /> },
        { id: 'transport', name: 'Transport', icon: <Truck className="w-6 h-6" /> },
        { id: 'other', name: 'Other Inquiry', icon: <BellRing className="w-6 h-6" /> },
    ];

    // Map frontend service IDs to backend type names
    const serviceTypeMap = {
        'room_service': 'Room Service',
        'housekeeping': 'Housekeeping',
        'technical': 'Tech Support',
        'transport': 'Transport',
        'other': 'Other Inquiry'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            // Map the service ID to proper backend type name
            const serviceType = serviceTypeMap[selectedService] || selectedService;

            // Format time with AM/PM if provided
            let formattedTime = preferredTime;
            if (preferredTime) {
                const [hours, minutes] = preferredTime.split(':');
                const h = parseInt(hours, 10);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                formattedTime = `${h12}:${minutes} ${ampm}`;
            }

            const response = await fetch('http://localhost:5000/api/service-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    type: serviceType,  // Send proper type name
                    details: details,
                    preferredTime: formattedTime, // Send formatted time
                    roomNumber: '101'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMsg({ message: data.message, reason: data.reason });
                // FULL FORM RESET on success
                setDetails('');
                setPreferredTime(''); // Reset time
                setSelectedService('room_service'); // Reset to default service
                setTimeout(() => setSuccessMsg(''), 5000);
            } else {
                setErrorMsg({ message: data.message || 'Failed', reason: data.reason || 'Please try again.' });
            }
        } catch (error) {
            console.error('Request Error:', error);
            setErrorMsg({ message: 'Network Error', reason: 'Could not connect to server.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900">Request a Service</h1>
                <p className="text-slate-500 mt-2">How can we make your stay more comfortable?</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">

                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex flex-col text-green-700 animate-fade-in">
                        <div className="flex items-center font-semibold">
                            <BellRing className="w-5 h-5 mr-2" />
                            {successMsg.message}
                        </div>
                        {successMsg.reason && <div className="ml-7 text-sm opacity-90 mt-1">{successMsg.reason}</div>}
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col text-red-700 animate-fade-in">
                        <div className="font-semibold">{errorMsg.message}</div>
                        {errorMsg.reason && <div className="text-sm opacity-90 mt-1">{errorMsg.reason}</div>}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-3">Select Service Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => setSelectedService(service.id)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedService === service.id
                                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm ring-1 ring-primary-500'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`mb-2 ${selectedService === service.id ? 'text-primary-600' : 'text-slate-400'}`}>
                                        {service.icon}
                                    </div>
                                    <span className="text-sm font-medium">{service.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="details" className="block text-sm font-medium text-slate-700 mb-2">
                            Additional Details
                        </label>
                        <textarea
                            id="details"
                            rows={4}
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Please describe your request (e.g., '2 Towels' or 'Airport transfer at 8 AM')..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            required
                        />
                    </div>

                    {/* Time Selection for Housekeeping */}
                    {selectedService === 'housekeeping' && (
                        <div className="mb-6 animate-fade-in">
                            <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-2">
                                Preferred Time (Optional)
                            </label>
                            <input
                                type="time"
                                id="time"
                                className="w-full md:w-1/2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Service hours: 8:00 AM - 6:00 PM
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-slate-900 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Sending...
                                </>
                            ) : (
                                'Submit Request'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceRequest;
