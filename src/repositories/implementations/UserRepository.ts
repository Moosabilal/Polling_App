import { injectable } from 'inversify';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../../types';
import { UserModel } from '../../models/User';

@injectable()
export class UserRepository implements IUserRepository {
    async register(name: string, email: string, password: string): Promise<User> {
        const user = new UserModel({ name, email, password });
        await user.save();
        return { id: user._id.toString(), name: user.name, email: user.email };
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ email });
        if (!user) return null;
        return { id: user._id.toString(), name: user.name, email: user.email };
    }

    async getUserById(id: string): Promise<User | null> {
        const user = await UserModel.findById(id);
        if (!user) return null;
        return { id: user._id.toString(), name: user.name, email: user.email };
    }

    async removeUser(id: string): Promise<void> {
        await UserModel.findByIdAndDelete(id);
    }

    async getAllUsers(): Promise<User[]> {
        const users = await UserModel.find();
        return users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email }));
    }
}
