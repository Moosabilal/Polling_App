import { injectable } from 'inversify';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User, UserUpdatePayload } from '../../types';
import { UserModel } from '../../models/User';
import { UserMapper } from '../../mappers/UserMapper';

@injectable()
export class UserRepository implements IUserRepository {
    async register(name: string, email: string, password: string): Promise<User> {
        const user = new UserModel({ name, email, password });
        await user.save();
        return UserMapper.toDomain(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ email });
        if (!user) return null;
        return UserMapper.toDomain(user);
    }

    async getUserById(id: string): Promise<User | null> {
        const user = await UserModel.findById(id);
        if (!user) return null;
        return UserMapper.toDomain(user);
    }

    async removeUser(id: string): Promise<void> {
        await UserModel.findByIdAndDelete(id);
    }

    async getAllUsers(): Promise<User[]> {
        const users = await UserModel.find();
        return users.map(u => UserMapper.toDomain(u));
    }

    async updateProfile(id: string, name: string, avatarPublicId?: string, avatarResourceType?: string): Promise<User | null> {
        const updateData: UserUpdatePayload = { name };
        if (avatarPublicId) updateData.avatarPublicId = avatarPublicId;
        if (avatarResourceType) updateData.avatarResourceType = avatarResourceType;

        const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!user) return null;
        return UserMapper.toDomain(user);
    }
}
