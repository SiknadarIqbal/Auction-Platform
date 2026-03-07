import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    skipSuccessfulRequests: true,
});

// Bid endpoint rate limiter
export const bidLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 bids per minute
    message: {
        success: false,
        message: 'Too many bid attempts, please slow down.'
    },
    keyGenerator: (req) => {
        // Rate limit per user, not per IP
        return req.user ? req.user._id.toString() : req.ip;
    },
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        success: false,
        message: 'Too many upload requests, please try again later.'
    },
});
