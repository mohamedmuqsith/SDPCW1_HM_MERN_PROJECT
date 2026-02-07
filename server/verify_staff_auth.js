import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';
const UNIQUE_ID = Date.now();
const RECEPTIONIST_USER = {
    name: 'Staff Member',
    email: `receptionist_${UNIQUE_ID}@test.com`,
    password: 'Password123!'
};

const runTest = async () => {
    try {
        console.log('--- Staff Dashbaord Auth Verification ---');

        // 1. Register Receptionist
        console.log('1. Registering receptionist...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(RECEPTIONIST_USER)
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regData)}`);

        const token = regData.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        console.log('✅ Receptionist registered/logged in');

        // 2. Fetch All Bookings
        console.log('2. Fetching all bookings as staff...');
        const bRes = await fetch(`${API_URL}/bookings?role=staff`, {
            method: 'GET',
            headers
        });
        const bData = await bRes.json();
        if (!bRes.ok) throw new Error(`Fetch failed: ${JSON.stringify(bData)}`);

        console.log(`✅ Successfully fetched ${bData.length} bookings`);

        // 3. Create a test booking to action (if none exist)
        let bookingToTest = bData.find(b => b.status === 'Confirmed');
        if (!bookingToTest) {
            console.log('3. Creating a confirmed booking to test check-in...');
            const cbRes = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers, // Admin/Receptionist can create bookings too
                body: JSON.stringify({
                    roomName: 'Staff Test Room',
                    roomType: 'Deluxe',
                    hotelName: 'Receptionist Hotel',
                    checkIn: '2028-02-01',
                    checkOut: '2028-02-05',
                    totalPrice: 20000
                })
            });
            const cbData = await cbRes.json();
            // Approve it
            await fetch(`${API_URL}/bookings/${cbData._id}/approve`, { method: 'PUT', headers });
            bookingToTest = { _id: cbData._id };
            console.log('✅ Test booking created and approved');
        }

        // 4. Perform Check-In
        console.log('4. Testing Check-In...');
        const ciRes = await fetch(`${API_URL}/bookings/${bookingToTest._id}/checkin`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ staffEmail: RECEPTIONIST_USER.email })
        });
        if (ciRes.ok) {
            console.log('✅ Staff Check-In Successful');
        } else {
            console.log('❌ Staff Check-In Failed:', await ciRes.json());
        }

        console.log('--- Verification Done ---');
    } catch (error) {
        console.error('Test script Error:', error.message);
    }
};

runTest();
