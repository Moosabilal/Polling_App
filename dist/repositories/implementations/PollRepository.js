"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollRepository = void 0;
const inversify_1 = require("inversify");
const Poll_1 = require("../../models/Poll");
const uuid_1 = require("uuid");
let PollRepository = class PollRepository {
    async getPoll(id) {
        const poll = await Poll_1.PollModel.findById(id);
        if (!poll)
            return null;
        return this.mapToType(poll);
    }
    async getAllPolls() {
        // Initialize default poll if no polls exist
        const count = await Poll_1.PollModel.countDocuments();
        if (count === 0) {
            await this.createPoll('What is your favorite programming language?', ['JavaScript', 'Python', 'Java', 'C#']);
        }
        const polls = await Poll_1.PollModel.find();
        return polls.map(p => this.mapToType(p));
    }
    async addVote(pollId, optionId, userId) {
        const poll = await Poll_1.PollModel.findById(pollId);
        if (!poll)
            return null;
        // Clean up legacy string voters that break schema validation
        if (poll.voters.length > 0 && !poll.voters[0].optionId) {
            poll.voters = [];
            poll.options.forEach(opt => opt.votes = 0); // Reset votes for consistency
        }
        const existingVoteIndex = poll.voters.findIndex((v) => v.userId === userId || v.toString() === userId);
        let shouldAddVote = true;
        if (existingVoteIndex !== -1) {
            const existingVote = poll.voters[existingVoteIndex];
            const previousOptionId = existingVote.optionId;
            // Remove the old vote
            poll.voters.splice(existingVoteIndex, 1);
            // Decrement the old option's vote count
            if (previousOptionId) {
                const prevOption = poll.options.find(opt => opt.id === previousOptionId);
                if (prevOption)
                    prevOption.votes = Math.max(0, prevOption.votes - 1);
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
                poll.voters.push({ userId, optionId });
            }
        }
        await poll.save();
        return this.mapToType(poll);
    }
    async createPoll(question, optionTexts) {
        const options = optionTexts.map(text => ({
            id: (0, uuid_1.v4)(),
            text,
            votes: 0
        }));
        const newPoll = new Poll_1.PollModel({ question, options });
        await newPoll.save();
        return this.mapToType(newPoll);
    }
    mapToType(pollDoc) {
        return {
            id: pollDoc._id.toString(),
            question: pollDoc.question,
            options: pollDoc.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes
            })),
            votedUserIds: pollDoc.voters.map((v) => v.userId ? v.userId.toString() : v.toString()),
            userVotes: pollDoc.voters.map((v) => ({
                userId: v.userId ? v.userId.toString() : v.toString(),
                optionId: v.optionId
            }))
        };
    }
};
exports.PollRepository = PollRepository;
exports.PollRepository = PollRepository = __decorate([
    (0, inversify_1.injectable)()
], PollRepository);
