"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie = __importStar(require("cookie"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
class SocketHandler {
    constructor(io, pollService, chatService) {
        this.io = io;
        this.pollService = pollService;
        this.chatService = chatService;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.io.on('connection', async (socket) => {
            console.log('User connected:', socket.id);
            // Send initial data (polls and chat history)
            try {
                const polls = await this.pollService.getAllPolls();
                const chatHistory = await this.chatService.getChatHistory();
                socket.emit('initialData', { polls, chatHistory });
            }
            catch (error) {
                console.error('Error fetching initial data:', error);
            }
            // Handle voting
            socket.on('vote', async ({ pollId, optionId, userId: clientUserId }) => {
                console.log(`[VOTE] received: pollId=${pollId}, optionId=${optionId}, clientUserId=${clientUserId}`);
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    const token = cookies.token;
                    if (token) {
                        try {
                            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                            userId = decoded.id;
                        }
                        catch (e) {
                            console.error('JWT verification failed in socket:', e.message);
                        }
                    }
                    if (!userId) {
                        console.error('[VOTE] Unauthorized: no userId');
                        throw new Error('Unauthorized');
                    }
                    console.log(`[VOTE] Processing for userId=${userId}`);
                    const updatedPoll = await this.pollService.addVote(pollId, optionId, userId);
                    if (updatedPoll) {
                        console.log(`[VOTE] Success, emitting pollUpdated`);
                        this.io.emit('pollUpdated', updatedPoll);
                    }
                    else {
                        console.error(`[VOTE] addVote returned null`);
                    }
                }
                catch (error) {
                    console.error('[VOTE] Error:', error.message);
                    socket.emit('error', { message: error.message });
                }
            });
            // Handle poll creation
            socket.on('createPoll', async ({ question, options, userId: clientUserId }) => {
                console.log(`[CREATE_POLL] received from clientUserId=${clientUserId}`);
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    const token = cookies.token;
                    if (token) {
                        try {
                            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                            userId = decoded.id;
                        }
                        catch (e) {
                            console.error('JWT verification failed in socket for createPoll:', e.message);
                        }
                    }
                    if (!userId) {
                        console.error('[CREATE_POLL] Unauthorized: no userId');
                        throw new Error('Unauthorized to create poll');
                    }
                    const newPoll = await this.pollService.createPoll(question, options);
                    console.log(`[CREATE_POLL] Success, emitting newPollCreated`);
                    this.io.emit('newPollCreated', newPoll);
                }
                catch (error) {
                    console.error('[CREATE_POLL] Error:', error.message);
                    socket.emit('error', { message: error.message });
                }
            });
            // Chat messages
            socket.on('sendMessage', async ({ userId, name, text }) => {
                console.log(`sendMessage received: userId=${userId}, name=${name}, text=${text}`);
                try {
                    const message = await this.chatService.addMessage(userId, name, text);
                    this.io.emit('newMessage', message);
                }
                catch (error) {
                    console.error('sendMessage error:', error);
                    socket.emit('error', { message: error.message });
                }
            });
            // Typing indicators
            socket.on('typing', ({ name }) => {
                socket.broadcast.emit('userTyping', { name });
            });
            socket.on('stopTyping', ({ name }) => {
                socket.broadcast.emit('userStoppedTyping', { name });
            });
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    }
}
exports.SocketHandler = SocketHandler;
