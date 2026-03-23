import { Poll } from '../../types';

export interface IPollRepository {
    getPoll(id: string): Promise<Poll | null>;
    getAllPolls(): Promise<Poll[]>;
    addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null>;
    createPoll(question: string, options: string[]): Promise<Poll>;
}
