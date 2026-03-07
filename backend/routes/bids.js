import express from 'express';
import {
    placeBid,
    getAuctionBidHistory,
    getMyBids,
    buyNow
} from '../controllers/bidController.js';
import { authenticate, requireEmailVerification } from '../middleware/auth.js';
import { bidLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/auction/:auctionId', getAuctionBidHistory);

// Protected routes
router.use(authenticate);

router.post('/',
    requireEmailVerification,

    bidLimiter,
    placeBid
);

router.post('/buy-now',
    requireEmailVerification,

    buyNow
);

router.get('/my-bids', getMyBids);

export default router;
