import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    condition: {
        type: String,
        required: [true, 'Condition is required'],
        enum: ['Mint', 'Excellent', 'Very Good', 'Good', 'Fair', 'Restored']
    },
    yearMade: {
        type: String,
        required: [true, 'Year made is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required']
    },
    images: {
        type: [String],
        validate: {
            validator: function (v) {
                return v.length > 0 && v.length <= 10;
            },
            message: 'Must have between 1 and 10 images'
        },
        required: [true, 'At least one image is required']
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startingBid: {
        type: Number,
        required: [true, 'Starting bid is required'],
        min: [0, 'Starting bid must be positive']
    },
    minimumBidIncrement: {
        type: Number,
        required: [true, 'Minimum bid increment is required'],
        min: [1, 'Minimum bid increment must be at least 1']
    },
    reservePrice: {
        type: Number,
        default: 0,
        min: [0, 'Reserve price must be positive']
    },
    buyNowPrice: {
        type: Number,
        default: 0,
        min: [0, 'Buy now price must be positive']
    },
    buyNowActive: {
        type: Boolean,
        default: true
    },
    currentHighestBid: {
        type: Number,
        default: 0
    },
    highestBidderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    totalBids: {
        type: Number,
        default: 0
    },
    auctionStartTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    auctionEndTime: {
        type: Date,
        required: [true, 'Auction end time is required']
    },
    extensionCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'unsold', 'paused', 'cancelled'],
        default: 'active'
    },
    pauseReason: {
        type: String,
        default: ''
    },
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    finalPrice: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    watcherIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for efficient queries
auctionSchema.index({ status: 1, auctionEndTime: 1 });
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ sellerId: 1 });

// Virtual for time remaining
auctionSchema.virtual('timeRemaining').get(function () {
    if (this.status !== 'active') return 0;
    const now = new Date();
    const remaining = this.auctionEndTime - now;
    return Math.max(0, remaining);
});

// Check if reserve is met
auctionSchema.virtual('isReserveMet').get(function () {
    return this.currentHighestBid >= this.reservePrice;
});

const Auction = mongoose.model('Auction', auctionSchema);

export default Auction;
