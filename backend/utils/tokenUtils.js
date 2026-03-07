import jwt from 'jsonwebtoken';

// Generate access token
export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

// Verify access token
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        return null;
    }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

// Generate email verification token
export const generateEmailToken = () => {
    return jwt.sign(
        { purpose: 'email_verification' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '24h' }
    );
};

// Generate password reset token
export const generatePasswordResetToken = () => {
    return jwt.sign(
        { purpose: 'password_reset' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
    );
};
