import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import Notification from '../models/Notification.js';
import { uploadMultipleToS3, deleteFromS3 } from '../middleware/upload.js';
import { getIO } from '../config/socket.js';
import { notifyNewAuction } from '../services/notificationService.js';

// Get all active auctions
export const getAllAuctions = async (req, res) => {
    try {
        const { category, search, status = 'active', page = 1, limit = 20 } = req.query;

        const query = { status };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const auctions = await Auction.find(query)
            .populate('sellerId', 'name avatar isEmailVerified')
            .populate('highestBidderId', 'name')
            .populate('winnerId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Auction.countDocuments(query);

        const auctionsWithCounts = auctions.map(a => {
            const doc = a.toObject ? a.toObject() : a;
            doc.watcherCount = (a.watcherIds && a.watcherIds.length) || 0;
            return doc;
        });

        // Prevent browser cache so list always reflects current DB (no stale products after DB clear)
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json({
            success: true,
            data: {
                auctions: auctionsWithCounts,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                total: count
            }
        });
    } catch (error) {
        console.error('Get auctions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch auctions',
            error: error.message
        });
    }
};

// Get single auction (increments view count)
export const getAuction = async (req, res) => {
    try {
        const auction = await Auction.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true }
        )
            .populate('sellerId', 'name avatar isEmailVerified')
            .populate('highestBidderId', 'name')
            .populate('winnerId', 'name');

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        const data = auction.toObject ? auction.toObject() : auction;
        data.watcherCount = (auction.watcherIds && auction.watcherIds.length) || 0;
        if (req.user) {
            data.isWatching = (auction.watcherIds || []).some(
                w => w.toString() === req.user._id.toString()
            );
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get auction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch auction',
            error: error.message
        });
    }
};

// Toggle watch (add/remove user from watchers) - requires auth
export const toggleWatch = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const auction = await Auction.findById(id);
        if (!auction) {
            return res.status(404).json({ success: false, message: 'Auction not found' });
        }

        const watcherIds = auction.watcherIds || [];
        const isWatching = watcherIds.some(w => w.toString() === userId.toString());

        if (isWatching) {
            auction.watcherIds = watcherIds.filter(w => w.toString() !== userId.toString());
        } else {
            auction.watcherIds = [...watcherIds, userId];
        }
        await auction.save();

        res.json({
            success: true,
            data: {
                watching: !isWatching,
                watcherCount: (auction.watcherIds && auction.watcherIds.length) || 0
            }
        });
    } catch (error) {
        console.error('Toggle watch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update watch',
            error: error.message
        });
    }
};

// Create new auction
export const createAuction = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            condition,
            yearMade,
            location,
            contactNumber,
            startingBid,
            minimumBidIncrement,
            reservePrice,
            buyNowPrice,
            duration
        } = req.body;

        // Upload images to S3
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image is required'
            });
        }

        const imageUrls = await uploadMultipleToS3(req.files, 'auctions');

        // Calculate auction end time
        const durationDays = parseInt(duration) || 7;
        const auctionEndTime = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        const auction = await Auction.create({
            title,
            description,
            category,
            condition,
            yearMade,
            location,
            contactNumber,
            images: imageUrls,
            sellerId: req.user._id,
            startingBid: parseFloat(startingBid),
            minimumBidIncrement: parseFloat(minimumBidIncrement),
            reservePrice: parseFloat(reservePrice) || 0,
            buyNowPrice: parseFloat(buyNowPrice) || 0,
            buyNowActive: buyNowPrice > 0,
            currentHighestBid: parseFloat(startingBid),
            auctionEndTime
        });

        // Notify all users about the new auction
        notifyNewAuction(auction);

        res.status(201).json({
            success: true,
            message: 'Auction created successfully',
            data: auction
        });
    } catch (error) {
        console.error('Create auction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create auction',
            error: error.message
        });
    }
};

// Update auction
export const updateAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check ownership
        if (auction.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this auction'
            });
        }

        // Cannot update if auction has bids
        if (auction.totalBids > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update auction with existing bids'
            });
        }

        const updates = req.body;
        Object.assign(auction, updates);
        await auction.save();

        res.json({
            success: true,
            message: 'Auction updated successfully',
            data: auction
        });
    } catch (error) {
        console.error('Update auction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update auction',
            error: error.message
        });
    }
};

// Delete auction
export const deleteAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check ownership
        if (auction.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this auction'
            });
        }

        // Cannot delete if auction has bids
        if (auction.totalBids > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete auction with existing bids'
            });
        }

        // Delete images from S3
        for (const imageUrl of auction.images) {
            await deleteFromS3(imageUrl);
        }

        await auction.deleteOne();

        res.json({
            success: true,
            message: 'Auction deleted successfully'
        });
    } catch (error) {
        console.error('Delete auction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete auction',
            error: error.message
        });
    }
};

// Get seller's auctions
export const getMyAuctions = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { sellerId: req.user._id };

        if (status) {
            query.status = status;
        }

        const auctions = await Auction.find(query)
            .populate('highestBidderId', 'name')
            .populate('winnerId', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: auctions
        });
    } catch (error) {
        console.error('Get my auctions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your auctions',
            error: error.message
        });
    }
};

// Get won auctions
export const getWonAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find({
            winnerId: req.user._id,
            status: 'sold'
        })
            .populate('sellerId', 'name avatar')
            .populate('winnerId', 'name')
            .lean() // Use lean to allow adding properties
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            data: auctions
        });
    } catch (error) {
        console.error('Get won auctions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch won auctions',
            error: error.message
        });
    }
};
