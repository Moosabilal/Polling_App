import { ChatMessage } from '../../types';

export interface IChatRepository {
    saveMessage(userId: string, name: string, text: string, avatarUrl?: string): Promise<ChatMessage>;
    getRecentMessages(limit?: number): Promise<ChatMessage[]>;
    updateMessage(msgId: string, userId: string, newText: string): Promise<ChatMessage | null>;
    deleteMessage(msgId: string, userId: string): Promise<boolean>;
}
