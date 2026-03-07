import express from 'express';
import { getHomepageStats } from '../controllers/statsController.js';

const router = express.Router();

router.get('/', getHomepageStats);

export default router;
