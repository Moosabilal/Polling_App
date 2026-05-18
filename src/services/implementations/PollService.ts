import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.js';
import { IPollService } from '../interfaces/IPollService.js';
import { IPollRepository } from '../../repositories/interfaces/IPollRepository.js';
import { DetailedPollResult, Poll } from '../../types/index.js';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '../../utils/constants.js';
import { CustomError } from '../../utils/CustomError.js';
import { IUserService } from '../interfaces/IUserService.js';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class PollService implements IPollService {
    constructor(
        @inject(TYPES.IPollRepository) private pollRepository: IPollRepository,
        @inject(TYPES.IUserService) private userService: IUserService
    ) { }

    async getPollsPaginated(page: number, limit: number): Promise<{ polls: Poll[], totalCount: number }> {
        return await this.pollRepository.getPollsPaginated(page, limit);
    }

    async addVote(pollId: string, optionId: string, userId: string): Promise<Poll | null> {
        const poll = await this.pollRepository.findById(pollId);
        if (!poll) return null;

        let voters = poll.userVotes || [];
        
        // Handle legacy polls
        if (voters.length > 0 && !voters[0].optionId) {
            voters = [];
            poll.options.forEach(opt => opt.votes = 0);
        }

        const existingVoteIndex = voters.findIndex(v => v.userId === userId || v.userId.toString() === userId);
        let shouldAddVote = true;

        if (existingVoteIndex !== -1) {
            const existingVote = voters[existingVoteIndex];
            const previousOptionId = existingVote.optionId;

            voters.splice(existingVoteIndex, 1);

            if (previousOptionId) {
                const prevOption = poll.options.find(opt => opt.id === previousOptionId);
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
                voters.push({ userId, optionId });
            }
        }

        return await this.pollRepository.updatePollData(pollId, poll.question, poll.options, voters);
    }

    async createPoll(question: string, options: string[], creatorId: string): Promise<Poll> {
        if (!question || options.length < 2) {
            throw new CustomError(RESPONSE_MESSAGES.INVALID_POLL_OPTIONS, HTTP_STATUS.BAD_REQUEST);
        }

        const pollOptions = options.map(text => ({
            id: uuidv4(),
            text,
            votes: 0
        }));

        return await this.pollRepository.createPoll({ question, options: pollOptions, creatorId, votedUserIds: [], userVotes: [] });
    }

    async updatePoll(pollId: string, creatorId: string, question: string, options: string[]): Promise<Poll | null> {
        if (!question || options.length < 2) {
            throw new CustomError(RESPONSE_MESSAGES.INVALID_POLL_OPTIONS, HTTP_STATUS.BAD_REQUEST);
        }

        const poll = await this.pollRepository.findById(pollId);
        if(!poll) throw new CustomError(RESPONSE_MESSAGES.POLL_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
        if (poll.creatorId !== creatorId) throw new CustomError(RESPONSE_MESSAGES.NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);

        const newOptions = options.map((text, i) => ({
            id: poll.options[i]?.id || uuidv4(),
            text,
            votes: 0
        }));

        return await this.pollRepository.updatePollData(pollId, question, newOptions, []);
    }

    async deletePoll(pollId: string, creatorId: string): Promise<boolean> {
        const deleted = await this.pollRepository.deletePoll(pollId, creatorId);
        if (!deleted) throw new CustomError(RESPONSE_MESSAGES.NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
        return deleted;
    }

    async getPollResults(pollId: string): Promise<DetailedPollResult | null> {
        const poll = await this.pollRepository.findById(pollId);
        if (!poll) throw new CustomError(RESPONSE_MESSAGES.POLL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

        const voters = poll.userVotes || [];
        const userIds = voters.map(v => v.userId);
        const uniqueUserIds = [...new Set(userIds)];
        
        const users = await this.userService.getUsersByIds(uniqueUserIds);
        const usersMap = new Map();
        users.forEach(u => usersMap.set(u.id, u));

        const detailedOptions = poll.options.map(opt => {
            const optionVoters = voters.filter(v => v.optionId === opt.id);
            const votersDetails = optionVoters.map(v => {
                const userDetail = usersMap.get(v.userId);
                if (userDetail) {
                    return {
                        id: userDetail.id,
                        name: userDetail.name,
                        avatarUrl: userDetail.avatarUrl
                    };
                }
                return { id: v.userId, name: 'Unknown User', avatarUrl: '' };
            });

            return {
                id: opt.id,
                text: opt.text,
                votes: opt.votes,
                voters: votersDetails
            };
        });

        return {
            id: poll.id,
            question: poll.question,
            options: detailedOptions
        };
    }
}

