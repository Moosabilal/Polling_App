import { User } from '../../types';

export interface IUserService {
    register(name: string, email: string, password: string): Promise<User>;
    login(email: string, password: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    removeUser(id: string): Promise<void>;
    updateProfile(id: string, name: string, avatarUrl?: string): Promise<User | null>;
}
