import { injectable } from 'inversify';
import { IPollRepository } from '../interfaces/IPollRepository.js';
import { DetailedPollResult, Poll } from '../../types/index.js';
import { IPollOption, IPollVoter, PollModel } from '../../models/Poll.js';
import { v4 as uuidv4 } from 'uuid';
import { PollMapper } from '../../mappers/PollMapper.js';
import { UserModel } from '../../models/User.js';
import { UserMapper } from '../../mappers/UserMapper.js';

@injectable()
export class PollRepository implements IPollRepository {

    async findById(pollId: string): Promise<Poll | null> {
        const poll = await PollModel.findById(pollId);
        if (!poll) return null;
        return PollMapper.toDomain(poll);
    }

    async getPollsPaginated(page: number, limit: number): Promise<{ polls: Poll[], totalCount: number }> {
        const skip = (page - 1) * limit;
        const [totalCount, pollDocs] = await Promise.all([
            PollModel.countDocuments(),
            PollModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec()
        ]);
        return {
            polls: pollDocs.map(p => PollMapper.toDomain(p)),
            totalCount
        };
    }

    async createPoll(pollData: Omit<Poll, 'id'>): Promise<Poll> {
        const newPoll = new PollModel(pollData);
        await newPoll.save();
        return PollMapper.toDomain(newPoll);
    }

    async updatePollData(pollId: string, question: string, options: {id: string, text: string, votes: number}[], voters: {userId: string, optionId: string}[]): Promise<Poll | null> {
        const poll = await PollModel.findById(pollId);
        if (!poll) return null;

        poll.question = question;
        poll.options = options;
        poll.voters = voters;

        await poll.save();
        return PollMapper.toDomain(poll);
    }

    async deletePoll(pollId: string, creatorId: string): Promise<boolean> {
        const result = await PollModel.findOneAndDelete({ _id: pollId, creatorId });
        return result !== null;
    }
}

