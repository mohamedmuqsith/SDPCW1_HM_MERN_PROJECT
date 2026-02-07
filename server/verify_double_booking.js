import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';
const UNIQUE_ID = Date.now();
const TEST_USER = {
    name: 'Test User',
    email: `testuser_${UNIQUE_ID}@example.com`,
    password: 'Password123!'
};
const ROOM_NAME = 'Room 203';
const CHECK_IN = '2026-04-01';
const CHECK_OUT = '2026-04-05';

const runTest = async () => {
    try {
        console.log('--- Double Booking Verification Test ---');

        // 0. Register Test User
        console.log('0. Registering Test User...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const regData = await regRes.json();
        if (!regRes.ok) {
            console.error('Registration failed:', regData);
            return;
        }
        const token = regData.token;
        console.log('✅ Registered and logic successful.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 1. Create First Booking
        console.log('1. Attempting First Booking...');
        const b1Res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: ROOM_NAME,
                roomType: 'Deluxe',
                checkIn: CHECK_IN,
                checkOut: CHECK_OUT,
                totalPrice: 500
            })
        });
        const b1 = await b1Res.json();
        if (b1Res.ok) {
            console.log('✅ First Booking Created:', b1._id);
        } else {
            console.log('❌ First Booking Failed:', b1);
            return;
        }

        // 2. Attempt Overlapping Booking (Same dates)
        console.log('2. Attempting Identical Overlapping Booking...');
        const b2Res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: ROOM_NAME,
                roomType: 'Deluxe',
                checkIn: CHECK_IN,
                checkOut: CHECK_OUT,
                totalPrice: 500
            })
        });
        if (b2Res.status === 409) {
            console.log('✅ SUCCESS: Overlapping booking blocked with 409 Conflict');
        } else {
            console.log('❌ FAIL: Status', b2Res.status, await b2Res.json());
        }

        // 3. Attempt Partial Overlap (Starts during b1)
        console.log('3. Attempting Partial Overlap (2026-04-03 - 2026-04-07)...');
        const b3Res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: ROOM_NAME,
                roomType: 'Deluxe',
                checkIn: '2026-04-03',
                checkOut: '2026-04-07',
                totalPrice: 400
            })
        });
        if (b3Res.status === 409) {
            console.log('✅ SUCCESS: Partial overlap blocked with 409 Conflict');
        } else {
            console.log('❌ FAIL: Status', b3Res.status, await b3Res.json());
        }

        // 4. Attempt Different Room Same Dates
        console.log('4. Attempting Different Room Same Dates...');
        const b4Res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: 'Room 101',
                roomType: 'Standard',
                checkIn: CHECK_IN,
                checkOut: CHECK_OUT,
                totalPrice: 300
            })
        });
        if (b4Res.ok) {
            const b4 = await b4Res.json();
            console.log('✅ SUCCESS: Different room allowed:', b4._id);
        } else {
            console.log('❌ FAIL: Different room blocked:', await b4Res.json());
        }

        console.log('--- Test Completed ---');
    } catch (error) {
        console.error('Test Script Failed:', error.message);
    }
};

runTest();
