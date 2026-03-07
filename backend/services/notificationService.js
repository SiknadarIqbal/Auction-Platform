import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';

export const createNotification = async ({ userId, type, message, auctionId, params = {} }) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            message,
            params,
            auctionId
        });

        // Emit real-time update via Socket.IO
        const io = getIO();
        if (io) {
            io.to(`user_${userId}`).emit('notification', {
                notification,
                unreadCount: await Notification.countDocuments({ userId, readStatus: false })
            });
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
};

export const createSystemWideNotification = async ({ type, message, auctionId, params = {} }) => {
    try {
        // Fetch all users
        const users = await User.find({}, '_id');

        // Create notifications for all users
        const notifications = users.map(user => ({
            userId: user._id,
            type,
            message,
            params,
            auctionId
        }));

        // Batch insert for performance
        await Notification.insertMany(notifications);

        // Notify active users via Socket.IO broadcast
        const io = getIO();
        if (io) {
            io.emit('system_notification', { type, message, params, auctionId });
        }

        return true;
    } catch (error) {
        console.error('System-wide notification error:', error);
        return false;
    }
};

export const notifyNewAuction = async (auction) => {
    return createSystemWideNotification({
        type: 'new_auction',
        message: `📢 New Auction: "${auction.title}" has just been listed!`,
        auctionId: auction._id,
        params: { title: auction.title }
    });
};
