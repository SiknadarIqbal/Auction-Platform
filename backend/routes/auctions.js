import express from 'express';
import {
    createAuction,
    getAllAuctions,
    getAuction,
    updateAuction,
    deleteAuction,
    getMyAuctions,
    getWonAuctions,
    toggleWatch
} from '../controllers/auctionController.js';
import { authenticate, optionalAuthenticate, requireEmailVerification } from '../middleware/auth.js';
import { requireSeller, requireAdmin } from '../middleware/roleCheck.js';
import upload from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', getAllAuctions);
router.get('/:id', optionalAuthenticate, getAuction);

// Protected routes
router.use(authenticate);

router.post('/',
    requireEmailVerification,
    requireSeller,
    uploadLimiter,
    upload.array('images', 10),
    createAuction
);

router.put('/:id', requireSeller, updateAuction);
router.put('/:id/watch', toggleWatch);
router.delete('/:id', requireSeller, deleteAuction);
router.get('/user/my-auctions', requireSeller, getMyAuctions);
router.get('/user/won', getWonAuctions);

export default router;
