import { injectable } from 'inversify';
import { IPollRepository } from '../interfaces/IPollRepository';
import { Poll } from '../../types';
import { PollModel } from '../../models/Poll';
import { v4 as uuidv4 } from 'uuid';
import { PollMapper } from '../../mappers/PollMapper';

@injectable()
export class PollRepository implements IPollRepository {
    async getPoll(id: string): Promise<Poll | null> {
        const poll = await PollModel.findById(id);
        if (!poll) return null;
        return PollMapper.toDomain(poll);
    }

    async getAllPolls(): Promise<Poll[]> {

        const polls = await PollModel.find();
        return polls.map(p => PollMapper.toDomain(p));
    }

    async addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null> {
        const poll = await PollModel.findById(pollId);
        if (!poll) return null;

        // Clean up legacy string voters that break schema validation
        if (poll.voters.length > 0 && !poll.voters[0].optionId) {
            poll.voters = [];
            poll.options.forEach(opt => opt.votes = 0); // Reset votes for consistency
        }

        const existingVoteIndex = poll.voters.findIndex((v: any) => v.userId === userId || v.toString() === userId);

        let shouldAddVote = true;

        if (existingVoteIndex !== -1) {
            const existingVote = poll.voters[existingVoteIndex] as any;
            const previousOptionId = existingVote.optionId;

            // Remove the old vote
            poll.voters.splice(existingVoteIndex, 1);

            // Decrement the old option's vote count
            if (previousOptionId) {
                const prevOption = poll.options.find(opt => opt.id === previousOptionId);
                if (prevOption) prevOption.votes = Math.max(0, prevOption.votes - 1);
            }

            // If the user clicked the SAME option they had already voted for, it's a toggle OFF
            if (previousOptionId === optionId) {
                shouldAddVote = false;
            }
        }

        if (shouldAddVote) {
            const option = poll.options.find(opt => opt.id === optionId);
            if (option) {
                option.votes += 1;
                poll.voters.push({ userId, optionId } as any);
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
            id: (poll.options[i] as any)?.id || uuidv4(),
            text,
            votes: 0
        }));
        poll.options = newOptions as any;
        // Reset all votes since options may have changed
        poll.voters = [] as any;

        await poll.save();
        return PollMapper.toDomain(poll);
    }

    async deletePoll(pollId: string): Promise<boolean> {
        const result = await PollModel.findByIdAndDelete(pollId);
        return result !== null;
    }
}

