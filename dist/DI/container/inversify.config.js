"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("../types");
const UserRepository_1 = require("../../repositories/implementations/UserRepository");
const PollRepository_1 = require("../../repositories/implementations/PollRepository");
const ChatRepository_1 = require("../../repositories/implementations/ChatRepository");
const UserService_1 = require("../../services/implementations/UserService");
const PollService_1 = require("../../services/implementations/PollService");
const ChatService_1 = require("../../services/implementations/ChatService");
// Controllers
const AuthController_1 = require("../../controllers/implementations/AuthController");
const PollController_1 = require("../../controllers/implementations/PollController");
const container = new inversify_1.Container();
exports.container = container;
// Bind Repositories
container.bind(types_1.TYPES.IUserRepository).to(UserRepository_1.UserRepository).inSingletonScope();
container.bind(types_1.TYPES.IPollRepository).to(PollRepository_1.PollRepository).inSingletonScope();
container.bind(types_1.TYPES.IChatRepository).to(ChatRepository_1.ChatRepository).inSingletonScope();
// Bind Services
container.bind(types_1.TYPES.IUserService).to(UserService_1.UserService).inSingletonScope();
container.bind(types_1.TYPES.IPollService).to(PollService_1.PollService).inSingletonScope();
container.bind(types_1.TYPES.IChatService).to(ChatService_1.ChatService).inSingletonScope();
// Bind Controllers
container.bind(types_1.TYPES.AuthController).to(AuthController_1.AuthController).inSingletonScope();
container.bind(types_1.TYPES.PollController).to(PollController_1.PollController).inSingletonScope();
