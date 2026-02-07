import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';
const UNIQUE_ID = Date.now();
const ADMIN_USER = {
    name: 'Checkout Tester',
    email: `chk_admin_${UNIQUE_ID}@test.com`,
    password: 'Password123!'
};

const runTest = async () => {
    try {
        console.log('--- Checkout 500 Error Verification ---');

        // 1. Register Admin
        console.log('1. Registering admin...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_USER)
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regData)}`);

        const token = regData.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Create Booking
        console.log('2. Creating booking...');
        const bRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: 'Suite Z',
                roomType: 'Platinum',
                hotelName: 'Grand Resort',
                checkIn: '2028-01-01',
                checkOut: '2028-01-05',
                totalPrice: 40000
            })
        });
        const bData = await bRes.json();
        if (!bRes.ok) throw new Error(`Booking creation failed: ${JSON.stringify(bData)}`);

        const bookingId = bData._id || bData.id;
        console.log('✅ Booking created:', bookingId);

        // 3. Approve and Check In
        console.log('3. Approving and Checking In...');
        await fetch(`${API_URL}/bookings/${bookingId}/approve`, { method: 'PUT', headers });
        await fetch(`${API_URL}/bookings/${bookingId}/checkin`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ staffEmail: ADMIN_USER.email })
        });

        // 4. Attempt Checkout
        console.log('4. Attempting Checkout...');
        const chkRes = await fetch(`${API_URL}/bookings/${bookingId}/checkout`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                paymentMethod: 'cash',
                paidAmount: 40000
            })
        });

        const chkData = await chkRes.json();
        if (chkRes.ok) {
            console.log('❌ FAILED TO REPRODUCE: Checkout succeeded.');
        } else {
            console.log('✅ REPRODUCED: Checkout failed:', chkData.message);
            console.log('Full Response:', JSON.stringify(chkData, null, 2));
        }

    } catch (error) {
        console.error('Test script Error:', error.message);
    }
};

runTest();
