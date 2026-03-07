import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true,
        index: true
    },
    bidderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    bidAmount: {
        type: Number,
        required: [true, 'Bid amount is required'],
        min: [0, 'Bid amount must be positive']
    },
    isWinning: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
bidSchema.index({ auctionId: 1, timestamp: -1 });
bidSchema.index({ bidderId: 1, timestamp: -1 });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
