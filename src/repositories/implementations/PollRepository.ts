import { injectable } from 'inversify';
import { IPollRepository } from '../interfaces/IPollRepository.js';
import { Poll } from '../../types/index.js';
import { IPollOption, IPollVoter, PollModel } from '../../models/Poll.js';
import { v4 as uuidv4 } from 'uuid';
import { PollMapper } from '../../mappers/PollMapper.js';

@injectable()
export class PollRepository implements IPollRepository {

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

    async addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null> {
        const poll = await PollModel.findById(pollId);
        if (!poll) return null;

        if (poll.voters.length > 0 && !poll.voters[0].optionId) {
            poll.voters = [];
            poll.options.forEach(opt => opt.votes = 0);
        }

        const existingVoteIndex = poll.voters.findIndex((v: IPollVoter) => v.userId === userId || v.toString() === userId);

        let shouldAddVote = true;

        if (existingVoteIndex !== -1) {
            const existingVote = poll.voters[existingVoteIndex];
            const previousOptionId = existingVote.optionId;

            poll.voters.splice(existingVoteIndex, 1);

            if (previousOptionId) {
                const prevOption = poll.options.find((opt: IPollOption) => opt.id === previousOptionId);
                if (prevOption) prevOption.votes = Math.max(0, prevOption.votes - 1);
            }

            if (previousOptionId === optionId) {
                shouldAddVote = false;
            }
        }

        if (shouldAddVote) {
            const option = poll.options.find(opt => opt.id === optionId);
            if (option) {
                option.votes += 1;
                poll.voters.push({ userId, optionId });
            }
        }

        await poll.save();
        return PollMapper.toDomain(poll);
    }

    async createPoll(question: string, optionTexts: string[]): Promise<Poll> {
        const options = optionTexts.map(text => ({
            id: uuidv4(),
            text,
            votes: 0
        }));

        const newPoll = new PollModel({ question, options });
        await newPoll.save();
        return PollMapper.toDomain(newPoll);
    }

    async updatePoll(pollId: string, question: string, optionTexts: string[]): Promise<Poll | null> {
        const poll = await PollModel.findById(pollId);
        if (!poll) return null;

        poll.question = question;
        // Rebuild options preserving IDs where possible for voters continuity
        const newOptions = optionTexts.map((text, i) => ({
            id: (poll.options[i] as { id: string })?.id || uuidv4(),
            text,
            votes: 0
        }));
        poll.options = newOptions;
        // Reset all votes since options may have changed
        poll.voters = [];

        await poll.save();
        return PollMapper.toDomain(poll);
    }

    async deletePoll(pollId: string): Promise<boolean> {
        const result = await PollModel.findByIdAndDelete(pollId);
        return result !== null;
    }
}

