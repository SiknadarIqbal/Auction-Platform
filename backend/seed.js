import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Auction from './models/Auction.js';
import Bid from './models/Bid.js';
import Category from './models/Category.js';
import connectDB from './config/db.js';

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        await Bid.deleteMany();
        await Auction.deleteMany();
        await User.deleteMany();

        const createdUsers = await User.insertMany([
            {
                name: 'System Admin',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin',
                isEmailVerified: true
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'buyer',
                isEmailVerified: true
            },
            {
                name: 'Alice Smith',
                email: 'alice@example.com',
                password: 'password123',
                role: 'seller',
                isEmailVerified: true
            }
        ]);

        const adminUser = createdUsers[0]._id;
        const sellerUser = createdUsers[2]._id;

        const sampleAuctions = [
            {
                title: 'Rolex Submariner 1960s',
                description: 'Rare vintage diving watch in pristine condition.',
                category: 'Watches',
                condition: 'Excellent',
                yearMade: '1965',
                location: 'Dubai, UAE',
                contactNumber: '+971 50 123 4567',
                images: ['https://res.cloudinary.com/demo/image/upload/v1612345678/watch.jpg'],
                sellerId: adminUser,
                startingBid: 12500,
                minimumBidIncrement: 100,
                currentHighestBid: 12500,
                buyNowPrice: 15000,
                auctionEndTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                status: 'active'
            },
            {
                title: 'Ming Dynasty Vase',
                description: 'Authentic 15th century ceramic masterpiece.',
                category: 'Antiques',
                condition: 'Mint',
                yearMade: '1450',
                location: 'Riyadh, KSA',
                contactNumber: '+966 50 123 4567',
                images: ['https://res.cloudinary.com/demo/image/upload/v1612345678/vase.jpg'],
                sellerId: sellerUser,
                startingBid: 8900,
                minimumBidIncrement: 50,
                currentHighestBid: 8900,
                buyNowPrice: 10000,
                auctionEndTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
                status: 'active'
            },
            {
                title: '1909 S VDB Lincoln Penny',
                description: 'Extremely rare coin, MS-65 grade.',
                category: 'Collectibles',
                condition: 'Good',
                yearMade: '1909',
                location: 'Jeddah, KSA',
                contactNumber: '+966 55 123 4567',
                images: ['https://res.cloudinary.com/demo/image/upload/v1612345678/coin.jpg'],
                sellerId: sellerUser,
                startingBid: 15000,
                minimumBidIncrement: 200,
                currentHighestBid: 15000,
                buyNowPrice: 18000,
                auctionEndTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
                status: 'active'
            }
        ];

        await Auction.insertMany(sampleAuctions);

        console.log('✅ Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error importing data: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        await Bid.deleteMany();
        await Auction.deleteMany();
        await User.deleteMany();

        console.log('❌ Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error destroying data: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
