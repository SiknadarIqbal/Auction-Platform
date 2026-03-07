import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@auction.com';
        const adminPassword = 'adminPassword123'; // User should change this after first login

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`ℹ️  Admin user with email ${adminEmail} already exists.`);
        } else {
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                isEmailVerified: true
            });
            console.log(`✅ Admin user created successfully!`);
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
        }

        await mongoose.connection.close();
        console.log('🏁 Seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Seeding failed: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
