import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../types/index.js';

import { IUserRepository } from '../../repositories/interfaces/IUserRepository.js';
import { UserRepository } from '../../repositories/implementations/UserRepository.js';
import { IPollRepository } from '../../repositories/interfaces/IPollRepository.js';
import { PollRepository } from '../../repositories/implementations/PollRepository.js';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository.js';
import { ChatRepository } from '../../repositories/implementations/ChatRepository.js';

import { IUserService } from '../../services/interfaces/IUserService.js';
import { UserService } from '../../services/implementations/UserService.js';
import { IPollService } from '../../services/interfaces/IPollService.js';
import { PollService } from '../../services/implementations/PollService.js';
import { IChatService } from '../../services/interfaces/IChatService.js';
import { ChatService } from '../../services/implementations/ChatService.js';

import { AuthController } from '../../controllers/implementations/AuthController.js';
import { PollController } from '../../controllers/implementations/PollController.js';

import { Server as SocketIOServer } from 'socket.io';

const container = new Container();

container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository).inSingletonScope();
container.bind<IPollRepository>(TYPES.IPollRepository).to(PollRepository).inSingletonScope();
container.bind<IChatRepository>(TYPES.IChatRepository).to(ChatRepository).inSingletonScope();

container.bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();
container.bind<IPollService>(TYPES.IPollService).to(PollService).inSingletonScope();
container.bind<IChatService>(TYPES.IChatService).to(ChatService).inSingletonScope();

container.bind<AuthController>(TYPES.AuthController).to(AuthController).inSingletonScope();
container.bind<PollController>(TYPES.PollController).to(PollController).inSingletonScope();

export const bindSocketServer = (io: SocketIOServer) => {
    container.bind<SocketIOServer>(TYPES.SocketServer).toConstantValue(io);
};

export { container };
