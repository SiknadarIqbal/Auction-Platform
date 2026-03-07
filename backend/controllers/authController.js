import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateEmailToken } from '../utils/tokenUtils.js';
import { sendVerificationEmail } from '../utils/emailUtils.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// Register new user
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate email verification token
        const emailToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'buyer',
            emailVerificationToken: emailToken,
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        // Send verification email
        await sendVerificationEmail(email, emailToken);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: {
                userId: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is deleted or deactivated
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

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                requiresVerification: true,
                email: user.email
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: error.message
        });
    }
};

// Refresh access token
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Find user and verify refresh token matches
        const user = await User.findById(decoded.userId).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user._id);

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: error.message
        });
    }
};

// Logout user
export const logout = async (req, res) => {
    try {
        // Clear refresh token from database
        await User.findByIdAndUpdate(req.user._id, {
            refreshToken: null
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

// Verify email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: error.message
        });
    }
};

// Forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if email exists
            return res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token and save to database
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        // In local: http://localhost:5173/reset-password/token
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `
            You are receiving this email because you (or someone else) has requested the reset of a password.
            Please click on the link below to reset your password: \n\n ${resetUrl} \n\n
            This link will expire in 10 minutes.
        `;

        const html = `
            <h1>Password Reset Request</h1>
            <p>You have requested to reset your password.</p>
            <p>Please click the link below to verify your identity and reset your password:</p>
            <a href="${resetUrl}" style="padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
                html
            });

            res.status(200).json({
                success: true,
                message: 'Email sent'
            });
        } catch (err) {
            console.error(err);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset request failed',
            error: error.message
        });
    }
};

// Reset password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: resetPasswordToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful. You can now login.'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
        });
    }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const emailToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = emailToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, emailToken);

        res.json({
            success: true,
            message: 'Verification email sent. Please check your inbox.'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email',
            error: error.message
        });
    }
};
