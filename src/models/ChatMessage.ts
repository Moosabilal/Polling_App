import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
    userId: string;
    name: string;
    text: string;
    createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, required: true }
}, { timestamps: true });

export const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
