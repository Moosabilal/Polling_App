import { Poll } from '../types';
import { Document } from 'mongoose';
import { IPollModel, IPollOption, IPollVoter } from '../models/Poll';

export class PollMapper {
    static toDomain(pollDoc: Document & IPollModel): Poll {
        return {
            id: pollDoc._id.toString(),
            question: pollDoc.question,
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
}
