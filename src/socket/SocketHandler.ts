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

            // Handle poll editing (admin only)
            socket.on('editPoll', async ({ pollId, question, options, userId: clientUserId }) => {
                console.log(`[EDIT_POLL] received from clientUserId=${clientUserId}`);
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    const token = cookies.token;
                    if (token) {
                        try {
                            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
                            userId = decoded.id;
                        } catch (e: any) { }
                    }
                    if (!userId) throw new Error('Unauthorized');

                    const userObj = await this.userService.getUserById(userId);
                    if (!userObj || userObj.email !== 'admin@gmail.com') {
                        throw new Error('Unauthorized: Only administrators can edit polls.');
                    }

                    const updatedPoll = await this.pollService.updatePoll(pollId, question, options);
                    if (updatedPoll) {
                        console.log(`[EDIT_POLL] Success, emitting pollUpdated`);
                        this.io.emit('pollUpdated', updatedPoll);
                    }
                } catch (error: any) {
                    console.error('[EDIT_POLL] Error:', error.message);
                    socket.emit('error', { message: error.message });
                }
            });

            // Handle poll deletion (admin only)
            socket.on('deletePoll', async ({ pollId, userId: clientUserId }) => {
                console.log(`[DELETE_POLL] received from clientUserId=${clientUserId}`);
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    const token = cookies.token;
                    if (token) {
                        try {
                            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
                            userId = decoded.id;
                        } catch (e: any) { }
                    }
                    if (!userId) throw new Error('Unauthorized');

                    const userObj = await this.userService.getUserById(userId);
                    if (!userObj || userObj.email !== 'admin@gmail.com') {
                        throw new Error('Unauthorized: Only administrators can delete polls.');
                    }

                    const success = await this.pollService.deletePoll(pollId);
                    if (success) {
                        console.log(`[DELETE_POLL] Success, emitting pollDeleted`);
                        this.io.emit('pollDeleted', { pollId });
                    }
                } catch (error: any) {
                    console.error('[DELETE_POLL] Error:', error.message);
                    socket.emit('error', { message: error.message });
                }
            });

            // Chat messages
            socket.on('sendMessage', async ({ userId, name, text, filePublicId, fileResourceType, fileName, fileType }) => {
                console.log(`sendMessage received: userId=${userId}, name=${name}, text=${text}`);
                try {
                    const userObj = await this.userService.getUserById(userId);
                    const avatarPublicId = userObj?.avatarPublicId;
                    const message = await this.chatService.addMessage(userId, name, text, avatarPublicId, filePublicId, fileResourceType, fileName, fileType);
                    this.io.emit('newMessage', message);
                } catch (error: any) {
                    console.error('sendMessage error:', error);
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('editMessage', async ({ msgId, userId: clientUserId, newText }) => {
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    if (cookies.token) {
                        try {
                            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET || 'supersecretkey') as { id: string };
                            userId = decoded.id;
                        } catch (e: any) { }
                    }
                    if (!userId) throw new Error('Unauthorized');

                    const updatedMessage = await this.chatService.updateMessage(msgId, userId, newText);
                    if (updatedMessage) {
                        this.io.emit('messageEdited', updatedMessage);
                    }
                } catch (error: any) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('deleteMessage', async ({ msgId, userId: clientUserId }) => {
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    if (cookies.token) {
                        try {
                            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET || 'supersecretkey') as { id: string };
                            userId = decoded.id;
                        } catch (e: any) { }
                    }
                    if (!userId) throw new Error('Unauthorized');

                    const success = await this.chatService.deleteMessage(msgId, userId);
                    if (success) {
                        this.io.emit('messageDeleted', { msgId });
                    }
                } catch (error: any) {
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
