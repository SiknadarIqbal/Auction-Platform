import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSeller } from '../middleware/roleCheck.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(authenticate, upload.array('images', 10), createProduct); // Allow up to 10 images

router.route('/:id')
    .get(getProductById)
    .put(authenticate, requireSeller, updateProduct)
    .delete(authenticate, requireSeller, deleteProduct);

export default router;
