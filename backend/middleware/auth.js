import User from '../models/User.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }

        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Block deleted or deactivated users
        if (user.isDeleted) {
            return res.status(401).json({
                success: false,
                message: 'This account has been deleted.'
            });
        }

        if (user.isDeactivated) {
            return res.status(401).json({
                success: false,
                message: 'This account has been deactivated by admin.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

// Optional auth: attach user if valid token, never 401
export const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
        const token = authHeader.substring(7);
        const decoded = verifyAccessToken(token);
        if (!decoded) return next();
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || user.isDeleted || user.isDeactivated) return next();
        req.user = user;
        next();
    } catch {
        next();
    }
};

// Middleware to check if email is verified
export const requireEmailVerification = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') return next();
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required. Please verify your email to continue.'
        });
    }
    next();
};


