import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.ts';
import { IChatService } from '../interfaces/IChatService.ts';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository.ts';
import { ChatMessage } from '../../types/index.ts';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '../../utils/constants.ts';
import { CustomError } from '../../utils/CustomError.ts';
import { ChatMapper } from '../../mappers/ChatMapper.ts';

@injectable()
export class ChatService implements IChatService {

    constructor(@inject(TYPES.IChatRepository) private _chatRepository: IChatRepository) { }

    async addMessage(userId: string, name: string, text: string, avatarPublicId?: string, filePublicId?: string, fileResourceType?: string, fileName?: string, fileType?: string): Promise<ChatMessage> {
        if (!text && !filePublicId) {
            throw new CustomError(RESPONSE_MESSAGES.MESSAGE_CANNOT_BE_EMPTY, HTTP_STATUS.BAD_REQUEST);
        }
        const msg = await this._chatRepository.saveMessage(userId, name, text?.trim() || '', avatarPublicId, filePublicId, fileResourceType, fileName, fileType);
        return ChatMapper.toDTO(msg);
    }

    async getChatHistory(): Promise<ChatMessage[]> {
        const messages = await this._chatRepository.getRecentMessages(50);
        return messages.map(m => ChatMapper.toDTO(m));
    }

    async updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null> {
        if (!newText || newText.trim() === '') {
            throw new CustomError(RESPONSE_MESSAGES.MESSAGE_CANNOT_BE_EMPTY, HTTP_STATUS.BAD_REQUEST);
        }

        const existingMessage = await this._chatRepository.getMessageById(msgId);
        if (!existingMessage) {
            throw new CustomError(RESPONSE_MESSAGES.MESSAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }
        if (existingMessage.userId !== userId) {
            throw new CustomError(RESPONSE_MESSAGES.NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
        }

        const now = new Date();
        const diffMs = now.getTime() - existingMessage.timestamp.getTime();
        if (diffMs > 15 * 60 * 1000) {
            throw new CustomError('Messages can only be edited within 15 minutes of sending.', HTTP_STATUS.FORBIDDEN);
        }

        const updated = await this._chatRepository.updateMessage(msgId, userId, newText.trim());
        if (!updated) return null;
        return ChatMapper.toDTO(updated);
    }

    async deleteMessage(msgId: string, userId: string): Promise<boolean> {
        return await this._chatRepository.deleteMessage(msgId, userId);
    }
}
