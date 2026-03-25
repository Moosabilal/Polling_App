import { Poll } from '../../types';

export interface IPollService {
    getPollById(id: string): Promise<Poll | null>;
    getAllPolls(): Promise<Poll[]>;
    addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null>;
    createPoll(question: string, options: string[]): Promise<Poll>;
    updatePoll(pollId: string, question: string, options: string[]): Promise<Poll | null>;
    deletePoll(pollId: string): Promise<boolean>;
}
