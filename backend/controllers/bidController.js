import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import mongoose from 'mongoose';
import { createNotification } from '../services/notificationService.js';

// Place a bid (with atomic locking and anti-sniping)
// Place a bid (with atomic locking and anti-sniping)
export const placeBid = async (req, res) => {
    let session = null;
    // Only use transactions if NOT in local mode (standalone MongoDB doesn't support them)
    // OR if explicitly enabled
    const useTransaction = process.env.DB_TYPE !== 'local';

    if (useTransaction) {
        session = await mongoose.startSession();
        session.startTransaction();
    }

    try {
        const { auctionId, bidAmount } = req.body;
        const bidderId = req.user._id;

        // Fetch auction with lock
        const auction = await Auction.findById(auctionId).session(session);

        if (!auction) {
            if (session) await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Validation checks
        if (auction.status !== 'active') {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Auction is not active'
            });
        }

        if (auction.sellerId.toString() === bidderId.toString()) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Cannot bid on your own auction'
            });
        }

        if (new Date() > auction.auctionEndTime) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Auction has ended'
            });
        }

        const minValidBid = auction.currentHighestBid + auction.minimumBidIncrement;

        if (parseFloat(bidAmount) < minValidBid) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Bid must be at least $${minValidBid.toLocaleString()}`
            });
        }

        // Check for anti-sniping
        const timeRemaining = auction.auctionEndTime - new Date();
        const antiSnipingMinutes = parseInt(process.env.ANTI_SNIPING_MINUTES) || 5;
        const maxExtensions = parseInt(process.env.MAX_AUCTION_EXTENSIONS) || 3;

        let auctionExtended = false;

        if (timeRemaining < antiSnipingMinutes * 60 * 1000 && auction.extensionCount < maxExtensions) {
            // Extend auction by 5 minutes
            auction.auctionEndTime = new Date(auction.auctionEndTime.getTime() + antiSnipingMinutes * 60 * 1000);
            auction.extensionCount += 1;
            auctionExtended = true;
        }

        // Mark previous winning bid as not winning
        if (auction.highestBidderId) {
            await Bid.updateMany(
                { auctionId, bidderId: auction.highestBidderId },
                { isWinning: false }
            ).session(session);

            // Notify previous highest bidder they were outbid
            await createNotification({
                userId: auction.highestBidderId,
                type: 'outbid',
                message: `📉 You have been outbid on "${auction.title}"!`,
                auctionId: auction._id,
                params: { title: auction.title }
            });
        }

        // Create new bid
        const bid = await Bid.create([{
            auctionId,
            bidderId,
            bidAmount: parseFloat(bidAmount),
            isWinning: true
        }], { session });

        // Update auction
        auction.currentHighestBid = parseFloat(bidAmount);
        auction.highestBidderId = bidderId;
        auction.totalBids += 1;

        // Disable Buy Now after first bid
        if (auction.buyNowActive && auction.totalBids === 1) {
            auction.buyNowActive = false;
        }

        await auction.save({ session });

        // Commit transaction
        if (session) await session.commitTransaction();

        // Emit real-time update via Socket.IO
        const io = getIO();
        io.to(`auction_${auctionId}`).emit('bid_update', {
            auctionId,
            currentHighestBid: auction.currentHighestBid,
            highestBidderId: bidderId,
            totalBids: auction.totalBids,
            bidderName: req.user.name
        });

        if (auctionExtended) {
            io.to(`auction_${auctionId}`).emit('auction_extended', {
                auctionId,
                newEndTime: auction.auctionEndTime,
                extensionCount: auction.extensionCount
            });
        }

        // Notify current bidder
        createNotification({
            userId: bidderId,
            type: 'bid_placed',
            message: `🔨 You are currently the highest bidder for "${auction.title}"!`,
            auctionId: auction._id,
            params: { title: auction.title }
        });

        res.json({
            success: true,
            message: auctionExtended ? 'Bid placed successfully. Auction extended by 5 minutes!' : 'Bid placed successfully',
            data: {
                bid: bid[0],
                auction: {
                    currentHighestBid: auction.currentHighestBid,
                    totalBids: auction.totalBids,
                    auctionEndTime: auction.auctionEndTime,
                    extensionCount: auction.extensionCount
                }
            }
        });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error('Place bid error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to place bid',
            error: error.message
        });
    } finally {
        if (session) session.endSession();
    }
};

// Buy Now
// Buy Now
export const buyNow = async (req, res) => {
    let session = null;
    const useTransaction = process.env.DB_TYPE !== 'local';

    if (useTransaction) {
        session = await mongoose.startSession();
        session.startTransaction();
    }

    try {
        const { auctionId } = req.body;
        const buyerId = req.user._id;

        const auction = await Auction.findById(auctionId).session(session);

        if (!auction) {
            if (session) await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        if (!auction.buyNowActive || auction.buyNowPrice === 0) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Buy Now is not available for this auction'
            });
        }

        if (auction.sellerId.toString() === buyerId.toString()) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Cannot buy your own auction'
            });
        }

        // End auction immediately
        auction.status = 'sold';
        auction.winnerId = buyerId;
        auction.finalPrice = auction.buyNowPrice;
        auction.buyNowActive = false;
        await auction.save({ session });


        // Notify winner
        await createNotification({
            userId: buyerId,
            type: 'win',
            message: `🎉 You won "${auction.title}" via Buy Now!`,
            auctionId: auction._id,
            params: { title: auction.title, price: auction.buyNowPrice }
        });

        if (session) await session.commitTransaction();

        // Emit real-time update
        const io = getIO();
        io.to(`auction_${auctionId}`).emit('auction_ended', {
            auctionId,
            status: 'sold',
            winnerId: buyerId,
            finalPrice: auction.buyNowPrice
        });

        res.json({
            success: true,
            message: 'Purchase successful!',
            data: {
                auction
            }
        });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error('Buy now error:', error);
        res.status(500).json({
            success: false,
            message: 'Buy now failed',
            error: error.message
        });
    } finally {
        if (session) session.endSession();
    }
};

// Get bid history for an auction
export const getAuctionBidHistory = async (req, res) => {
    try {
        const { auctionId } = req.params;

        const bids = await Bid.find({ auctionId })
            .populate('bidderId', 'name')
            .sort({ timestamp: -1 })
            .limit(50);

        // Anonymize bidder names for privacy
        const anonymizedBids = bids.map(bid => ({
            bidAmount: bid.bidAmount,
            timestamp: bid.timestamp,
            bidderName: bid.bidderId.name.substring(0, 4) + '***'
        }));

        res.json({
            success: true,
            data: anonymizedBids
        });
    } catch (error) {
        console.error('Get bid history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bid history',
            error: error.message
        });
    }
};

// Get user's active bids
export const getMyBids = async (req, res) => {
    try {
        const bids = await Bid.find({ bidderId: req.user._id })
            .populate({
                path: 'auctionId',
                match: { status: 'active' },
                populate: { path: 'sellerId', select: 'name' }
            })
            .sort({ timestamp: -1 });

        // Filter out bids where auction is null (not active)
        const activeBids = bids.filter(bid => bid.auctionId !== null);

        res.json({
            success: true,
            data: activeBids
        });
    } catch (error) {
        console.error('Get my bids error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your bids',
            error: error.message
        });
    }
};
