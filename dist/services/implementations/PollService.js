"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../DI/types");
let PollService = class PollService {
    constructor(pollRepository) {
        this.pollRepository = pollRepository;
    }
    async getPollById(id) {
        return await this.pollRepository.getPoll(id);
    }
    async getAllPolls() {
        return await this.pollRepository.getAllPolls();
    }
    async addVote(pollId, optionId, userId) {
        return this.pollRepository.addVote(pollId, optionId, userId);
    }
    async createPoll(question, options) {
        if (!question || options.length < 2) {
            throw new Error('Poll must have a question and at least 2 options.');
        }
        return await this.pollRepository.createPoll(question, options);
    }
};
exports.PollService = PollService;
exports.PollService = PollService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.IPollRepository)),
    __metadata("design:paramtypes", [Object])
], PollService);
