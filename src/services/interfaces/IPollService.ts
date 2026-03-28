import { Poll } from '../../types';

export interface IPollService {
    getPollsPaginated(page: number, limit: number): Promise<{ polls: Poll[], totalCount: number }>;
    addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null>;
    createPoll(question: string, options: string[]): Promise<Poll>;
    updatePoll(pollId: string, question: string, options: string[]): Promise<Poll | null>;
    deletePoll(pollId: string): Promise<boolean>;
}
