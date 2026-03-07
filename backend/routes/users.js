import express from 'express';
import {
    getProfile,
    updateProfile,
    changePassword,
    getNotifications,
    markNotificationRead,
    deleteAccount
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', upload.single('avatar'), updateProfile);
router.put('/change-password', changePassword);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

router.delete('/', deleteAccount);

export default router;
