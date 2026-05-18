import { DetailedPollResult, Poll } from '../../types/index.js';

export interface IPollService {
    getPollsPaginated(page: number, limit: number): Promise<{ polls: Poll[], totalCount: number }>;
    addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null>;
    createPoll(question: string, options: string[], creatorId: string): Promise<Poll>;
    updatePoll(pollId: string, creatorId: string, question: string, options: string[]): Promise<Poll | null>;
    deletePoll(pollId: string, creatorId: string): Promise<boolean>;
    getPollResults(pollId: string): Promise<DetailedPollResult | null>;
}
