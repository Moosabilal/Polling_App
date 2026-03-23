"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const inversify_1 = require("inversify");
const ChatMessage_1 = require("../../models/ChatMessage");
let ChatRepository = class ChatRepository {
    async saveMessage(userId, name, text) {
        const message = new ChatMessage_1.ChatMessageModel({ userId, name, text });
        await message.save();
        return {
            id: message._id.toString(),
            userId: message.userId,
            name: message.name,
            text: message.text,
            timestamp: message.createdAt
        };
    }
    async getRecentMessages(limit = 50) {
        const messages = await ChatMessage_1.ChatMessageModel.find()
            .sort({ createdAt: -1 })
            .limit(limit);
        // Reverse so they are in chronological order
        return messages.reverse().map(msg => ({
            id: msg._id.toString(),
            userId: msg.userId,
            name: msg.name,
            text: msg.text,
            timestamp: msg.createdAt
        }));
    }
};
exports.ChatRepository = ChatRepository;
exports.ChatRepository = ChatRepository = __decorate([
    (0, inversify_1.injectable)()
], ChatRepository);
