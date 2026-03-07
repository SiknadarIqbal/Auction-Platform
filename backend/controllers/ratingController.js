import Rating from '../models/Rating.js';
import Auction from '../models/Auction.js';
import User from '../models/User.js';

// Create a rating
export const createRating = async (req, res) => {
    try {
        const { auctionId, rating, comment } = req.body;
        const reviewerId = req.user._id;

        // Verify auction exists and is sold
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ success: false, message: 'Auction not found' });
        }

        if (auction.status !== 'sold') {
            return res.status(400).json({ success: false, message: 'Can only rate completed (sold) auctions' });
        }

        // Determine reviewed user (opposite party)
        let reviewedUserId;
        if (reviewerId.toString() === auction.sellerId.toString()) {
            // Seller rating Buyer
            reviewedUserId = auction.winnerId;
        } else if (reviewerId.toString() === auction.winnerId.toString()) {
            // Buyer rating Seller
            reviewedUserId = auction.sellerId;
        } else {
            return res.status(403).json({ success: false, message: 'You were not a participant in this transaction' });
        }

        // Check if already rated
        const existingRating = await Rating.findOne({ reviewerId, auctionId });
        if (existingRating) {
            return res.status(400).json({ success: false, message: 'You have already submitted a rating for this auction' });
        }

        const newRating = await Rating.create({
            reviewerId,
            reviewedUserId,
            auctionId,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully',
            data: newRating
        });

    } catch (error) {
        console.error('Create rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit rating',
            error: error.message
        });
    }
};

// Get ratings for a user
export const getUserRatings = async (req, res) => {
    try {
        const { userId } = req.params;

        const ratings = await Rating.find({ reviewedUserId: userId })
            .populate('reviewerId', 'name avatar')
            .populate('auctionId', 'title')
            .sort({ createdAt: -1 });

        // Calculate average
        const count = ratings.length;
        const average = count > 0
            ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / count).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                ratings,
                average,
                count
            }
        });

    } catch (error) {
        console.error('Get user ratings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ratings',
            error: error.message
        });
    }
};
