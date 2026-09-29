import { ChatMessage } from '../types/index.js';
import { Document } from 'mongoose';
import { IChatMessage } from '../models/ChatMessage.js';
import { v2 as cloudinary } from 'cloudinary';

export interface ChatMessageDTO {
    id: string;
    userId: string;
    name: string;
    text: string;
    avatarUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    timestamp: Date;
}

export class ChatMapper {
    static toDomain(msgDoc: Document & IChatMessage): ChatMessage {
        let fileUrl: string | undefined;
        let avatarUrl: string | undefined;

        if (msgDoc.filePublicId) {
            const resourceType = msgDoc.fileResourceType || 'image';
            fileUrl = cloudinary.utils.url(msgDoc.filePublicId, {
                resource_type: resourceType,
                type: 'authenticated',
                sign_url: true,
                secure: true
            });
        } else if (msgDoc.fileUrl) {
            fileUrl = msgDoc.fileUrl;
        }

        if (msgDoc.avatarPublicId) {
            const avatarResourceType = msgDoc.avatarResourceType || 'image';
            avatarUrl = cloudinary.utils.url(msgDoc.avatarPublicId, {
                resource_type: avatarResourceType,
                type: 'authenticated',
                sign_url: true,
                secure: true
            });
        } else if (msgDoc.avatarUrl) {
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

    /** Strips internal storage fields (filePublicId, fileResourceType, etc.) — safe to send to the frontend */
    static toDTO(msg: ChatMessage): ChatMessageDTO {
        return {
            id: msg.id,
            userId: msg.userId,
            name: msg.name,
            text: msg.text,
            avatarUrl: msg.avatarUrl,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileType: msg.fileType,
            timestamp: msg.timestamp
        };
    }
}
