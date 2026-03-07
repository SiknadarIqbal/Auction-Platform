import cron from 'node-cron';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import { createNotification } from './notificationService.js';

const startCronJobs = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('Running auction expiration check...');
        const now = new Date();

        try {
            // Find all active auctions that have ended
            const expiredAuctions = await Auction.find({
                status: 'active',
                auctionEndTime: { $lte: now }
            });

            if (expiredAuctions.length === 0) {
                return;
            }

            console.log(`Found ${expiredAuctions.length} expired auctions. Processing...`);

            for (const auction of expiredAuctions) {
                await processExpiredAuction(auction);
            }

        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
};

const processExpiredAuction = async (auction) => {
    let session = null;
    // Use transactions only if supported (Atlas/Replica Set)
    const useTransaction = process.env.DB_TYPE !== 'local';

    if (useTransaction) {
        session = await mongoose.startSession();
        session.startTransaction();
    }

    try {
        console.log(`Processing auction ${auction._id}: ${auction.title}`);

        // Logic to determine if sold or unsold
        let isSold = false;
        let rejectReason = '';

        if (auction.totalBids === 0) {
            isSold = false;
            rejectReason = 'No bids received';
        } else {
            // Check reserve price
            if (auction.reservePrice > 0 && auction.currentHighestBid < auction.reservePrice) {
                isSold = false;
                rejectReason = 'Reserve price not met';
            } else {
                isSold = true;
            }
        }

        if (isSold) {
            // Mark as Sold
            auction.status = 'sold';
            auction.winnerId = auction.highestBidderId;
            auction.finalPrice = auction.currentHighestBid;
            await auction.save({ session });


            // Notify Winner
            await createNotification({
                userId: auction.winnerId,
                type: 'win',
                message: `🏆 Congratulations! You won "${auction.title}" for $${auction.finalPrice}.`,
                auctionId: auction._id,
                params: { title: auction.title, price: auction.finalPrice }
            });

            // Notify Seller
            await createNotification({
                userId: auction.sellerId,
                type: 'sale',
                message: `💰 Your auction "${auction.title}" was sold for $${auction.finalPrice}!`,
                auctionId: auction._id,
                params: { title: auction.title, price: auction.finalPrice }
            });

        } else {
            // Mark as Unsold
            auction.status = 'unsold';
            await auction.save({ session });

            // Notify Seller
            await createNotification({
                userId: auction.sellerId,
                type: 'info',
                message: `ℹ️ Your auction "${auction.title}" ended without a sale: ${rejectReason}.`,
                auctionId: auction._id,
                params: { title: auction.title, reason: rejectReason }
            });

            // If there was a high bidder but reserve not met, notify them
            if (auction.highestBidderId) {
                await createNotification({
                    userId: auction.highestBidderId,
                    type: 'info',
                    message: `ℹ️ The auction for "${auction.title}" ended. Unfortunately, the reserve price was not met.`,
                    auctionId: auction._id,
                    params: { title: auction.title }
                });
            }
        }

        if (session) await session.commitTransaction();
        console.log(`Auction ${auction._id} processed as ${isSold ? 'SOLD' : 'UNSOLD'}`);

    } catch (error) {
        console.error(`Error processing auction ${auction._id}:`, error);
        if (session) await session.abortTransaction();
    } finally {
        if (session) session.endSession();
    }
};

export default startCronJobs;
