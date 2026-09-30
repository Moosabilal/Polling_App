import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.ts';
import { IUserService } from '../interfaces/IUserService.ts';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository.ts';
import { User } from '../../types/index.ts';
import bcrypt from 'bcryptjs';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '../../utils/constants.ts';
import { CustomError } from '../../utils/CustomError.ts';
import { UserMapper } from '../../mappers/UserMapper.ts';

@injectable()
export class UserService implements IUserService {
    constructor(@inject(TYPES.IUserRepository) private _userRepository: IUserRepository) { }

    async register(name: string, email: string, password: string): Promise<User> {
        if (!name || !email || !password) throw new CustomError(RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED, HTTP_STATUS.BAD_REQUEST);
        const existing = await this._userRepository.findByEmail(email);
        if (existing) throw new CustomError(RESPONSE_MESSAGES.EMAIL_ALREADY_REGISTERED, HTTP_STATUS.CONFLICT);
        const user = await this._userRepository.register(name, email, password);
        return UserMapper.toDTO(user);
    }

    async login(email: string, password: string): Promise<User> {
        const authData = await this._userRepository.getUserAuthDataByEmail(email);
        if (!authData) throw new CustomError(RESPONSE_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

        const isMatch = await bcrypt.compare(password, authData.passwordHash);
        if (!isMatch) throw new CustomError(RESPONSE_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

        return UserMapper.toDTO(authData.user);
    }

    async getUserById(id: string): Promise<User | null> {
        const user = await this._userRepository.getUserById(id);
        if (!user) return null;
        return UserMapper.toDTO(user);
    }

    async getAllUsers(): Promise<User[]> {
        const users = await this._userRepository.getAllUsers();
        return users.map(u => UserMapper.toDTO(u));
    }

    async getUsersByIds(userIds: string[]): Promise<User[]> {
        const users = await this._userRepository.getUsersByIds(userIds);
        return users.map(u => UserMapper.toDTO(u));
    }

    async removeUser(id: string): Promise<void> {
        await this._userRepository.removeUser(id);
    }

    async updateProfile(id: string, name: string, avatarPublicId?: string, avatarResourceType?: string): Promise<User> {
        if (!name || name.trim() === '') throw new CustomError(RESPONSE_MESSAGES.NAME_CANNOT_BE_EMPTY, HTTP_STATUS.BAD_REQUEST);
        const updatedUser = await this._userRepository.updateProfile(id, name.trim(), avatarPublicId, avatarResourceType);
        if (!updatedUser) {
            throw new CustomError(RESPONSE_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }
        return UserMapper.toDTO(updatedUser);
    }
}
