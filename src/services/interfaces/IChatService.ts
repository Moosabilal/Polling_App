import { ChatMessage } from '../../types';

export interface IChatService {
    addMessage(userId: string, name: string, text: string): Promise<ChatMessage>;
    getChatHistory(): Promise<ChatMessage[]>;
}
