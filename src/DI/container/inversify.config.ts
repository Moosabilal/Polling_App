import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../types';

// Repositories
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { UserRepository } from '../../repositories/implementations/UserRepository';
import { IPollRepository } from '../../repositories/interfaces/IPollRepository';
import { PollRepository } from '../../repositories/implementations/PollRepository';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository';
import { ChatRepository } from '../../repositories/implementations/ChatRepository';

// Services
import { IUserService } from '../../services/interfaces/IUserService';
import { UserService } from '../../services/implementations/UserService';
import { IPollService } from '../../services/interfaces/IPollService';
import { PollService } from '../../services/implementations/PollService';
import { IChatService } from '../../services/interfaces/IChatService';
import { ChatService } from '../../services/implementations/ChatService';

// Controllers
import { AuthController } from '../../controllers/implementations/AuthController';
import { PollController } from '../../controllers/implementations/PollController';

const container = new Container();

// Bind Repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository).inSingletonScope();
container.bind<IPollRepository>(TYPES.IPollRepository).to(PollRepository).inSingletonScope();
container.bind<IChatRepository>(TYPES.IChatRepository).to(ChatRepository).inSingletonScope();

// Bind Services
container.bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();
container.bind<IPollService>(TYPES.IPollService).to(PollService).inSingletonScope();
container.bind<IChatService>(TYPES.IChatService).to(ChatService).inSingletonScope();

// Bind Controllers
container.bind<AuthController>(TYPES.AuthController).to(AuthController).inSingletonScope();
container.bind<PollController>(TYPES.PollController).to(PollController).inSingletonScope();

export { container };
