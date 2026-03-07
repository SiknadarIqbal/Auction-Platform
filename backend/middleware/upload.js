import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'auction_products', // Cloudinary folder name
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit' }] // Optional resizing
    }
});

const upload = multer({ storage: storage });

// Helper for single manual upload
export const uploadToCloudinary = async (file, folder) => {
    try {
        if (!file) return null;
        if (file.path && file.path.includes('cloudinary')) return file.path;

        const result = await cloudinary.uploader.upload(file.path, { folder });
        return result.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};

// Helper for multiple manual uploads
export const uploadMultipleToCloudinary = async (files, folder) => {
    try {
        const promises = files.map(file => {
            if (file.path && file.path.includes('cloudinary')) return Promise.resolve(file.path);
            return cloudinary.uploader.upload(file.path, { folder });
        });

        const results = await Promise.all(promises);
        return results.map(res => res.secure_url || res);
    } catch (error) {
        console.error("Error uploading multiple to Cloudinary:", error);
        throw error;
    }
};

// Helper to delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return;
        let id = publicId;
        if (publicId.includes('cloudinary.com')) {
            const parts = publicId.split('/');
            const filename = parts[parts.length - 1];
            const folder = parts[parts.length - 2];
            id = `${folder}/${filename.split('.')[0]}`;
        }
        await cloudinary.uploader.destroy(id);
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};

export { upload };
export default upload;
