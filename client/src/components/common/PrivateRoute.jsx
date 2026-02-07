import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toUpperCase()).includes(user.role.toUpperCase())) {
        // Redirect to appropriate dashboard based on role or unauthorized page
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default PrivateRoute;
