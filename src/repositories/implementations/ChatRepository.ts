import { injectable } from 'inversify';
import { IChatRepository } from '../interfaces/IChatRepository.js';
import { ChatMessage } from '../../types/index.js';
import { ChatMessageModel } from '../../models/ChatMessage.js';
import { ChatMapper } from '../../mappers/ChatMapper.js';

@injectable()
export class ChatRepository implements IChatRepository {
    
    async saveMessage(userId: string, name: string, text: string, avatarPublicId?: string, filePublicId?: string, fileResourceType?: string, fileName?: string, fileType?: string): Promise<ChatMessage> {
        const message = new ChatMessageModel({ userId, name, text, avatarPublicId, filePublicId, fileResourceType, fileName, fileType });
        await message.save();
        return ChatMapper.toDomain(message);
    }

    async getRecentMessages(limit: number = 50): Promise<ChatMessage[]> {
        const messages = await ChatMessageModel.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        return messages.reverse().map(msg => ChatMapper.toDomain(msg));
    }

    async getMessageById(msgId: string): Promise<ChatMessage | null> {
        const message = await ChatMessageModel.findById(msgId);
        if (!message) return null;
        return ChatMapper.toDomain(message);
    }

    async updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null> {
        const message = await ChatMessageModel.findOne({ _id: msgId, userId: userId });
        if (!message) return null;

        message.text = newText;
        await message.save();

        return ChatMapper.toDomain(message);
    }

    async deleteMessage(msgId: string, userId: string): Promise<boolean> {
        const result = await ChatMessageModel.deleteOne({ _id: msgId, userId: userId });
        return result.deletedCount > 0;
    }
}
