import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { IPollService } from '../services/interfaces/IPollService';
import { IChatService } from '../services/interfaces/IChatService';
import { IUserService } from '../services/interfaces/IUserService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export class SocketHandler {
    constructor(
        private io: Server,
        private pollService: IPollService,
        private chatService: IChatService,
        private userService: IUserService
    ) {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.io.on('connection', async (socket: Socket) => {
            console.log('User connected:', socket.id);

            // Send initial data (polls and chat history)
            try {
                const polls = await this.pollService.getAllPolls();
                const chatHistory = await this.chatService.getChatHistory();
                socket.emit('initialData', { polls, chatHistory });
            } catch (error) {
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
                            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
                            userId = decoded.id;
                        } catch (e: any) {
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
                    } else {
                        console.error(`[VOTE] addVote returned null`);
                    }
                } catch (error: any) {
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
                            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
                            userId = decoded.id;
                        } catch (e: any) {
                            console.error('JWT verification failed in socket for createPoll:', e.message);
                        }
                    }

                    if (!userId) {
                        console.error('[CREATE_POLL] Unauthorized: no userId');
                        throw new Error('Unauthorized to create poll');
                    }

                    // Admin verification
                    const userObj = await this.userService.getUserById(userId);
                    if (!userObj || userObj.email !== 'admin@gmail.com') {
                        console.error(`[CREATE_POLL] Unauthorized: user is not admin (email=${userObj?.email})`);
                        throw new Error('Unauthorized: Only administrators can create polls.');
                    }

                    const newPoll = await this.pollService.createPoll(question, options);
                    console.log(`[CREATE_POLL] Success, emitting newPollCreated`);
                    this.io.emit('newPollCreated', newPoll);
                } catch (error: any) {
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
                } catch (error: any) {
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
