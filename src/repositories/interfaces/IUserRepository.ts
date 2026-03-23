import { User } from '../../types';

export interface IUserRepository {
    register(name: string, email: string, password: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    removeUser(id: string): Promise<void>;
    getAllUsers(): Promise<User[]>;
}
