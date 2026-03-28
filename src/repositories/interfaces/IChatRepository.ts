import { ChatMessage } from '../../types/index.js';

export interface IChatRepository {
    saveMessage(userId: string, name: string, text: string, avatarPublicId?: string, filePublicId?: string, fileResourceType?: string, fileName?: string, fileType?: string): Promise<ChatMessage>;
    getRecentMessages(limit?: number): Promise<ChatMessage[]>;
    updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null>;
    deleteMessage(msgId: string, userId: string): Promise<boolean>;
}
