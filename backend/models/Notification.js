import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['outbid', 'win', 'loss', 'sale', 'info', 'new_auction', 'auction_ending', 'payment_due', 'auction_extended', 'auction_paused', 'auction_cancelled', 'bid_placed'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    params: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        default: null
    },
    readStatus: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, readStatus: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
