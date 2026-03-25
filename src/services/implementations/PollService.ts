import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types';
import { IPollService } from '../interfaces/IPollService';
import { IPollRepository } from '../../repositories/interfaces/IPollRepository';
import { Poll } from '../../types';

@injectable()
export class PollService implements IPollService {
    constructor(@inject(TYPES.IPollRepository) private pollRepository: IPollRepository) { }

    async getPollById(id: string): Promise<Poll | null> {
        return await this.pollRepository.getPoll(id);
    }

    async getAllPolls(): Promise<Poll[]> {
        return await this.pollRepository.getAllPolls();
    }

    async addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null> {
        return this.pollRepository.addVote(pollId, optionId, userId);
    }

    async createPoll(question: string, options: string[]): Promise<Poll> {
        if (!question || options.length < 2) {
            throw new Error('Poll must have a question and at least 2 options.');
        }
        return await this.pollRepository.createPoll(question, options);
    }

    async updatePoll(pollId: string, question: string, options: string[]): Promise<Poll | null> {
        if (!question || options.length < 2) {
            throw new Error('Poll must have a question and at least 2 options.');
        }
        return await this.pollRepository.updatePoll(pollId, question, options);
    }

    async deletePoll(pollId: string): Promise<boolean> {
        return await this.pollRepository.deletePoll(pollId);
    }
}

