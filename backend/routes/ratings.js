import express from 'express';
import { createRating, getUserRatings } from '../controllers/ratingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/user/:userId', getUserRatings);

// Protected routes
router.use(authenticate);
router.post('/', createRating);

export default router;
