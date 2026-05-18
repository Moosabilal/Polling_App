import { Poll, PollOption } from '../../types/index.js';

export interface IPollRepository {
    findById(pollId: string): Promise<Poll | null>;
    getPollsPaginated(page: number, limit: number): Promise<{ polls: Poll[], totalCount: number }>;
    createPoll(pollData: Omit<Poll, 'id'>): Promise<Poll>;
    updatePollData(pollId: string, question: string, options: PollOption[], voters: {userId: string, optionId: string}[]): Promise<Poll | null>;
    deletePoll(pollId: string, creatorId: string): Promise<boolean>;
}
