import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
    userId: string;
    name: string;
    text: string;
    avatarPublicId?: string;
    filePublicId?: string;
    fileResourceType?: string;
    fileName?: string;
    fileType?: string;
    avatarUrl?: string;
    fileUrl?: string;
    avatarResourceType?: string;
    createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, default: '' },
    avatarPublicId: { type: String },
    filePublicId: { type: String },
    fileResourceType: { type: String },
    fileName: { type: String },
    fileType: { type: String }
}, { timestamps: true });

export const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
