export interface User {
    id: string;
    name: string;
    email: string;
}

export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    votedUserIds: string[];
    userVotes?: { userId: string, optionId: string }[];
}

export interface ChatMessage {
    id: string;
    userId: string;
    name: string;
    text: string;
    timestamp: Date;
}
