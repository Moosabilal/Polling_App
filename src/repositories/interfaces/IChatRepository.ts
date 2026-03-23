export interface IChatRepository {
    saveMessage(userId: string, name: string, text: string): Promise<ChatMessage>;
    getRecentMessages(limit?: number): Promise<ChatMessage[]>;
}
