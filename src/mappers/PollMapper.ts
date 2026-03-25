import { Poll } from '../types';

export class PollMapper {
    static toDomain(pollDoc: any): Poll {
        return {
            id: pollDoc._id.toString(),
            question: pollDoc.question,
            options: pollDoc.options.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes
            })),
            votedUserIds: pollDoc.voters ? pollDoc.voters.map((v: any) => v.userId ? v.userId.toString() : v.toString()) : [],
            userVotes: pollDoc.voters ? pollDoc.voters.map((v: any) => ({
                userId: v.userId ? v.userId.toString() : v.toString(),
                optionId: v.optionId
            })) : []
        };
    }
}
