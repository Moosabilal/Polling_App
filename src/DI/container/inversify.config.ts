import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../types/index.ts';

import { IUserRepository } from '../../repositories/interfaces/IUserRepository.ts';
import { UserRepository } from '../../repositories/implementations/UserRepository.ts';
import { IPollRepository } from '../../repositories/interfaces/IPollRepository.ts';
import { PollRepository } from '../../repositories/implementations/PollRepository.ts';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository.ts';
import { ChatRepository } from '../../repositories/implementations/ChatRepository.ts';

import { IUserService } from '../../services/interfaces/IUserService.ts';
import { UserService } from '../../services/implementations/UserService.ts';
import { IPollService } from '../../services/interfaces/IPollService.ts';
import { PollService } from '../../services/implementations/PollService.ts';
import { IChatService } from '../../services/interfaces/IChatService.ts';
import { ChatService } from '../../services/implementations/ChatService.ts';

import { AuthController } from '../../controllers/implementations/AuthController.ts';
import { PollController } from '../../controllers/implementations/PollController.ts';

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
