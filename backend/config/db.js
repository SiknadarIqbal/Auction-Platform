import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    // Always use MongoDB Atlas (no local DB option)
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_ATLAS;
    if (!uri || !uri.includes('mongodb')) {
      throw new Error('MONGODB_URI or MONGODB_URI_ATLAS must be set in .env (MongoDB Atlas connection string)');
    }
    // Use public DNS so Atlas SRV lookup resolves (fixes querySrv ESERVFAIL)
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    console.log('☁️  Connecting to MongoDB Atlas...');

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
