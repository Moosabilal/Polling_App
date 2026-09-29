import { User } from '../types/index.js';
import { Document } from 'mongoose';
import { IUser } from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

export class UserMapper {
    static toDomain(userDoc: Document & IUser): User {
        let avatarUrl = '';
        if (userDoc.avatarPublicId) {
            const resourceType = userDoc.avatarResourceType || 'image';
            avatarUrl = cloudinary.utils.url(userDoc.avatarPublicId, {
                resource_type: resourceType,
                type: 'authenticated',
                sign_url: true,
                secure: true
            });
        } else {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userDoc.name)}&background=random`;
        }

        return {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            avatarUrl,
            avatarPublicId: userDoc.avatarPublicId,
            avatarResourceType: userDoc.avatarResourceType
        };
    }

    /** Strips internal/sensitive fields — safe to send to the frontend */
    static toDTO(user: User): { id: string; name: string; email: string; avatarUrl?: string } {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl
        };
    }
}
