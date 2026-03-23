import { injectable } from 'inversify';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../../types';
import { UserModel } from '../../models/User';

@injectable()
export class UserRepository implements IUserRepository {
    async register(name: string, email: string, password: string): Promise<User> {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
        const user = new UserModel({ name, email, password, avatarUrl });
        await user.save();
        return { id: user._id.toString(), name: user.name, email: user.email, avatarUrl: user.avatarUrl };
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ email });
        if (!user) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, avatarUrl: user.avatarUrl };
    }

    async getUserById(id: string): Promise<User | null> {
        const user = await UserModel.findById(id);
        if (!user) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, avatarUrl: user.avatarUrl };
    }

    async removeUser(id: string): Promise<void> {
        await UserModel.findByIdAndDelete(id);
    }

    async getAllUsers(): Promise<User[]> {
        const users = await UserModel.find();
        return users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, avatarUrl: u.avatarUrl }));
    }

    async updateProfile(id: string, name: string, avatarUrl?: string): Promise<User | null> {
        const updateData: any = { name };
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!user) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, avatarUrl: user.avatarUrl };
    }
}
