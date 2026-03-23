"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
class MockDatabase {
    constructor() {
        this.users = new Map();
        this.polls = new Map();
        this.chats = [];
        this.initializeDefaultPoll();
    }
    initializeDefaultPoll() {
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
    connect() {
        console.log('Mock In-Memory Database connected.');
    }
}
exports.db = new MockDatabase();
