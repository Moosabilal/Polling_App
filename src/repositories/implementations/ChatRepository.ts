import { injectable } from 'inversify';
import { IChatRepository } from '../interfaces/IChatRepository';
import { ChatMessage } from '../../types';
import { ChatMessageModel } from '../../models/ChatMessage';

@injectable()
export class ChatRepository implements IChatRepository {
    async saveMessage(userId: string, name: string, text: string, avatarUrl?: string): Promise<ChatMessage> {
        const message = new ChatMessageModel({ userId, name, text, avatarUrl });
        await message.save();
        return {
            id: message._id.toString(),
            userId: message.userId,
            name: message.name,
            text: message.text,
            avatarUrl: message.avatarUrl,
            timestamp: message.createdAt
        };
    }

    async getRecentMessages(limit: number = 50): Promise<ChatMessage[]> {
        const messages = await ChatMessageModel.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        // Reverse so they are in chronological order
        return messages.reverse().map(msg => ({
            id: msg._id.toString(),
            userId: msg.userId,
            name: msg.name,
            text: msg.text,
            avatarUrl: msg.avatarUrl,
            timestamp: msg.createdAt
        }));
    }

    async updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null> {
        const message = await ChatMessageModel.findOne({ _id: msgId, userId: userId });
        if (!message) return null;

        const now = new Date();
        const diffMs = now.getTime() - message.createdAt.getTime();
        if (diffMs > 15 * 60 * 1000) {
            throw new Error('Messages can only be edited within 15 minutes of sending.');
        }

        message.text = newText;
        await message.save();

        return {
            id: message._id.toString(),
            userId: message.userId,
            name: message.name,
            text: message.text,
            avatarUrl: message.avatarUrl,
            timestamp: message.createdAt
        };
    }

    async deleteMessage(msgId: string, userId: string): Promise<boolean> {
        const result = await ChatMessageModel.deleteOne({ _id: msgId, userId: userId });
        return result.deletedCount > 0;
    }
}
