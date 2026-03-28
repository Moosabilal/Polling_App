import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { verifyToken } from '../utils/jwt.js';
import { container } from '../DI/container/inversify.config.js';
import { TYPES } from '../DI/types/index.js';
import { IPollService } from '../services/interfaces/IPollService.js';
import { IChatService } from '../services/interfaces/IChatService.js';
import { IUserService } from '../services/interfaces/IUserService.js';

export class SocketHandler {
    private pollService: IPollService;
    private chatService: IChatService;
    private userService: IUserService;

    constructor(private io: Server) {
        this.pollService = container.get<IPollService>(TYPES.IPollService);
        this.chatService = container.get<IChatService>(TYPES.IChatService);
        this.userService = container.get<IUserService>(TYPES.IUserService);
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.io.on('connection', async (socket: Socket) => {

            try {
                const chatHistory = await this.chatService.getChatHistory();
                socket.emit('initialData', { chatHistory });
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }

            socket.on('vote', async ({ pollId, optionId, userId: clientUserId }) => {
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    const token = cookies.token;

                    if (token) {
                        try {
                            const decoded = verifyToken<{ id: string }>(token);
                            userId = decoded.id;
                        } catch (e: unknown) {
                            console.error('JWT verification failed in socket:', (e as Error).message);
                        }
                    }

                    if (!userId) {
                        console.error('[VOTE] Unauthorized: no userId');
                        throw new Error('Unauthorized');
                    }

                    const updatedPoll = await this.pollService.addVote(pollId, optionId, userId);
                    if (updatedPoll) {
                        this.io.emit('pollUpdated', updatedPoll);
                    } else {
                        console.error(`[VOTE] addVote returned null`);
                    }
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        console.error('[VOTE] Error:', error.message);
                        socket.emit('error', { message: error.message });
                    } else {
                        console.error('[VOTE] Unknown error:', error);
                        socket.emit('error', { message: 'An unknown error occurred' });
                    }
                }
            });

            socket.on('sendMessage', async ({ userId, name, text, filePublicId, fileResourceType, fileName, fileType }) => {
                try {
                    const userObj = await this.userService.getUserById(userId);
                    const avatarPublicId = userObj?.avatarPublicId;
                    const message = await this.chatService.addMessage(userId, name, text, avatarPublicId, filePublicId, fileResourceType, fileName, fileType);
                    this.io.emit('newMessage', message);
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        console.error('sendMessage error:', error.message);
                        socket.emit('error', { message: error.message });
                    } else {
                        console.error('sendMessage unknown error:', error);
                        socket.emit('error', { message: 'An unknown error occurred' });
                    }
                }
            });

            socket.on('editMessage', async ({ msgId, userId: clientUserId, newText }) => {
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    if (cookies.token) {
                        try {
                            const decoded = verifyToken<{ id: string }>(cookies.token);
                            userId = decoded.id;
                        } catch (e: unknown) { }
                    }
                    if (!userId) throw new Error('Unauthorized');

                    const updatedMessage = await this.chatService.updateMessage(msgId, userId, newText);
                    if (updatedMessage) {
                        this.io.emit('messageEdited', updatedMessage);
                    }
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        socket.emit('error', { message: error.message });
                    } else {
                        socket.emit('error', { message: 'An unknown error occurred' });
                    }
                }
            });

            socket.on('deleteMessage', async ({ msgId, userId: clientUserId }) => {
                try {
                    let userId = clientUserId;
                    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                    if (cookies.token) {
                        try {
                            const decoded = verifyToken<{ id: string }>(cookies.token);
                            userId = decoded.id;
                        } catch (e: unknown) { }
                    }
                    if (!userId) throw new Error('Unauthorized');

                    const success = await this.chatService.deleteMessage(msgId, userId);
                    if (success) {
                        this.io.emit('messageDeleted', { msgId });
                    }
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        socket.emit('error', { message: error.message });
                    } else {
                        socket.emit('error', { message: 'An unknown error occurred' });
                    }
                }
            });

            socket.on('typing', ({ name }) => {
                socket.broadcast.emit('userTyping', { name });
            });

            socket.on('stopTyping', ({ name }) => {
                socket.broadcast.emit('userStoppedTyping', { name });
            });

            socket.on('disconnect', () => {
            });
        });
    }
}
