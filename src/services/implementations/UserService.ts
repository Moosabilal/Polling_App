import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.js';
import { IUserService } from '../interfaces/IUserService.js';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository.js';
import { User } from '../../types/index.js';
import bcrypt from 'bcryptjs';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '../../utils/constants.js';
import { CustomError } from '../../utils/CustomError.js';

@injectable()
export class UserService implements IUserService {
    constructor(@inject(TYPES.IUserRepository) private userRepository: IUserRepository) { }

    async register(name: string, email: string, password: string): Promise<User> {
        if (!name || !email || !password) throw new CustomError(RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED, HTTP_STATUS.BAD_REQUEST);
        const existing = await this.userRepository.findByEmail(email);
        if (existing) throw new CustomError(RESPONSE_MESSAGES.EMAIL_ALREADY_REGISTERED, HTTP_STATUS.CONFLICT);
        return this.userRepository.register(name, email, password);
    }

    async login(email: string, password: string): Promise<User> {
        const authData = await this.userRepository.getUserAuthDataByEmail(email);
        if (!authData) throw new CustomError(RESPONSE_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

        const isMatch = await bcrypt.compare(password, authData.passwordHash);
        if (!isMatch) throw new CustomError(RESPONSE_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

        return authData.user;
    }

    async getUserById(id: string): Promise<User | null> {
        return this.userRepository.getUserById(id);
    }

    async getAllUsers(): Promise<User[]> {
        return await this.userRepository.getAllUsers();
    }

    async getUsersByIds(userIds: string[]): Promise<User[]> {
        return await this.userRepository.getUsersByIds(userIds);
    }

    async removeUser(id: string): Promise<void> {
        await this.userRepository.removeUser(id);
    }

    async updateProfile(id: string, name: string, avatarPublicId?: string, avatarResourceType?: string): Promise<User | null> {
        if (!name || name.trim() === '') throw new CustomError(RESPONSE_MESSAGES.NAME_CANNOT_BE_EMPTY, HTTP_STATUS.BAD_REQUEST);
        return this.userRepository.updateProfile(id, name.trim(), avatarPublicId, avatarResourceType);
    }
}
