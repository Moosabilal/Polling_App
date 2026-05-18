import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.js';
import { IChatService } from '../interfaces/IChatService.js';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository.js';
import { ChatMessage } from '../../types/index.js';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '../../utils/constants.js';
import { CustomError } from '../../utils/CustomError.js';
@injectable()
export class ChatService implements IChatService {

    constructor(@inject(TYPES.IChatRepository) private chatRepository: IChatRepository) { }

    async addMessage(userId: string, name: string, text: string, avatarPublicId?: string, filePublicId?: string, fileResourceType?: string, fileName?: string, fileType?: string): Promise<ChatMessage> {
        if (!text && !filePublicId) {
            throw new CustomError(RESPONSE_MESSAGES.MESSAGE_CANNOT_BE_EMPTY, HTTP_STATUS.BAD_REQUEST);
        }
        return await this.chatRepository.saveMessage(userId, name, text?.trim() || '', avatarPublicId, filePublicId, fileResourceType, fileName, fileType);
    }

    async getChatHistory(): Promise<ChatMessage[]> {
        return await this.chatRepository.getRecentMessages(50);
    }

    async updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null> {
        if (!newText || newText.trim() === '') {
            throw new CustomError(RESPONSE_MESSAGES.MESSAGE_CANNOT_BE_EMPTY, HTTP_STATUS.BAD_REQUEST);
        }

        const existingMessage = await this.chatRepository.getMessageById(msgId);
        if (!existingMessage) {
            throw new CustomError(RESPONSE_MESSAGES.MESSAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
        }
        if (existingMessage.userId !== userId) {
            throw new CustomError(RESPONSE_MESSAGES.NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
        }

        const now = new Date();
        const diffMs = now.getTime() - existingMessage.timestamp.getTime();
        if (diffMs > 15 * 60 * 1000) {
            throw new CustomError('Messages can only be edited within 15 minutes of sending.', HTTP_STATUS.FORBIDDEN);
        }

        return await this.chatRepository.updateMessage(msgId, userId, newText.trim());
    }

    async deleteMessage(msgId: string, userId: string): Promise<boolean> {
        return await this.chatRepository.deleteMessage(msgId, userId);
    }
}
