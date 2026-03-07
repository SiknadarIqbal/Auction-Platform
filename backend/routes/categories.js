import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSeller } from '../middleware/roleCheck.js';

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(authenticate, requireSeller, createCategory);

router.route('/:id')
    .put(authenticate, requireSeller, updateCategory)
    .delete(authenticate, requireSeller, deleteCategory);

export default router;
