import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ShiftRoster = () => {
    const [shifts, setShifts] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    // New Shift Form State
    const [formData, setFormData] = useState({
        staffId: '',
        startTime: '',
        endTime: '',
        location: 'General',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [shiftsRes, staffRes] = await Promise.all([
                axios.get('http://localhost:5000/api/shifts', config),
                // Reusing receptionist endpoint to get staff list
                axios.get('http://localhost:5000/api/receptionist/staff', config)
            ]);
            setShifts(shiftsRes.data);
            setStaff(staffRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/shifts', formData, config);
            alert('Shift Assigned Successfully');
            setFormData({ staffId: '', startTime: '', endTime: '', location: 'General', notes: '' });
            fetchData(); // Refresh list
        } catch (error) {
            console.error(error);
            alert('Failed to assign shift');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Staff Shift Roster</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assign Shift Form */}
                <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assign New Shift</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Staff Member</label>
                            <select
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.staffId}
                                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                            >
                                <option value="">Select Staff...</option>
                                {staff.map(s => (
                                    <option key={s._id} value={s._id}>{s.name} ({s.department || s.role})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location / Zone</label>
                            <input
                                type="text"
                                placeholder="e.g. Front Desk, Kitchen"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
                            Assign Shift
                        </button>
                    </form>
                </div>

                {/* Existing Shifts List */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Upcoming Shifts</h2>
                        {loading ? <p>Loading roster...</p> : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {shifts.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No shifts assigned.</td></tr>
                                        ) : (
                                            shifts.map(shift => (
                                                <tr key={shift._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shift.staffName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.role}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(shift.startTime).toLocaleString()} - <br />
                                                        {new Date(shift.endTime).toLocaleTimeString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.location}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button className="text-red-600 hover:text-red-900">Remove</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftRoster;
