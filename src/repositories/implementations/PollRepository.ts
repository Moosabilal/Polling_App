import { injectable } from 'inversify';
import { IPollRepository } from '../interfaces/IPollRepository';
import { Poll } from '../../types';
import { PollModel } from '../../models/Poll';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class PollRepository implements IPollRepository {
    async getPoll(id: string): Promise<Poll | null> {
        const poll = await PollModel.findById(id);
        if (!poll) return null;
        return this.mapToType(poll);
    }

    async getAllPolls(): Promise<Poll[]> {
        // Initialize default poll if no polls exist
        const count = await PollModel.countDocuments();
        if (count === 0) {
            await this.createPoll('What is your favorite programming language?', ['JavaScript', 'Python', 'Java', 'C#']);
        }

        const polls = await PollModel.find();
        return polls.map(p => this.mapToType(p));
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
        return this.mapToType(poll);
    }

    async createPoll(question: string, optionTexts: string[]): Promise<Poll> {
        const options = optionTexts.map(text => ({
            id: uuidv4(),
            text,
            votes: 0
        }));

        const newPoll = new PollModel({ question, options });
        await newPoll.save();
        return this.mapToType(newPoll);
    }

    private mapToType(pollDoc: any): Poll {
        return {
            id: pollDoc._id.toString(),
            question: pollDoc.question,
            options: pollDoc.options.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes
            })),
            votedUserIds: pollDoc.voters.map((v: any) => v.userId ? v.userId.toString() : v.toString()),
            userVotes: pollDoc.voters.map((v: any) => ({
                userId: v.userId ? v.userId.toString() : v.toString(),
                optionId: v.optionId
            }))
        };
    }
}
