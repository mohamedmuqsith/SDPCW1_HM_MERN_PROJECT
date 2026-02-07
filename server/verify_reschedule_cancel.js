import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';
const UNIQUE_ID = Date.now();
const USER = {
    name: 'Reschedule Tester',
    email: `resh_${UNIQUE_ID}@test.com`,
    password: 'Password123!'
};

const runTest = async () => {
    try {
        console.log('--- Reschedule & Cancel Verification ---');

        // 1. Register User
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER)
        });
        const regData = await regRes.json();
        const token = regData.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Create Booking
        console.log('2. Creating initial booking...');
        const bRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: 'Suite X',
                roomType: 'Platinum',
                hotelName: 'Grand Resort',
                checkIn: '2027-01-01',
                checkOut: '2027-01-05',
                totalPrice: 50000
            })
        });
        const bData = await bRes.json();
        console.log('✅ Booking created:', bData._id);

        // 3. Reschedule - SUCCESS Case
        console.log('3. Testing Reschedule - Success Case...');
        const resRes = await fetch(`${API_URL}/bookings/${bData._id}/dates`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                checkIn: '2027-01-10',
                checkOut: '2027-01-15'
            })
        });
        if (resRes.ok) {
            console.log('✅ Reschedule Successful');
        } else {
            console.log('❌ Reschedule Failed:', await resRes.json());
        }

        // 3.1 Reschedule - INVALID DATES
        console.log('3.1 Testing Reschedule - Invalid Dates...');
        const resInv = await fetch(`${API_URL}/bookings/${bData._id}/dates`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                checkIn: 'INVALID',
                checkOut: '2027-01-15'
            })
        });
        console.log(resInv.ok ? '❌ Error: Should have failed' : `✅ Failed as expected: ${resInv.status}`);

        // 3.2 Reschedule - CHECKED_IN STATUS
        console.log('3.2 Testing Reschedule - CHECKED_IN status...');
        // Mark as checked in first
        await fetch(`${API_URL}/bookings/${bData._id}/checkin`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ staffEmail: USER.email })
        });

        const resCi = await fetch(`${API_URL}/bookings/${bData._id}/dates`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                checkIn: '2027-01-20',
                checkOut: '2027-01-25'
            })
        });
        const ciData = await resCi.json();
        if (resCi.status === 400 && ciData.message.includes('CHECKED_IN')) {
            console.log('✅ Corrected blocked reschedule for CHECKED_IN status');
        } else {
            console.log('❌ Unexpected behavior for CHECKED_IN status:', resCi.status, ciData);
        }

        // 4. Cancel
        console.log('4. Testing Cancel...');
        const canRes = await fetch(`${API_URL}/bookings/${bData._id}/cancel`, {
            method: 'PUT',
            headers
        });
        if (canRes.ok) {
            console.log('✅ Cancel Successful');
        } else {
            console.log('❌ Cancel Failed:', await canRes.json());
        }

        console.log('--- Verification Done ---');
    } catch (error) {
        console.error('Test Error:', error.message);
    }
};

runTest();
