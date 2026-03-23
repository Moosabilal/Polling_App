import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types';
import { IUserService } from '../interfaces/IUserService';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { User } from '../../types';
import { UserModel } from '../../models/User';

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

        return { id: userDoc._id.toString(), name: userDoc.name, email: userDoc.email };
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
}
