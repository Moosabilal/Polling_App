import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types';
import { IChatService } from '../interfaces/IChatService';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository';
import { ChatMessage } from '../../types';

@injectable()
export class ChatService implements IChatService {
    
    constructor(@inject(TYPES.IChatRepository) private chatRepository: IChatRepository) { }

    async addMessage(userId: string, name: string, text: string, avatarPublicId?: string, filePublicId?: string, fileResourceType?: string, fileName?: string, fileType?: string): Promise<ChatMessage> {
        if (!text && !filePublicId) {
            throw new Error('Message cannot be empty');
        }
        return await this.chatRepository.saveMessage(userId, name, text?.trim() || '', avatarPublicId, filePublicId, fileResourceType, fileName, fileType);
    }

    async getChatHistory(): Promise<ChatMessage[]> {
        return await this.chatRepository.getRecentMessages(50);
    }

    async updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null> {
        if (!newText || newText.trim() === '') {
            throw new Error('Message cannot be empty');
        }
        return await this.chatRepository.updateMessage(msgId, userId, newText.trim());
    }

    async deleteMessage(msgId: string, userId: string): Promise<boolean> {
        return await this.chatRepository.deleteMessage(msgId, userId);
    }
}
