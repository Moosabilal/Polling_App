import { User, Poll, ChatMessage } from '../types';

class MockDatabase {
    public users: Map<string, User> = new Map();
    public polls: Map<string, Poll> = new Map();
    public chats: ChatMessage[] = [];

    constructor() {
        this.initializeDefaultPoll();
    }

    private initializeDefaultPoll() {
        this.polls.set('default-poll', {
            id: '1',
            question: 'What is your favorite programming language?',
            options: [
                { id: '1', text: 'JavaScript', votes: 0 },
                { id: '2', text: 'Python', votes: 0 },
                { id: '3', text: 'Java', votes: 0 },
                { id: '4', text: 'C#', votes: 0 }
            ],
            votedUserIds: []
        });
    }

    public connect(): void {
        console.log('Mock In-Memory Database connected.');
    }
}

export const db = new MockDatabase();
