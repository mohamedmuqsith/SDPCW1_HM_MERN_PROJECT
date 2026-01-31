import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Explicitly check for "undefined" or "null" strings being passed
            if (!token || token === 'undefined' || token === 'null') {
                return res.status(401).json({ message: 'Not authorized, invalid token' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error('Auth Error:', error.message); // Log message only to avoid clutter
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Enhanced authorize middleware with audit logging for denied access
export const authorize = (...roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        if (!roles.includes(req.user.role)) {
            // AUDIT LOG: Unauthorized access attempt
            try {
                await AuditLog.create({
                    user: req.user.email || req.user._id,
                    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    details: `Role '${req.user.role}' attempted to access ${req.method} ${req.originalUrl}. Required: ${roles.join(', ')}`,
                    ipAddress: req.ip || 'unknown'
                });
            } catch (logError) {
                console.error('Audit Log Error:', logError.message);
            }

            return res.status(403).json({
                message: `Access denied. Your role '${req.user.role}' is not authorized.`,
                requiredRoles: roles,
                code: 'FORBIDDEN'
            });
        }
        next();
    };
};
