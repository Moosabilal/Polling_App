export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    avatarPublicId?: string;
    avatarResourceType?: string;
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
    avatarUrl?: string;
    fileUrl?: string;       // generated at read-time from publicId
    filePublicId?: string;
    fileResourceType?: string;
    fileName?: string;
    fileType?: string;
    timestamp: Date;
}

export interface UserUpdatePayload {
    name: string;
    avatarPublicId?: string;
    avatarResourceType?: string;
}