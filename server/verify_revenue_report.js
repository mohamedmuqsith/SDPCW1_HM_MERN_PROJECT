import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';
const UNIQUE_ID = Date.now();
const ADMIN_USER = {
    name: 'Admin Report Test',
    email: `admin_report_${UNIQUE_ID}@gmail.com`,
    password: 'Password123!'
};

const runTest = async () => {
    try {
        console.log('--- Hotel Revenue Report Verification ---');

        // 1. Register Admin User
        console.log('1. Registering Admin User...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_USER)
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error('Registration failed');
        const token = regData.token;

        // 2. Create a booking to have data
        console.log('2. Creating a test booking...');
        const bRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomName: 'Suite 99',
                roomType: 'Platinum',
                hotelName: 'Grand Resort',
                checkIn: '2026-06-01',
                checkOut: '2026-06-05',
                totalPrice: 150000
            })
        });
        const bData = await bRes.json();
        if (!bRes.ok) throw new Error('Booking failed');
        console.log('✅ Booking created:', bData._id);

        // 2.5 Admin Approve the booking
        console.log('2.5 Approving booking...');
        const appRes = await fetch(`${API_URL}/bookings/${bData._id}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!appRes.ok) throw new Error('Approval failed');
        console.log('✅ Booking approved.');

        // 3. Fetch Revenue Report
        console.log('3. Fetching Hotel Revenue Report...');
        const repRes = await fetch(`${API_URL}/reports/hotel-revenue`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const repData = await repRes.json();

        console.log('Report Data:', JSON.stringify(repData, null, 2));

        if (Array.isArray(repData) && repData.some(d => d.hotelType.includes('Grand Resort'))) {
            console.log('✅ SUCCESS: Revenue report correctly aggregated the new booking.');
        } else {
            console.log('❌ FAIL: Revenue report data mismatch or empty.');
        }

        console.log('--- Verification Completed ---');
    } catch (error) {
        console.error('Verification failed:', error.message);
    }
};

runTest();
