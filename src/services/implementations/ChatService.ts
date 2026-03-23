import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types';
import { IChatService } from '../interfaces/IChatService';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository';
import { ChatMessage } from '../../types';

@injectable()
export class ChatService implements IChatService {
    constructor(@inject(TYPES.IChatRepository) private chatRepository: IChatRepository) { }

    async addMessage(userId: string, name: string, text: string): Promise<ChatMessage> {
        if (!text || text.trim() === '') {
            throw new Error('Message cannot be empty');
        }
        return await this.chatRepository.saveMessage(userId, name, text.trim());
    }

    async getChatHistory(): Promise<ChatMessage[]> {
        return await this.chatRepository.getRecentMessages(50);
    }
}
