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
exports.PollController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../DI/types");
let PollController = class PollController {
    constructor(pollService) {
        this.pollService = pollService;
        this.getPolls = async (req, res) => {
            try {
                const polls = await this.pollService.getAllPolls();
                res.status(200).json({ success: true, polls });
            }
            catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        };
        this.createPoll = async (req, res) => {
            try {
                const { question, options } = req.body;
                const newPoll = await this.pollService.createPoll(question, options);
                res.status(201).json({ success: true, poll: newPoll });
            }
            catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        };
    }
};
exports.PollController = PollController;
exports.PollController = PollController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.IPollService)),
    __metadata("design:paramtypes", [Object])
], PollController);
