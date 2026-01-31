import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Unauthorized from './pages/Unauthorized';
import Services from './pages/Services';
import Contact from './pages/Contact';
import BookingPage from './pages/guest/BookingPage';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PrivateRoute from './components/common/PrivateRoute';
import RoomSearch from './pages/guest/RoomSearch';
import GuestDashboard from './pages/guest/GuestDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ServiceRequest from './pages/guest/ServiceRequest';
import HotelsList from './pages/guest/HotelsList';
import AdminLayout from './components/admin/AdminLayout';
import BookingManagement from './pages/admin/BookingManagement';
import RoomManagement from './pages/admin/RoomManagement';
import UserManagement from './pages/admin/UserManagement';
import StaffManagement from './pages/admin/StaffManagement';
import Reports from './pages/admin/Reports';
import ServiceManagement from './pages/admin/ServiceManagement';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffLayout from './components/admin/StaffLayout';
import StaffLogin from './pages/auth/StaffLogin';
import StaffRegister from './pages/auth/StaffRegister';
import StaffRoomStatus from './pages/staff/StaffRoomStatus';
import StaffBookings from './pages/staff/StaffBookings';
import StaffNotifications from './pages/staff/StaffNotifications';
// Receptionist imports
import ReceptionistLayout from './components/admin/ReceptionistLayout';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import CheckInPage from './pages/receptionist/CheckInPage';
import CheckOutPage from './pages/receptionist/CheckOutPage';
import ServiceRequestsPage from './pages/receptionist/ServiceRequestsPage';
import AllBookingsPage from './pages/receptionist/AllBookingsPage';
// Cleaner imports
import CleanerDashboard from './pages/cleaner/CleanerDashboard';

// Placeholder Pages for Staff
// Placeholder Pages for Staff (Removed)
const NotFound = () => <div className="p-8 text-center"><h1>404 - Page Not Found</h1></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes with Main Layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="hotels" element={<HotelsList />} />
            <Route path="rooms" element={<RoomSearch />} />
            <Route path="book/:roomId" element={<BookingPage />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/register" element={<StaffRegister />} />
          </Route>

          {/* Guest Protected Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={['guest', 'admin', 'staff', 'receptionist']}>
              <MainLayout />
            </PrivateRoute>
          }>
            <Route index element={<GuestDashboard />} />
            <Route path="services" element={<ServiceRequest />} />
            <Route path="bookmarks" element={<div>My Bookings</div>} />
          </Route>

          {/* Staff Protected Routes (Housekeeping, Maintenance, Cleaner) */}
          <Route path="/staff" element={
            <PrivateRoute allowedRoles={['staff', 'housekeeping', 'maintenance', 'cleaner', 'admin']}>
              <StaffLayout />
            </PrivateRoute>
          }>
            <Route index element={<StaffDashboard />} />
            <Route path="bookings" element={<StaffBookings />} />
            <Route path="rooms" element={<StaffRoomStatus />} />
            <Route path="notifications" element={<StaffNotifications />} />
          </Route>

          {/* Receptionist Protected Routes */}
          <Route path="/receptionist" element={
            <PrivateRoute allowedRoles={['receptionist', 'admin']}>
              <ReceptionistLayout />
            </PrivateRoute>
          }>
            <Route index element={<ReceptionistDashboard />} />
            <Route path="checkin" element={<CheckInPage />} />
            <Route path="checkout" element={<CheckOutPage />} />
            <Route path="service-requests" element={<ServiceRequestsPage />} />
            <Route path="bookings" element={<AllBookingsPage />} />
          </Route>

          {/* Cleaner Protected Routes */}
          <Route path="/cleaner" element={
            <PrivateRoute allowedRoles={['cleaner', 'housekeeping', 'admin']}>
              <CleanerDashboard />
            </PrivateRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="services" element={<ServiceManagement />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

