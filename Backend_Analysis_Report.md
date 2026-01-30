# Backend Comprehensive Analysis & PDF Integration Guide

**Date:** January 08, 2026
**Project:** Hotel Management System (MERN Backend)

---

## 1. Backend Dependencies Analysis ("All Packages")

The backend relies on the following packages (from `package.json`):

*   **`express`**: Fast web framework for Node.js. Handles routing, middleware, and HTTP requests.
*   **`mongoose`**: ODM (Object Data Modeling) library for MongoDB. Manages database schemas and relationships.
*   **`cors`**: Middleware to enable Cross-Origin Resource Sharing (allows the React frontend to fetch data).
*   **`dotenv`**: Loads environment variables from `.env` file (e.g., Database URI, JWT Secret).
*   **`bcryptjs`**: Library to hash passwords (security) and compare hashes during login.
*   **`jsonwebtoken` (JWT)**: Generates and verifies tokens for secure, stateless authentication.
*   **`multer`**: Middleware for handling `multipart/form-data`, primarily for file uploads (images).
*   **`nodemon`** (Dev Dependency): Automatically repairs the server when file changes are detected.

---

## 2. Detailed Code Analysis (Line-by-Line Explanation)

### 2.1 Server Entry Point (`server.js`)
This file is the specific entry point of the application.

```javascript
import express from 'express';     // Import the Express framework
import mongoose from 'mongoose';   // Import Mongoose for DB connection
import cors from 'cors';           // Import CORS middleware
// ... imports of all route files (auth, bookings, stats, etc.)
import dotenv from 'dotenv';       // Import dotenv to read .env file

dotenv.config();                   // Execute dotenv config to load variables

const app = express();             // Initialize the Express application instance
const PORT = process.env.PORT || 5000; // Set port from env or default to 5000

// Middleware
app.use(cors());                   // Enable CORS for all routes
app.use(express.json());           // Enable parsing of JSON bodies in requests
app.use('/uploads', express.static('uploads')); // Serve 'uploads' folder statically

// Routes Registration
app.use('/api/auth', authRoutes);  // Attach auth routes to /api/auth
app.use('/api/bookings', bookingRoutes); // Attach booking routes to /api/bookings
// ... (Similar lines for stats, rooms, staff, reports, services, notifications)

// Database Connection
mongoose.connect(process.env.MONGODB_URI) // Connect to MongoDB using URI from .env
    .then(() => console.log('MongoDB Connected')) // on success
    .catch(err => console.error('MongoDB Connection Error:', err)); // on failure

// Start Server
app.listen(PORT, () => {           // Listen on the specified port
    console.log(`Server running on port ${PORT}`);
});
```

### 2.2 Authentication & User Model

**File: `models/User.js`**
*   **Schema Definition**: Defines the structure of a user (name, email, password, role).
*   **`pre('save')` Hook**: Before saving a user, it checks if the password was modified. If so, it uses `bcrypt.hash` to encrypt it.
*   **`matchPassword` Method**: Adds a custom function to the User document to compare a plain text password with the hashed one in the DB using `bcrypt.compare`.

**File: `routes/auth.js`**
*   **`generateToken`**: Helper function that uses `jwt.sign` to create a token containing the user's ID, valid for 30 days.
*   **POST `/register`**:
    1.  Checks if user exists using `findOne`.
    2.  Determines role (Admin/Staff/Guest) based on email keywords (e.g., 'admin' in email).
    3.  Creates user with `User.create`.
    4.  Returns user info + JWT token.
*   **POST `/login`**:
    1.  Finds user by email.
    2.  Checks password with `matchPassword`.
    3.  If valid, logs the login action to `AuditLog` and returns token.

### 2.3 Analytics & Reports

**File: `routes/reports.js`**
This file generates data for dashboards but **does not currently generate PDFs**.

*   **GET `/revenue`**:
    *   Calculates a date 6 months ago.
    *   Uses **MongoDB Aggregation Pipeline**:
        *   `$match`: Filters bookings created in last 6 months that aren't cancelled.
        *   `$group`: Groups by month and sums `totalPrice`.
        *   `$sort`: Sorts by month.
*   **GET `/occupancy`**:
    *   Counts total rooms (`Room.countDocuments`).
    *   Counts occupied rooms (`Booking.countDocuments` with status Checked In/Confirmed).
    *   Returns percentage calculation.

---

## 3. PDF Generation Method ("The Solution")

You requested a "PDF Method". logic does not currently exist in the backend. Below is the solution to implement it.

### Step 1: Install `pdfkit`
You need to add a PDF generation library. `pdfkit` is a standard, robust choice for Node.js.

```bash
npm install pdfkit
```

### Step 2: Implementation Code
Add this new route to your `server/routes/reports.js` file. This creates an endpoint that streams a PDF directly to the browser.

```javascript
/* ADD TO: server/routes/reports.js */
import PDFDocument from 'pdfkit';

// @route   GET /api/reports/download-pdf
// @desc    Generate and download a Revenue Report PDF
router.get('/download-pdf', async (req, res) => {
    try {
        // 1. Fetch Data
        const bookings = await Booking.find({ status: 'Confirmed' }).populate('user', 'name email');

        // 2. Create PDF Document
        const doc = new PDFDocument();

        // 3. Set Headers (This tells the browser it's a file download)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=revenue_report.pdf');

        // 4. Pipe PDF stream to the Response
        doc.pipe(res);

        // 5. Build PDF Content
        doc.fontSize(25).text('Hotel Revenue Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Table Header
        doc.text('Customer | Room | Amount', { underline: true });
        
        // Loop through bookings and add rows
        bookings.forEach(booking => {
            doc.text(`${booking.user.name} | ${booking.roomName} | $${booking.totalPrice}`);
        });

        // 6. Finalize PDF
        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
});
```

### Step 3: Frontend Usage
In your React frontend, you can now trigger this download with a simple link or button:

```jsx
<button onClick={() => window.open('http://localhost:5000/api/reports/download-pdf', '_blank')}>
  Download PDF Report
</button>
```
