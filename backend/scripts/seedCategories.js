import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import connectDB from '../config/db.js';

dotenv.config();

const categories = [
    { name: 'Watches', description: 'Luxury and vintage timepieces from around the world.', icon: 'FaClock' },
    { name: 'Antiques', description: 'Rare historical artifacts and ancient masterpieces.', icon: 'FaGem' },
    { name: 'Collectibles', description: 'Limited edition items, coins, and memorabilia.', icon: 'FaTags' },
    { name: 'Fine Art', description: 'Original paintings, sketches, and sculptures.', icon: 'FaPalette' },
    { name: 'Jewelry', description: 'Exquisite gemstones, gold, and designer jewelry.', icon: 'FaGem' },
    { name: 'Furniture', description: 'Classic and modern high-end furniture pieces.', icon: 'FaCouch' },
    { name: 'Electronics', description: 'Premium gadgets, vintage tech, and high-end audio.', icon: 'FaBroadcastTower' },
    { name: 'Automobiles', description: 'Classic cars, luxury vehicles, and rare parts.', icon: 'FaBox' },
    { name: 'Real Estate', description: 'Exclusive properties, land, and luxury estates.', icon: 'FaList' },
    { name: 'Rare Books', description: 'First editions, manuscripts, and historical texts.', icon: 'FaBox' },
    { name: 'Sports Memorabilia', description: 'Signed jerseys, trophies, and historical gear.', icon: 'FaTrophy' },
    { name: 'Wine & Spirits', description: 'Fine wines, rare whiskies, and vintage spirits.', icon: 'FaBox' },
    { name: 'Musical Instruments', description: 'Professional gear, vintage guitars, and pianos.', icon: 'FaBox' },
    { name: 'Fashion & Bags', description: 'Designer clothing, rare handbags, and accessories.', icon: 'FaBox' },
    { name: 'Numismatics', description: 'Rare coins, banknotes, and currency collections.', icon: 'FaTags' }
];

const seedCategories = async () => {
    try {
        await connectDB();

        for (let cat of categories) {
            // Manually generate slug because findOneAndUpdate doesn't trigger pre('save') middleware
            const slug = cat.name.toLowerCase().split(' ').join('-');
            const categoryData = { ...cat, slug };

            await Category.findOneAndUpdate(
                { name: cat.name },
                categoryData,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        console.log(`✅ Successfully seeded ${categories.length} categories.`);

        await mongoose.connection.close();
        console.log('🏁 Seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Seeding failed: ${error.message}`);
        process.exit(1);
    }
};

seedCategories();
