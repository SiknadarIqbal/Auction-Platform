import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        required: true
    },
    startingBid: {
        type: Number,
        required: true
    },
    currentBid: {
        type: Number,
        default: 0
    },
    buyNowPrice: {
        type: Number
    },
    endDate: {
        type: Date,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Ideally required, but for admin products maybe optional or admin user
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'expired'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
