import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Auction from '../models/Auction.js';
import AuditLog from '../models/AuditLog.js';
import { uploadToCloudinary } from '../middleware/upload.js';

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

// Update profile
export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;

        // Handle avatar upload if present
        if (req.file) {
            const avatarUrl = await uploadToCloudinary(req.file, 'avatars');
            user.avatar = avatarUrl;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect current password'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

// Get user notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            readStatus: false
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === 'all') {
            await Notification.updateMany(
                { userId: req.user._id, readStatus: false },
                { readStatus: true }
            );
        } else {
            await Notification.findByIdAndUpdate(id, { readStatus: true });
        }

        res.json({
            success: true,
            message: 'Notification(s) marked as read'
        });
    } catch (error) {
        console.error('Mark notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification',
            error: error.message
        });
    }
};


// Delete user account (Soft Delete)
export const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 6. Admin Privileges: Admins cannot be self-deleted
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admins cannot delete their own accounts. Please contact another administrator.'
            });
        }

        // 2. Seller-Specific Deletion Rules
        if (user.role === 'seller') {
            // Check for active auctions
            const activeAuctions = await Auction.findOne({ sellerId: user._id, status: 'active' });
            if (activeAuctions) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete account while you have active auctions. Please cancel or wait for them to end.'
                });
            }
        }


        // 1 & 3. Perform Soft Delete and Anonymization
        user.isDeleted = true;
        user.deletedAt = new Date();

        // Anonymize personal data
        const anonymizedId = Math.random().toString(36).substring(7);
        user.name = user.role === 'seller' ? 'Deleted Seller' : 'Deleted User';
        user.email = `deleted_${anonymizedId}@anonymized.com`;
        user.avatar = '';
        user.password = `ANONYMIZED_${anonymizedId}`; // Scramble password to prevent future login

        await user.save();

        // 6. Log deletion in audit logs
        await AuditLog.create({
            targetUserId: user._id,
            action: 'delete_account',
            reason: 'User self-deletion',
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: error.message
        });
    }
};
