import { Router, Request, Response } from 'express';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { authMiddleware } from '../middleware/auth.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { data, fileName, fileType, folder } = req.body;

        if (!data) {
            return res.status(400).json({ success: false, message: 'No file data provided.' });
        }

        // Determine resource_type explicitly — do NOT use 'auto' for PDFs/docs
        // because Cloudinary tries to rasterize them as images (paid feature → 401)
        let resourceType: 'image' | 'video' | 'raw' = 'raw';
        if (fileType && fileType.startsWith('image/')) resourceType = 'image';
        else if (fileType && fileType.startsWith('video/')) resourceType = 'video';

        const uploadOptions: UploadApiOptions = {
            folder: folder || 'spacevote/chat',
            type: 'authenticated', // Restrict access; requires signed URLs
            resource_type: resourceType,
            use_filename: false,
            unique_filename: true,
            overwrite: false,
        };

        const result = await cloudinary.uploader.upload(data, uploadOptions);

        return res.json({
            success: true,
            publicId: result.public_id,
            resourceType: result.resource_type,
            fileName: fileName || 'file',
            fileType: fileType || result.resource_type,
        });
    } catch (err: unknown) {
        const error = err as Error;
        console.error('[UPLOAD] Cloudinary upload failed:', error.message);
        return res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
    }
});

export default router;
