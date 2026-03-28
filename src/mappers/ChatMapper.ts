import { ChatMessage } from '../types/index.js';
import { Document } from 'mongoose';
import { IChatMessage } from '../models/ChatMessage.js';
import { v2 as cloudinary } from 'cloudinary';

export class ChatMapper {
    static toDomain(msgDoc: Document & IChatMessage): ChatMessage {
        let fileUrl: string | undefined;
        let avatarUrl: string | undefined;

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dpcgcvfdp';

        // 1. Generate Signed URL for the attached file
        if (msgDoc.filePublicId) {
            const resourceType = msgDoc.fileResourceType || 'image';
            fileUrl = cloudinary.utils.url(msgDoc.filePublicId, {
                resource_type: resourceType,
                type: 'authenticated',
                sign_url: true,
                secure: true
            });
        } else if (msgDoc.fileUrl) {
            // Fallback for old messages before the signed URL migration
            fileUrl = msgDoc.fileUrl;
        }

        // 2. Generate Signed URL for the user's avatar
        if (msgDoc.avatarPublicId) {
            const avatarResourceType = msgDoc.avatarResourceType || 'image';
            avatarUrl = cloudinary.utils.url(msgDoc.avatarPublicId, {
                resource_type: avatarResourceType,
                type: 'authenticated',
                sign_url: true,
                secure: true
            });
        } else if (msgDoc.avatarUrl) {
            // Fallback for old messages
            avatarUrl = msgDoc.avatarUrl;
        } else if (msgDoc.name) {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(msgDoc.name)}&background=random`;
        }

        return {
            id: msgDoc._id.toString(),
            userId: msgDoc.userId,
            name: msgDoc.name,
            text: msgDoc.text,
            avatarUrl: msgDoc.avatarUrl,
            fileUrl,
            filePublicId: msgDoc.filePublicId,
            fileResourceType: msgDoc.fileResourceType,
            fileName: msgDoc.fileName,
            fileType: msgDoc.fileType,
            timestamp: msgDoc.createdAt
        };
    }
}
