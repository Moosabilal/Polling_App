import { ChatMessage } from '../../types';

export interface IChatService {
    addMessage(userId: string, name: string, text: string, avatarPublicId?: string, filePublicId?: string, fileResourceType?: string, fileName?: string, fileType?: string): Promise<ChatMessage>;
    getChatHistory(): Promise<ChatMessage[]>;
    updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null>;
    deleteMessage(msgId: string, userId: string): Promise<boolean>;
}
