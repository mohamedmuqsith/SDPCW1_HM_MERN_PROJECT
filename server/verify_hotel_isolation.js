import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';
const UNIQUE_ID = Date.now();
const TEST_USER = {
    name: 'Multi-Hotel Test User',
    email: `hotel_test_${UNIQUE_ID}@example.com`,
    password: 'Password123!'
};

const runTest = async () => {
    try {
        console.log('--- Multi-Hotel Isolation Test ---');

        // 1. Register User
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const regData = await regRes.json();
        const token = regData.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Book "Deluxe 101" in "Hotel Alpha"
        console.log('2. Booking "Deluxe 101" in "Hotel Alpha"...');
        const b1Res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: 'Deluxe 101',
                roomType: 'Deluxe',
                hotelName: 'Hotel Alpha',
                checkIn: '2026-12-01',
                checkOut: '2026-12-05',
                totalPrice: 1000
            })
        });
        if (b1Res.ok) console.log('✅ Alpha Booking Success');

        // 3. Try to book "Deluxe 101" in "Hotel Alpha" again (SHOULD FAIL)
        console.log('3. Booking "Deluxe 101" in "Hotel Alpha" again (Overlap)...');
        const b2Res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: 'Deluxe 101',
                roomType: 'Deluxe',
                hotelName: 'Hotel Alpha',
                checkIn: '2026-12-03',
                checkOut: '2026-12-07',
                totalPrice: 1000
            })
        });
        if (b2Res.status === 409) {
            console.log('✅ Correctly blocked Intra-Hotel conflict (409)');
        } else {
            console.log('❌ FAIL: Intra-Hotel conflict NOT blocked');
        }

        // 4. Try to book "Deluxe 101" in "Hotel Beta" SAME DATES (SHOULD SUCCEED)
        console.log('4. Booking "Deluxe 101" in "Hotel Beta" SAME DATES...');
        const b3Res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                roomName: 'Deluxe 101',
                roomType: 'Deluxe',
                hotelName: 'Hotel Beta',
                checkIn: '2026-12-01',
                checkOut: '2026-12-05',
                totalPrice: 1000
            })
        });
        if (b3Res.ok) {
            console.log('✅ Correctly allowed Inter-Hotel overlapping room names');
        } else {
            const err = await b3Res.json();
            console.log('❌ FAIL: Inter-Hotel booking blocked:', err);
        }

        console.log('--- Isolation Verification Completed ---');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
};

runTest();
