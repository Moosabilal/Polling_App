import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.js';
import { IUserService } from '../interfaces/IUserService.js';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository.js';
import { User } from '../../types/index.js';
import { UserModel } from '../../models/User.js';
import { UserMapper } from '../../mappers/UserMapper.js';

@injectable()
export class UserService implements IUserService {
    constructor(@inject(TYPES.IUserRepository) private userRepository: IUserRepository) { }

    async register(name: string, email: string, password: string): Promise<User> {
        if (!name || !email || !password) throw new Error('All fields are required');
        const existing = await this.userRepository.findByEmail(email);
        if (existing) throw new Error('Email already registered');
        return this.userRepository.register(name, email, password);
    }

    async login(email: string, password: string): Promise<User | null> {
        const userDoc = await UserModel.findOne({ email });
        if (!userDoc) return null;

        const isMatch = await userDoc.comparePassword(password);
        if (!isMatch) return null;

        return UserMapper.toDomain(userDoc);
    }

    async getUserById(id: string): Promise<User | null> {
        return this.userRepository.getUserById(id);
    }

    async getAllUsers(): Promise<User[]> {
        return await this.userRepository.getAllUsers();
    }

    async removeUser(id: string): Promise<void> {
        await this.userRepository.removeUser(id);
    }

    async updateProfile(id: string, name: string, avatarPublicId?: string, avatarResourceType?: string): Promise<User | null> {
        if (!name || name.trim() === '') throw new Error('Name cannot be empty');
        return this.userRepository.updateProfile(id, name.trim(), avatarPublicId, avatarResourceType);
    }
}
