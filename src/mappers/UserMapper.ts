import { User } from '../types';
import { Document } from 'mongoose';
import { IUser } from '../models/User';
import { v2 as cloudinary } from 'cloudinary';

export class UserMapper {
    static toDomain(userDoc: Document & IUser): User {
        let avatarUrl = '';
        if (userDoc.avatarPublicId) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dpcgcvfdp';
            const resourceType = userDoc.avatarResourceType || 'image';
            // Generate a signed authenticated URL valid for a certain period
            // Note: Since we are not passing sign_url in a complex way, we can use the cloudinary SDK util
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
}
