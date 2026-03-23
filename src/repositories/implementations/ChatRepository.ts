import { injectable } from 'inversify';
import { IChatRepository } from '../interfaces/IChatRepository';
import { ChatMessage } from '../../types';
import { ChatMessageModel } from '../../models/ChatMessage';

@injectable()
export class ChatRepository implements IChatRepository {
    async saveMessage(userId: string, name: string, text: string): Promise<ChatMessage> {
        const message = new ChatMessageModel({ userId, name, text });
        await message.save();
        return {
            id: message._id.toString(),
            userId: message.userId,
            name: message.name,
            text: message.text,
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
            timestamp: msg.createdAt
        }));
    }
}
