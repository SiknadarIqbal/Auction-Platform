import multer from 'multer';
import multerS3 from 'multer-s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3.js';
import path from 'path';

const bucketName = process.env.AWS_BUCKET_NAME;

// Configure Storage for S3
const storage = multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: function (req, file, cb) {
        cb(null, {
            fieldName: file.fieldname,
            originalName: file.originalname
        });
    },
    key: function (req, file, cb) {
        const folder = req.body.folder || 'uploads';
        const filename = `${folder}/${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

// File filter for allowed formats
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper for single manual upload
export const uploadToS3 = async (file, folder) => {
    try {
        if (!file) return null;
        if (file.location) return file.location; // Already uploaded

        const key = `${folder}/${Date.now()}-${file.originalname}`;
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        });

        await s3.send(command);
        return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
};

// Helper for multiple manual uploads
export const uploadMultipleToS3 = async (files, folder) => {
    try {
        const uploadPromises = files.map(async (file) => {
            if (file.location) return file.location;

            const key = `${folder}/${Date.now()}-${file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await s3.send(command);
            return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
        });

        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error("Error uploading multiple to S3:", error);
        throw error;
    }
};

// Helper to delete from S3
export const deleteFromS3 = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        // Extract key from S3 URL
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        await s3.send(command);
        console.log(`✅ Deleted from S3: ${key}`);
    } catch (error) {
        console.error("Error deleting from S3:", error);
    }
};

export { upload };
export default upload;
