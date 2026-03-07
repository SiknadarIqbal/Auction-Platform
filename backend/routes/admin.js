import express from 'express';
import {
    getAllUsers,
    pauseAuction,
    cancelAuction,
    toggleUserStatus,
    getAuditLogs
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', getAllUsers);
router.put('/auctions/:id/pause', pauseAuction);
router.put('/auctions/:id/cancel', cancelAuction);
router.put('/users/:id/status', toggleUserStatus);

router.get('/audit-logs', getAuditLogs);

export default router;
