import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Prevent multiple ratings for same auction by same user
ratingSchema.index({ reviewerId: 1, auctionId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
