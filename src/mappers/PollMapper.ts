import { Poll } from '../types/index.ts';
import { Document } from 'mongoose';
import { IPollModel, IPollOption, IPollVoter } from '../models/Poll.ts';

export interface PollDTO {
    id: string;
    question: string;
    creatorId: string;
    options: { id: string; text: string; votes: number }[];
    votedUserIds: string[];
    userVotes: { userId: string; optionId: string }[];
}

export class PollMapper {
    static toDomain(pollDoc: Document & IPollModel): Poll {
        return {
            id: pollDoc._id.toString(),
            question: pollDoc.question,
            creatorId: pollDoc.creatorId,
            options: pollDoc.options.map((opt: IPollOption) => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes
            })),
            votedUserIds: pollDoc.voters ? pollDoc.voters.map((v: IPollVoter) => v.userId ? v.userId.toString() : v.toString()) : [],
            userVotes: pollDoc.voters ? pollDoc.voters.map((v: IPollVoter) => ({
                userId: v.userId ? v.userId.toString() : v.toString(),
                optionId: v.optionId
            })) : []
        };
    }

    /** Only send frontend-needed fields. Keeps full userVotes for UI voting state. */
    static toDTO(poll: Poll): PollDTO {
        return {
            id: poll.id,
            question: poll.question,
            creatorId: poll.creatorId,
            options: poll.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes
            })),
            votedUserIds: poll.votedUserIds,
            userVotes: poll.userVotes ?? []
        };
    }
}
