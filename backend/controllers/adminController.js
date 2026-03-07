import User from '../models/User.js';
import Auction from '../models/Auction.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Pause auction
export const pauseAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const auction = await Auction.findByIdAndUpdate(
            id,
            {
                status: 'paused',
                pauseReason: reason || 'Paused by admin'
            },
            { new: true }
        );

        if (!auction) {
            return res.status(404).json({ success: false, message: 'Auction not found' });
        }

        // Notify seller
        await Notification.create({
            userId: auction.sellerId,
            type: 'auction_paused',
            message: `Your auction "${auction.title}" has been paused by admin: ${reason}`,
            auctionId: auction._id
        });

        await AuditLog.create({
            adminId: req.user._id,
            targetUserId: auction.sellerId,
            targetAuctionId: auction._id,
            targetLabel: `Auction: ${auction.title}`,
            action: 'auction_paused',
            reason: reason || 'Paused by admin',
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Auction paused successfully',
            data: auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to pause auction',
            error: error.message
        });
    }
};

// Cancel auction
export const cancelAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const auction = await Auction.findByIdAndUpdate(
            id,
            {
                status: 'cancelled',
                pauseReason: reason || 'Cancelled by admin'
            },
            { new: true }
        );

        if (!auction) {
            return res.status(404).json({ success: false, message: 'Auction not found' });
        }

        // Notify seller and highest bidder if exists
        const notifications = [{
            userId: auction.sellerId,
            type: 'auction_cancelled',
            message: `Your auction "${auction.title}" has been cancelled by admin: ${reason}`,
            auctionId: auction._id
        }];

        if (auction.highestBidderId) {
            notifications.push({
                userId: auction.highestBidderId,
                type: 'auction_cancelled',
                message: `Auction "${auction.title}" you were bidding on has been cancelled: ${reason}`,
                auctionId: auction._id
            });
            // Logic to refund bid logic would go here if funds were held
        }

        await Notification.insertMany(notifications);

        await AuditLog.create({
            adminId: req.user._id,
            targetUserId: auction.sellerId,
            targetAuctionId: auction._id,
            targetLabel: `Auction: ${auction.title}`,
            action: 'auction_cancelled',
            reason: reason || 'Cancelled by admin',
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Auction cancelled successfully',
            data: auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to cancel auction',
            error: error.message
        });
    }
};

// Deactivate/Activate User
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // action: 'deactivate' or 'reactivate'

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Admins cannot deactivate themselves' });
        }

        if (action === 'deactivate') {
            user.isDeactivated = true;
        } else if (action === 'reactivate') {
            user.isDeactivated = false;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await user.save();

        // Log the action
        await AuditLog.create({
            adminId: req.user._id,
            targetUserId: user._id,
            action: action === 'deactivate' ? 'manual_deactivation' : 'reactivate_user',
            reason: reason || `User ${action}d by admin`,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: `User ${action}d successfully`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};



// Get audit logs
export const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('adminId', 'name email')
            .populate('targetUserId', 'name email')
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        const data = logs.map(log => ({
            ...log,
            target: log.targetLabel || (log.targetUserId?.name || log.targetUserId?.email || '—'),
            admin: log.adminId?.name || log.adminId?.email || '—'
        }));

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
            error: error.message
        });
    }
};
