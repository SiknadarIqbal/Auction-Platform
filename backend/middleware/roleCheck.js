// Role-based access control middleware

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (process.env.NODE_ENV === 'development') return next();
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

// Specific role middlewares
export const requireSeller = requireRole('seller', 'admin');
export const requireAdmin = requireRole('admin');
export const requireBuyer = requireRole('buyer', 'seller', 'admin');
