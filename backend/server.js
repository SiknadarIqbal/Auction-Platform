import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { configureSocket } from './config/socket.js';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import './config/s3.js';
import startCronJobs from './services/cronService.js';

import authRoutes from './routes/auth.js';
import auctionRoutes from './routes/auctions.js';
import bidRoutes from './routes/bids.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import ratingRoutes from './routes/ratings.js';
import statsRoutes from './routes/stats.js';

// Load env
dotenv.config();

// Disable mongoose buffering (VERY IMPORTANT)
mongoose.set('bufferCommands', false);

const app = express();
const server = http.createServer(app);

// Socket
configureSocket(server);

// Middleware
app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

const BODY_LIMIT = process.env.BODY_LIMIT || '10mb';
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ✅ START SERVER ONLY AFTER DB CONNECTS
const startServer = async () => {
    try {
        console.log('☁️ Connecting to MongoDB Atlas...');

        await connectDB(); // 👈 MUST WAIT

        console.log('✅ MongoDB connected');

        // Start cron AFTER DB
        startCronJobs();

        server.listen(PORT, () => {
            console.log(`
🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}
📡 Socket.IO initialized
🔌 Database connected
            `);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
});